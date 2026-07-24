import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { ProblemDetailsFilter } from "./common/filters/problem-details.filter";
import { createRedactingLogger } from "./common/logging/redacting-logger";
import { idempotencyMiddleware } from "./common/middleware/idempotency.middleware";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware";
import { securityHeadersMiddleware } from "./common/middleware/security-headers.middleware";
import { traceparentMiddleware } from "./common/middleware/traceparent.middleware";
import { loadEnv } from "./config/env";

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, {
    logger: createRedactingLogger(),
  });

  app.enableShutdownHooks();
  app.use(requestIdMiddleware);
  app.use(traceparentMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(idempotencyMiddleware);
  app.useGlobalFilters(new ProblemDetailsFilter());

  await app.listen(env.PORT);
}

void bootstrap();
