import type { ExecutionContext } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { JwtAuthGuard } from "./jwt-auth.guard";

type MockRequest = {
  headers: Record<string, string | string[] | undefined>;
  originalUrl?: string;
};

function mockContext(request: MockRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  it("skips the Inngest serve endpoint", async () => {
    const guard = new JwtAuthGuard({
      auth: {
        getUser: async () => {
          throw new Error("JWT lookup should be skipped");
        },
      },
    } as unknown as SupabaseClient);

    await expect(
      guard.canActivate(
        mockContext({
          headers: {},
          originalUrl: "/api/inngest?fnId=platform-noop",
        }),
      ),
    ).resolves.toBe(true);
  });

  it("skips internal machine-to-machine endpoints", async () => {
    const guard = new JwtAuthGuard({
      auth: {
        getUser: async () => {
          throw new Error("JWT lookup should be skipped");
        },
      },
    } as unknown as SupabaseClient);

    await expect(
      guard.canActivate(
        mockContext({
          headers: {},
          originalUrl: "/internal/v1/ai/health",
        }),
      ),
    ).resolves.toBe(true);
  });
});
