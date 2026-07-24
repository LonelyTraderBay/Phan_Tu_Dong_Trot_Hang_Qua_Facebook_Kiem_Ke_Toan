import { z } from "zod";

export const SetGlobalFlagBodySchema = z
  .object({
    enabled: z.boolean(),
    payloadJson: z.record(z.unknown()).default({}),
  })
  .strict();

export type SetGlobalFlagBody = z.infer<typeof SetGlobalFlagBodySchema>;
