import { z } from "zod";

export const CompleteMetaOAuthBodySchema = z
  .object({
    code: z.string().trim().min(1),
  })
  .strict();

export type CompleteMetaOAuthBody = z.infer<
  typeof CompleteMetaOAuthBodySchema
>;
