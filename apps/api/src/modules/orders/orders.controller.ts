import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { z } from 'zod';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import type { RequestWithIdempotencyKey } from '../../common/middleware/idempotency.middleware';
import { PermissionsGuard } from '../authz/permissions.guard';
import {
  CreateDraftOrderBodySchema,
  ListOrdersQuerySchema,
} from './dto';
import { OrdersService } from './orders.service';

type OrdersRequest = RequestWithIdempotencyKey & {
  originalUrl?: string;
  url?: string;
};

@Controller('v1/orders')
@UseGuards(PermissionsGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @RequirePermission('orders.read')
  listOrders(
    @OrgId() orgId: string | undefined,
    @Query() query: unknown,
  ) {
    const parsed = parseBody(ListOrdersQuerySchema, query);
    return this.orders.listOrders({
      orgId: requireOrgId(orgId),
      status: parsed.status,
    });
  }

  @Get(':orderId')
  @RequirePermission('orders.read')
  getOrder(
    @OrgId() orgId: string | undefined,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orders.getOrder({
      orgId: requireOrgId(orgId),
      orderId,
    });
  }

  @Post()
  @RequirePermission('orders.write')
  createDraftOrder(
    @OrgId() orgId: string | undefined,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: OrdersRequest,
    @Body() body: unknown,
  ) {
    return this.orders.createDraftOrder({
      orgId: requireOrgId(orgId),
      actorUserId: requireUser(user).id,
      body: parseBody(CreateDraftOrderBodySchema, body),
      idempotencyKey: request.idempotencyKey,
      path: requestPath(request),
    });
  }

  @Post(':orderId/confirm')
  @RequirePermission('orders.confirm')
  confirmOrder(
    @OrgId() orgId: string | undefined,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: OrdersRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orders.confirmOrder({
      orgId: requireOrgId(orgId),
      orderId,
      actorUserId: requireUser(user).id,
      idempotencyKey: request.idempotencyKey,
      path: requestPath(request),
    });
  }

  @Post(':orderId/cancel')
  @RequirePermission('orders.write')
  cancelOrder(
    @OrgId() orgId: string | undefined,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orders.cancelOrder({
      orgId: requireOrgId(orgId),
      orderId,
      actorUserId: requireUser(user).id,
    });
  }

  @Post(':orderId/ship')
  @RequirePermission('orders.write')
  shipOrder(
    @OrgId() orgId: string | undefined,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orders.shipOrder({
      orgId: requireOrgId(orgId),
      orderId,
      actorUserId: requireUser(user).id,
    });
  }
}

function parseBody<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  body: unknown,
): z.output<TSchema> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException({
      code: 'invalid_request',
      message: 'Request body is invalid',
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  return parsed.data;
}

function requireOrgId(orgId: string | undefined) {
  if (!orgId) {
    throw new BadRequestException({
      code: 'missing_org_context',
      message: 'Organization context is required',
    });
  }

  return orgId;
}

function requireUser(user: AuthenticatedUser | undefined) {
  if (!user) {
    throw new BadRequestException({
      code: 'missing_user_context',
      message: 'Authenticated user context is required',
    });
  }

  return user;
}

function requestPath(request: OrdersRequest) {
  return (request.originalUrl ?? request.url ?? '').split('?')[0];
}
