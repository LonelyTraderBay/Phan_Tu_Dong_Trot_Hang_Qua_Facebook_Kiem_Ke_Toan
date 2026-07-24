import {
  BadGatewayException,
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';

import { loadEnv, type Env } from '../../config/env';
import { AiRunsService } from '../audit/ai-runs.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { AdvisorAiResponseSchema, type AdvisorSuggestBody } from './dto';

export const ADVISOR_FETCH = Symbol('ADVISOR_FETCH');
export const ADVISOR_ENV = Symbol('ADVISOR_ENV');

type AdvisorEnv = Pick<Env, 'AI_BASE_URL' | 'SERVICE_M2M_KEY'>;
type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'json' | 'text'>>;

const ADVISOR_DISCLAIMER =
  'Advisor chỉ tư vấn; người bán duyệt trước khi đăng, gửi Meta hoặc mua ads.';

@Injectable()
export class AdvisorService {
  private readonly fetchFn: FetchLike;
  private readonly env: AdvisorEnv;

  constructor(
    private readonly featureFlags: FeatureFlagsService,
    private readonly aiRuns: AiRunsService,
    @Optional()
    @Inject(ADVISOR_FETCH)
    fetchFn?: FetchLike,
    @Optional()
    @Inject(ADVISOR_ENV)
    env?: AdvisorEnv,
  ) {
    this.fetchFn = fetchFn ?? fetch;
    this.env = env ?? loadEnv();
  }

  async suggest(input: { orgId: string; body: AdvisorSuggestBody }) {
    if (await this.featureFlags.isEnabled('kill_ai_all', input.orgId)) {
      throw new ServiceUnavailableException({
        code: 'advisor_disabled',
        message: 'AI advisor is disabled by kill_ai_all',
      });
    }

    const aiResponse = await this.callAiAdvisor(input.orgId, input.body);
    const aiRun = await this.aiRuns.writeRun({
      orgId: input.orgId,
      promptVersion: aiResponse.promptVersion,
      model: aiResponse.model,
      tokens: aiResponse.tokens,
      tools: [
        {
          kind: 'advisor',
          adviseOnly: true,
        },
        ...aiResponse.toolsUsed,
      ],
      citations: aiResponse.citations,
      status: 'succeeded',
    });

    return {
      suggestionsText: aiResponse.suggestionsText,
      disclaimer: aiResponse.disclaimer || ADVISOR_DISCLAIMER,
      promptVersion: aiResponse.promptVersion,
      model: aiResponse.model,
      citations: aiResponse.citations,
      aiRun: aiRun.aiRun,
      entitlement: {
        allowed: true,
        note: 'Plan G MVP allows all orgs; add plan flag before GA.',
      },
    };
  }

  private async callAiAdvisor(orgId: string, body: AdvisorSuggestBody) {
    const url = new URL('/internal/v1/ai/advise', this.env.AI_BASE_URL);
    const response = await this.fetchFn(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-service-key': this.env.SERVICE_M2M_KEY,
      },
      body: JSON.stringify({
        orgId,
        goal: body.goal ?? null,
        catalogAggregates: { note: 'catalog aggregate stub from Core MVP' },
        salesAggregates: { note: 'sales aggregate stub from Core MVP' },
      }),
    });

    if (!response.ok) {
      throw new BadGatewayException({
        code: 'advisor_ai_failed',
        message: `AI advisor failed with status ${response.status}`,
        detail: await response.text().catch(() => undefined),
      });
    }

    const parsed = AdvisorAiResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new BadGatewayException({
        code: 'advisor_ai_invalid_response',
        message: 'AI advisor response is invalid',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return parsed.data;
  }
}
