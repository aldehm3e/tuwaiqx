export const permissions = [
  "manage_system",
  "manage_users",
  "manage_bots",
  "manage_knowledge",
  "manage_conversations",
  "manage_tickets",
  "view_analytics",
  "manage_integrations"
] as const;

export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<string, Permission[]> = {
  Owner: [...permissions],
  Admin: [
    "manage_bots",
    "manage_knowledge",
    "manage_conversations",
    "manage_tickets",
    "view_analytics",
    "manage_integrations"
  ],
  "Knowledge Manager": ["manage_knowledge", "manage_bots", "view_analytics"],
  "Support Agent": ["manage_conversations", "manage_tickets"],
  Viewer: ["view_analytics"]
};

export function hasPermission(userPermissions: string[], permission: Permission) {
  return userPermissions.includes(permission);
}

