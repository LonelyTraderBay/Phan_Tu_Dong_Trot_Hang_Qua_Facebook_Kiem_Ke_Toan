import { Module } from "@nestjs/common";

import { OutboxPublisher } from "../../jobs";
import { AiRunsService } from "../audit/ai-runs.service";
import { AiRunsController } from "./ai-runs.controller";
import { AiProxyController } from "./ai-proxy.controller";
import { AiProxyService } from "./ai-proxy.service";
import { AiToolsController } from "./ai-tools.controller";
import { AiToolsService } from "./ai-tools.service";
import { KnowledgeIngestController } from "./knowledge-ingest.controller";
import { KnowledgeIngestService } from "./knowledge-ingest.service";
import { OutboxController } from "./outbox.controller";

@Module({
  controllers: [
    OutboxController,
    AiProxyController,
    AiRunsController,
    AiToolsController,
    KnowledgeIngestController,
  ],
  providers: [
    OutboxPublisher,
    AiProxyService,
    AiRunsService,
    AiToolsService,
    KnowledgeIngestService,
  ],
  exports: [OutboxPublisher],
})
export class InternalModule {}
