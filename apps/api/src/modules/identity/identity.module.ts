import { Module } from "@nestjs/common";

import { PermissionsGuard } from "../authz/permissions.guard";
import { AuditService } from "../audit/audit.service";
import { IdentityController, InvitesController } from "./identity.controller";
import { IdentityService } from "./identity.service";

@Module({
  controllers: [IdentityController, InvitesController],
  providers: [IdentityService, PermissionsGuard, AuditService],
})
export class IdentityModule {}
