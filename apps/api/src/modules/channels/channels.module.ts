import { Module } from "@nestjs/common";

import { createGraphClientFromEnv } from "../../integrations/meta/graph.client";
import { AuditService } from "../audit/audit.service";
import { PermissionsGuard } from "../authz/permissions.guard";
import { ChannelsController } from "./channels.controller";
import { CHANNELS_GRAPH, ChannelsService } from "./channels.service";

@Module({
  controllers: [ChannelsController],
  providers: [
    ChannelsService,
    PermissionsGuard,
    AuditService,
    {
      provide: CHANNELS_GRAPH,
      useFactory: createGraphClientFromEnv,
    },
  ],
})
export class ChannelsModule {}
