import { Module } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { PermissionsGuard } from '../authz/permissions.guard';
import { BillingModule } from '../billing/billing.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [BillingModule],
  controllers: [OrdersController],
  providers: [OrdersService, PermissionsGuard, AuditService],
})
export class OrdersModule {}
