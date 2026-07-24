import { Module } from "@nestjs/common";

import { PermissionsGuard } from "../authz/permissions.guard";
import { IdentityController } from "./identity.controller";
import { IdentityService } from "./identity.service";

@Module({
  controllers: [IdentityController],
  providers: [IdentityService, PermissionsGuard],
})
export class IdentityModule {}
