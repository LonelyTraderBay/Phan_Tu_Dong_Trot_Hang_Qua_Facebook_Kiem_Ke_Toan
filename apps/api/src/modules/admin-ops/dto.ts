import { z } from "zod";

import { PLAN_CATALOG } from "../billing/plan-catalog";

export const SetGlobalFlagBodySchema = z
  .object({
    enabled: z.boolean(),
    payloadJson: z.record(z.unknown()).default({}),
  })
  .strict();

export type SetGlobalFlagBody = z.infer<typeof SetGlobalFlagBodySchema>;

export const UpdateOrgPlanBodySchema = z
  .object({
    plan: z.enum(Object.keys(PLAN_CATALOG) as [string, ...string[]]),
  })
  .strict();

export type UpdateOrgPlanBody = z.infer<typeof UpdateOrgPlanBodySchema>;
