export const portalRolePolicy = {
  viewRoles: ["members", "admin"],
  editRoles: ["admin"],
} as const;

export function hasAnyRole(userRoles: string[] | undefined, allowedRoles: readonly string[]) {
  const roles = userRoles ?? [];
  return allowedRoles.some((role) => roles.includes(role));
}

export function getPortalPermissions(roles: string[] | undefined) {
  return {
    canView: hasAnyRole(roles, portalRolePolicy.viewRoles),
    canEdit: hasAnyRole(roles, portalRolePolicy.editRoles),
  };
}
