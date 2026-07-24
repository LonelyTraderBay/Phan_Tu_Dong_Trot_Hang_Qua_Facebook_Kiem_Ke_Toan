export { inngest } from "./inngest.client";
export { knowledgeReindex } from "./functions/knowledge-reindex";
export { metaPersistInbound } from "./functions/meta-persist-inbound";
export { platformNoop } from "./functions/platform-noop";
export { OutboxPublisher, enqueueOutbox } from "./outbox.publisher";
import { knowledgeReindex } from "./functions/knowledge-reindex";
import { metaPersistInbound } from "./functions/meta-persist-inbound";
import { platformNoop } from "./functions/platform-noop";

export const inngestFunctions = [
  platformNoop,
  metaPersistInbound,
  knowledgeReindex,
];
