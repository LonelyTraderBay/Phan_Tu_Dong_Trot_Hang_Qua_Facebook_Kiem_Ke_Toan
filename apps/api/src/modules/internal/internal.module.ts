import { Module } from "@nestjs/common";

import { OutboxPublisher } from "../../jobs";
import { OutboxController } from "./outbox.controller";

@Module({
  controllers: [OutboxController],
  providers: [OutboxPublisher],
  exports: [OutboxPublisher],
})
export class InternalModule {}
