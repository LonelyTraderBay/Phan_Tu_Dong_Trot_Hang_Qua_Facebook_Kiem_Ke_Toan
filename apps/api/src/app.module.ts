import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import {
  MEMBERSHIPS_REPOSITORY,
  OrgGuard,
  SupabaseMembershipsRepository,
} from './common/guards/org.guard';
import { AdminOpsModule } from './modules/admin-ops/admin-ops.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { InternalModule } from './modules/internal/internal.module';

@Module({
  imports: [
    HealthModule,
    IdentityModule,
    AdminOpsModule,
    CatalogModule,
    ChannelsModule,
    InboxModule,
    FeatureFlagsModule,
    InternalModule,
  ],
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
