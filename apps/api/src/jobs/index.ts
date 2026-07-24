export { inngest } from "./inngest.client";
export { metaPersistInbound } from "./functions/meta-persist-inbound";
export { platformNoop } from "./functions/platform-noop";
export { OutboxPublisher, enqueueOutbox } from "./outbox.publisher";
import { metaPersistInbound } from "./functions/meta-persist-inbound";
import { platformNoop } from "./functions/platform-noop";

export const inngestFunctions = [platformNoop, metaPersistInbound];
