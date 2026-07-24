import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { z } from "zod";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/current-user.decorator";
import { OrgId } from "../../common/decorators/org-id.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { PermissionsGuard } from "../authz/permissions.guard";
import { ChannelsService } from "./channels.service";
import { CompleteMetaOAuthBodySchema } from "./dto";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller("v1/channels")
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Get("meta/oauth-url")
  @UseGuards(PermissionsGuard)
  @RequirePermission("channels.connect")
  getMetaOAuthUrl() {
    return this.channels.getMetaOAuthUrl();
  }

  @Post("meta/complete")
  @UseGuards(PermissionsGuard)
  @RequirePermission("channels.connect")
  completeMetaOAuth(
    @OrgId() orgId: string | undefined,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() body: unknown,
  ) {
    return this.channels.completeOAuth({
      orgId: requireOrgId(orgId),
      userId: requireUserId(user),
      code: parseBody(CompleteMetaOAuthBodySchema, body).code,
    });
  }

  @Get()
  listChannels(@OrgId() orgId: string | undefined) {
    return this.channels.listConnections(requireOrgId(orgId));
  }

  @Post(":id/revoke")
  @UseGuards(PermissionsGuard)
  @RequirePermission("channels.connect")
  revokeChannel(
    @OrgId() orgId: string | undefined,
    @Param("id") connectionId: string,
  ) {
    if (!UUID_PATTERN.test(connectionId)) {
      throw new BadRequestException({
        code: "invalid_channel_connection_id",
        message: "id route parameter must be a UUID",
      });
    }

    return this.channels.revokeConnection(requireOrgId(orgId), connectionId);
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

function requireOrgId(orgId: string | undefined) {
  if (!orgId) {
    throw new BadRequestException({
      code: "missing_org_context",
      message: "Organization context is required",
    });
  }

  return orgId;
}

function requireUserId(user: AuthenticatedUser | undefined) {
  if (!user?.id) {
    throw new UnauthorizedException({
      code: "user_required",
      message: "Authenticated user is required",
    });
  }

  return user.id;
}
