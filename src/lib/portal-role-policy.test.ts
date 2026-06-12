import { describe, expect, it } from "vitest";
import { getPortalPermissions, portalRolePolicy } from "@/lib/portal-role-policy";

describe("Portal role policy", () => {
  it("allows members to view without editing", () => {
    expect(getPortalPermissions(["members"])).toEqual({
      canView: true,
      canEdit: false,
    });
  });

  it("allows admins to view and edit", () => {
    expect(getPortalPermissions(["admin"])).toEqual({
      canView: true,
      canEdit: true,
    });
  });

  it("denies unrelated or missing roles", () => {
    expect(getPortalPermissions(["guest"])).toEqual({
      canView: false,
      canEdit: false,
    });
    expect(getPortalPermissions(undefined)).toEqual({
      canView: false,
      canEdit: false,
    });
  });

  it("keeps the policy centralized", () => {
    expect(portalRolePolicy).toEqual({
      viewRoles: ["members", "admin"],
      editRoles: ["admin"],
    });
  });
});
