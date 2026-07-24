import { Module } from "@nestjs/common";

import { PermissionsGuard } from "../authz/permissions.guard";
import { AuditService } from "../audit/audit.service";
import { IdentityController } from "./identity.controller";
import { IdentityService } from "./identity.service";

@Module({
  controllers: [IdentityController],
  providers: [IdentityService, PermissionsGuard, AuditService],
})
export class IdentityModule {}
