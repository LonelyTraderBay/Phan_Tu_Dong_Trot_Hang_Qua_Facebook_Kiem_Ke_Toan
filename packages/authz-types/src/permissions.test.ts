// packages/authz-types/src/permissions.test.ts
import { describe, expect, it } from "vitest";
import { roleHasPermission } from "./permissions";

describe("roleHasPermission", () => {
  it("owner can invite members", () => {
    expect(roleHasPermission("owner", "members.invite")).toBe(true);
  });
  it("cskh cannot invite members", () => {
    expect(roleHasPermission("cskh", "members.invite")).toBe(false);
  });
  it("kho cannot reply inbox", () => {
    expect(roleHasPermission("kho", "inbox.reply")).toBe(false);
  });
  it("platform ops.suspend only via platform admin path later", () => {
    expect(roleHasPermission("owner", "ops.org.suspend")).toBe(false);
  });
});
