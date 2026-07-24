import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { loadEnv } from "../../config/env";
import { AuditService, type WriteAuditInput } from "../audit/audit.service";
import { EntitlementsService } from "../billing/entitlements.service";
import { isPlanSlug, type PlanSlug } from "../billing/plan-catalog";
import type { SetGlobalFlagBody, UpdateOrgPlanBody } from "./dto";

export const ADMIN_OPS_SUPABASE = Symbol("ADMIN_OPS_SUPABASE");

const ORGANIZATION_SELECT =
  "id, name, slug, plan, settings_json, timezone, locale, suspended_at, created_at, updated_at";
const FEATURE_FLAG_SELECT = "id, key, org_id, enabled, payload_json";
const GLOBAL_KILL_SWITCH_KEYS = [
  "kill_ai_outbound",
  "kill_ai_all",
  "kill_auto_confirm",
] as const;

export type SupabaseLike = Pick<SupabaseClient, "from">;
export type AuditWriter = {
  writeAudit(input: WriteAuditInput): Promise<unknown>;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings_json: Record<string, unknown>;
  timezone: string;
  locale: string;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
};

type FeatureFlagRow = {
  id: string;
  key: string;
  org_id: string | null;
  enabled: boolean;
  payload_json: Record<string, unknown>;
};

@Injectable()
export class AdminOpsService {
  private readonly supabase: SupabaseLike;
  private readonly audit?: AuditWriter;
  private readonly entitlements?: Pick<EntitlementsService, "syncPlanEntitlements">;

  constructor(
    @Optional()
    @Inject(ADMIN_OPS_SUPABASE)
    supabase?: SupabaseLike,
    @Optional()
    @Inject(AuditService)
    audit?: AuditWriter,
    @Optional()
    @Inject(EntitlementsService)
    entitlements?: Pick<EntitlementsService, "syncPlanEntitlements">,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
    this.audit = audit;
    this.entitlements = entitlements;
  }

  async listOrganizations() {
    const { data, error } = await this.supabase
      .from("organizations")
      .select(ORGANIZATION_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      throwAdminOpsError(error, "Could not list organizations");
    }

    return {
      organizations: ((data ?? []) as OrganizationRow[]).map(mapOrganization),
    };
  }

  async suspendOrganization(orgId: string, suspendedAt = new Date()) {
    const timestamp = suspendedAt.toISOString();
    const { data, error } = await this.supabase
      .from("organizations")
      .update({ suspended_at: timestamp, updated_at: timestamp })
      .eq("id", orgId)
      .select(ORGANIZATION_SELECT)
      .maybeSingle();

    if (error) {
      throwAdminOpsError(error, "Could not suspend organization");
    }
    if (!data) {
      throw new NotFoundException({
        code: "organization_not_found",
        message: "Organization was not found",
      });
    }

    await this.audit?.writeAudit({
      orgId,
      action: "organization.suspended",
      entityType: "organization",
      entityId: orgId,
      meta: { suspendedAt: timestamp },
    });

    return { organization: mapOrganization(data as OrganizationRow) };
  }

  async updateOrganizationPlan(
    orgId: string,
    body: UpdateOrgPlanBody,
    updatedAt = new Date(),
  ) {
    const plan = parsePlan(body.plan);
    const timestamp = updatedAt.toISOString();
    const { data, error } = await this.supabase
      .from("organizations")
      .update({ plan, updated_at: timestamp })
      .eq("id", orgId)
      .select(ORGANIZATION_SELECT)
      .maybeSingle();

    if (error) {
      throwAdminOpsError(error, "Could not update organization plan");
    }
    if (!data) {
      throw new NotFoundException({
        code: "organization_not_found",
        message: "Organization was not found",
      });
    }

    const entitlements = await this.entitlements?.syncPlanEntitlements(
      orgId,
      plan,
      updatedAt,
    );
    await this.audit?.writeAudit({
      orgId,
      action: "organization.plan_updated",
      entityType: "organization",
      entityId: orgId,
      meta: { plan },
    });

    return {
      organization: mapOrganization(data as OrganizationRow),
      entitlements,
    };
  }

  async setGlobalFlag(key: string, body: SetGlobalFlagBody) {
    if (!isGlobalKillSwitchKey(key)) {
      throw new BadRequestException({
        code: "invalid_global_flag",
        message: "Unsupported global kill switch",
      });
    }

    const existing = await this.supabase
      .from("feature_flags")
      .update({
        enabled: body.enabled,
        payload_json: body.payloadJson,
      })
      .eq("key", key)
      .is("org_id", null)
      .select(FEATURE_FLAG_SELECT)
      .maybeSingle();

    if (existing.error) {
      throwAdminOpsError(existing.error, "Could not update global flag");
    }
    if (existing.data) {
      return { flag: mapFeatureFlag(existing.data as FeatureFlagRow) };
    }

    const { data, error } = await this.supabase
      .from("feature_flags")
      .insert({
        key,
        org_id: null,
        enabled: body.enabled,
        payload_json: body.payloadJson,
      })
      .select(FEATURE_FLAG_SELECT)
      .single();

    if (error) {
      throwAdminOpsError(error, "Could not create global flag");
    }

    return { flag: mapFeatureFlag(data as FeatureFlagRow) };
  }
}

function isGlobalKillSwitchKey(
  key: string,
): key is (typeof GLOBAL_KILL_SWITCH_KEYS)[number] {
  return (GLOBAL_KILL_SWITCH_KEYS as readonly string[]).includes(key);
}

function parsePlan(plan: string): PlanSlug {
  if (!isPlanSlug(plan)) {
    throw new BadRequestException({
      code: "invalid_plan",
      message: "Unsupported organization plan",
    });
  }

  return plan;
}

function mapOrganization(row: OrganizationRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    settingsJson: row.settings_json,
    timezone: row.timezone,
    locale: row.locale,
    suspendedAt: row.suspended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFeatureFlag(row: FeatureFlagRow) {
  return {
    id: row.id,
    key: row.key,
    orgId: row.org_id,
    enabled: row.enabled,
    payloadJson: row.payload_json,
  };
}

function throwAdminOpsError(error: SupabaseError, message: string): never {
  throw new InternalServerErrorException({
    code: "admin_ops_failed",
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
