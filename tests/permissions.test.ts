import { describe, expect, it } from "vitest";
import { hasPermission, rolePermissions } from "../src/lib/auth/permissions";

describe("permissions", () => {
  it("gives owner all permissions", () => {
    expect(rolePermissions.Owner).toContain("manage_system");
    expect(rolePermissions.Owner).toContain("manage_integrations");
  });

  it("checks explicit permissions", () => {
    expect(hasPermission(["view_analytics"], "view_analytics")).toBe(true);
    expect(hasPermission(["view_analytics"], "manage_users")).toBe(false);
  });
});

