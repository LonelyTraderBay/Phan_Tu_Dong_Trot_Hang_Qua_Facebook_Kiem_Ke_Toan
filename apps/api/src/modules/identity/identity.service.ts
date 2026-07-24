import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "node:crypto";

import { loadEnv } from "../../config/env";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import type { MembershipRole } from "../../common/guards/org.guard";
import type { CreateInviteBody, CreateOrgBody } from "./dto";

export const IDENTITY_SERVICE_SUPABASE = Symbol("IDENTITY_SERVICE_SUPABASE");
export const IDENTITY_USER_SUPABASE_FACTORY = Symbol(
  "IDENTITY_USER_SUPABASE_FACTORY",
);

const ORGANIZATION_SELECT =
  "id, name, slug, plan, settings_json, timezone, locale, suspended_at, created_at, updated_at";
const MEMBERSHIP_SELECT = "id, org_id, user_id, role";
const ENTITLEMENTS_SELECT =
  "org_id, max_pages, ai_monthly_token_limit, auto_confirm_allowed, updated_at";
const INVITE_SELECT = "id, org_id, email, role, expires_at, created_at";

export type SupabaseLike = Pick<SupabaseClient, "from" | "rpc">;
type UserSupabaseFactory = (accessToken: string) => SupabaseLike;

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

type MembershipRow = {
  id: string;
  org_id: string;
  user_id: string;
  role: MembershipRole;
};

type EntitlementsRow = {
  org_id: string;
  max_pages: number;
  ai_monthly_token_limit: number;
  auto_confirm_allowed: boolean;
  updated_at: string;
};

type InviteRow = {
  id: string;
  org_id: string;
  email: string;
  role: MembershipRole;
  expires_at: string;
  created_at: string;
};

type MembershipWithOrganizationRow = MembershipRow & {
  organizations: OrganizationRow | OrganizationRow[] | null;
};

type CreateOrganizationWithOwnerRow = {
  organization: OrganizationRow;
  membership: MembershipRow;
  entitlements: EntitlementsRow;
};

@Injectable()
export class IdentityService {
  private readonly serviceSupabase: SupabaseLike;
  private readonly userSupabaseFactory: UserSupabaseFactory;

  constructor(
    @Optional()
    @Inject(IDENTITY_SERVICE_SUPABASE)
    serviceSupabase?: SupabaseLike,
    @Optional()
    @Inject(IDENTITY_USER_SUPABASE_FACTORY)
    userSupabaseFactory?: UserSupabaseFactory,
  ) {
    this.serviceSupabase = serviceSupabase ?? createSupabaseServiceClient();
    this.userSupabaseFactory =
      userSupabaseFactory ?? createSupabaseUserClient;
  }

  async createOrganization(user: AuthenticatedUser, body: CreateOrgBody) {
    // RLS cannot authorize the very first organization insert because the owner
    // membership does not exist yet. Keep service-role writes scoped to this
    // atomic bootstrap RPC after JwtAuthGuard has resolved the user.
    const { data, error } = await this.serviceSupabase
      .rpc("create_organization_with_owner", {
        p_name: body.name,
        p_owner_user_id: user.id,
        p_slug: body.slug,
      })
      .single();

    if (error) {
      throwIdentityError(error, "Could not create organization");
    }

    const row = data as CreateOrganizationWithOwnerRow;

    return {
      organization: mapOrganization(row.organization),
      membership: mapMembership(row.membership),
      entitlements: mapEntitlements(row.entitlements),
    };
  }

  async listOrganizations(user: AuthenticatedUser, accessToken: string) {
    const supabase = this.userSupabaseFactory(accessToken);
    const { data, error } = await supabase
      .from("memberships")
      .select(`${MEMBERSHIP_SELECT}, organizations (${ORGANIZATION_SELECT})`)
      .eq("user_id", user.id);

    if (error) {
      throwIdentityError(error, "Could not list organizations");
    }

    return ((data ?? []) as MembershipWithOrganizationRow[])
      .map((row) => {
        const organization = Array.isArray(row.organizations)
          ? row.organizations[0]
          : row.organizations;

        if (!organization) {
          return null;
        }

        return {
          organization: mapOrganization(organization),
          membership: mapMembership(row),
        };
      })
      .filter(
        (
          row,
        ): row is {
          organization: ReturnType<typeof mapOrganization>;
          membership: ReturnType<typeof mapMembership>;
        } => row !== null,
      );
  }

  async createInvite(orgId: string, body: CreateInviteBody) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Membership invite inserts are not granted to authenticated clients yet.
    // OrgGuard and the controller's owner-role check run first; service role is
    // used only to persist the stub invite row.
    const { data, error } = await this.serviceSupabase
      .from("membership_invites")
      .insert({
        org_id: orgId,
        email: body.email,
        role: body.role,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })
      .select(INVITE_SELECT)
      .single();

    if (error) {
      throwIdentityError(error, "Could not create membership invite");
    }

    return { invite: mapInvite(data as InviteRow) };
  }
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

function mapMembership(row: MembershipRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    role: row.role,
  };
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

function mapInvite(row: InviteRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    role: row.role,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function throwIdentityError(error: SupabaseError, message: string): never {
  if (error.code === "23505") {
    throw new ConflictException({
      code: "identity_conflict",
      message,
    });
  }

  throw new InternalServerErrorException({
    code: "identity_write_failed",
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

function createSupabaseUserClient(accessToken: string) {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
