import { Module } from "@nestjs/common";

import { OutboxPublisher } from "../../jobs";
import { AiProxyController } from "./ai-proxy.controller";
import { AiProxyService } from "./ai-proxy.service";
import { KnowledgeIngestController } from "./knowledge-ingest.controller";
import { KnowledgeIngestService } from "./knowledge-ingest.service";
import { OutboxController } from "./outbox.controller";

@Module({
  controllers: [OutboxController, AiProxyController, KnowledgeIngestController],
  providers: [OutboxPublisher, AiProxyService, KnowledgeIngestService],
  exports: [OutboxPublisher],
})
export class InternalModule {}
