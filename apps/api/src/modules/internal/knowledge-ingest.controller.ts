import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { ServiceKeyGuard } from "../../common/guards/service-key.guard";
import {
  KnowledgeIngestService,
  parseReplaceKnowledgeChunksBody,
} from "./knowledge-ingest.service";

@Controller("internal/v1/knowledge")
@UseGuards(ServiceKeyGuard)
export class KnowledgeIngestController {
  constructor(private readonly knowledgeIngest: KnowledgeIngestService) {}

  @Post("chunks")
  replaceChunks(@Body() body: unknown) {
    return this.knowledgeIngest.replaceChunks(
      parseReplaceKnowledgeChunksBody(body),
    );
  }
}
