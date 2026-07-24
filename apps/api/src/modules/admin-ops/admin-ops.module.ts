import { Module } from "@nestjs/common";

import {
  PLATFORM_ADMINS_REPOSITORY,
  PlatformAdminGuard,
  SupabasePlatformAdminsRepository,
} from "../../common/guards/platform-admin.guard";
import { AdminOpsController } from "./admin-ops.controller";
import { AdminOpsService } from "./admin-ops.service";

@Module({
  controllers: [AdminOpsController],
  providers: [
    AdminOpsService,
    PlatformAdminGuard,
    {
      provide: PLATFORM_ADMINS_REPOSITORY,
      useClass: SupabasePlatformAdminsRepository,
    },
  ],
})
export class AdminOpsModule {}
