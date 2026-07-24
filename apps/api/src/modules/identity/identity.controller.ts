import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { z } from "zod";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/current-user.decorator";
import { OrgId } from "../../common/decorators/org-id.decorator";
import type { Membership } from "../../common/guards/org.guard";
import {
  CreateInviteBodySchema,
  CreateOrgBodySchema,
} from "./dto";
import { IdentityService } from "./identity.service";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RequestWithMembership = {
  membership?: Membership;
};

@Controller("v1/orgs")
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post()
  createOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.identity.createOrganization(
      user,
      parseBody(CreateOrgBodySchema, body),
    );
  }

  @Get()
  listOrganizations(
    @CurrentUser() user: AuthenticatedUser,
    @Headers("authorization") authorization: string | string[] | undefined,
  ) {
    return this.identity.listOrganizations(
      user,
      getBearerToken(authorization),
    );
  }

  @Post(":orgId/invites")
  createInvite(
    @Param("orgId") orgId: string,
    @OrgId() guardOrgId: string | undefined,
    @Req() request: RequestWithMembership,
    @Body() body: unknown,
  ) {
    if (!UUID_PATTERN.test(orgId)) {
      throw new BadRequestException({
        code: "invalid_org_id",
        message: "orgId route parameter must be a UUID",
      });
    }

    if (orgId !== guardOrgId) {
      throw new BadRequestException({
        code: "org_context_mismatch",
        message: "orgId route parameter must match X-Org-Id",
      });
    }

    if (request.membership?.role !== "owner") {
      throw new ForbiddenException({
        code: "owner_required",
        message: "Only organization owners can invite members",
      });
    }

    return this.identity.createInvite(
      orgId,
      parseBody(CreateInviteBodySchema, body),
    );
  }
}

function parseBody<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  body: unknown,
): z.output<TSchema> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException({
      code: "invalid_request",
      message: "Request body is invalid",
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return parsed.data;
}

function getBearerToken(authorization: string | string[] | undefined) {
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  const token = header?.trim().match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) {
    throw new UnauthorizedException({
      code: "bearer_required",
      message: "Bearer token is required",
    });
  }

  return token;
}
