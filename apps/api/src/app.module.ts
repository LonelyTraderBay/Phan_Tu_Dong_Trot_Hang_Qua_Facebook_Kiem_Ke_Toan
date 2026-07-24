import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import {
  MEMBERSHIPS_REPOSITORY,
  OrgGuard,
  SupabaseMembershipsRepository,
} from "./common/guards/org.guard";
import { HealthModule } from "./modules/health/health.module";
import { IdentityModule } from "./modules/identity/identity.module";

@Module({
  imports: [HealthModule, IdentityModule],
  providers: [
    {
      provide: MEMBERSHIPS_REPOSITORY,
      useClass: SupabaseMembershipsRepository,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: OrgGuard,
    },
  ],
})
export class AppModule {}
