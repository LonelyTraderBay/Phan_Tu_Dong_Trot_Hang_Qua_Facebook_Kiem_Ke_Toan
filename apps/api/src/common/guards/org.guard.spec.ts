import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { OrgGuard, type MembershipsRepository } from "./org.guard";

type MockRequest = {
  headers: Record<string, string | string[] | undefined>;
  originalUrl?: string;
  user?: { id: string; email?: string };
};

function mockContext(request: MockRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

function mockMemberships(): MembershipsRepository {
  return {
    findMembership: async () => null,
  };
}

describe("OrgGuard", () => {
  it("rejects missing X-Org-Id", async () => {
    const guard = new OrgGuard(mockMemberships());

    await expect(
      guard.canActivate(mockContext({ headers: {}, user: { id: "u1" } })),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects membership miss", async () => {
    const guard = new OrgGuard(mockMemberships());

    await expect(
      guard.canActivate(
        mockContext({
          headers: { "x-org-id": "11111111-1111-1111-1111-111111111111" },
          user: { id: "u1" },
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
