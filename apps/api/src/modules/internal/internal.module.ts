import { Module } from "@nestjs/common";

import { OutboxPublisher } from "../../jobs";
import { AiProxyController } from "./ai-proxy.controller";
import { AiProxyService } from "./ai-proxy.service";
import { OutboxController } from "./outbox.controller";

@Module({
  controllers: [OutboxController, AiProxyController],
  providers: [OutboxPublisher, AiProxyService],
  exports: [OutboxPublisher],
})
export class InternalModule {}
