import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { loadEnv } from "../../config/env";

export const ENTITLEMENTS_SUPABASE = Symbol("ENTITLEMENTS_SUPABASE");

const ENTITLEMENTS_SELECT =
  "org_id, max_pages, ai_monthly_token_limit, auto_confirm_allowed, updated_at";

export type SupabaseLike = Pick<SupabaseClient, "from">;

type SupabaseError = {
  code?: string;
  message?: string;
};

type EntitlementsRow = {
  org_id: string;
  max_pages: number;
  ai_monthly_token_limit: number;
  auto_confirm_allowed: boolean;
  updated_at: string;
};

@Injectable()
export class EntitlementsService {
  private readonly supabase: SupabaseLike;

  constructor(
    @Optional()
    @Inject(ENTITLEMENTS_SUPABASE)
    supabase?: SupabaseLike,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
  }

  async getEntitlements(orgId: string) {
    const { data, error } = await this.supabase
      .from("entitlements")
      .select(ENTITLEMENTS_SELECT)
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) {
      throwEntitlementsError(error, "Could not read entitlements");
    }
    if (!data) {
      throw new NotFoundException({
        code: "entitlements_not_found",
        message: "Entitlements were not found",
      });
    }

    return mapEntitlements(data as EntitlementsRow);
  }
}

function mapEntitlements(row: EntitlementsRow) {
  return {
    orgId: row.org_id,
    maxPages: row.max_pages,
    aiMonthlyTokenLimit: Number(row.ai_monthly_token_limit),
    autoConfirmAllowed: row.auto_confirm_allowed,
    updatedAt: row.updated_at,
  };
}

function throwEntitlementsError(error: SupabaseError, message: string): never {
  throw new InternalServerErrorException({
    code: "entitlements_read_failed",
    message,
  });
}

function createSupabaseServiceClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
