import { Module } from "@nestjs/common";

import { AiTokenUsageService } from "./ai-token-usage.service";
import { EntitlementsService } from "./entitlements.service";

@Module({
  providers: [AiTokenUsageService, EntitlementsService],
  exports: [AiTokenUsageService, EntitlementsService],
})
export class BillingModule {}
