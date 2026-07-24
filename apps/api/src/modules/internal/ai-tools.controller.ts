import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { ServiceKeyGuard } from "../../common/guards/service-key.guard";
import {
  AiToolsService,
  parseCreateDraftOrderToolBody,
  parseGetProductToolBody,
} from "./ai-tools.service";

@Controller("internal/v1/tools")
@UseGuards(ServiceKeyGuard)
export class AiToolsController {
  constructor(private readonly aiTools: AiToolsService) {}

  @Post("get-product")
  getProduct(@Body() body: unknown) {
    return this.aiTools.getProduct(parseGetProductToolBody(body));
  }

  @Post("create-draft-order")
  createDraftOrder(@Body() body: unknown) {
    return this.aiTools.createDraftOrder(parseCreateDraftOrderToolBody(body));
  }
}
