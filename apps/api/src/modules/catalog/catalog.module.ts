import { Module } from '@nestjs/common';

import { PermissionsGuard } from '../authz/permissions.guard';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, PermissionsGuard],
})
export class CatalogModule {}
