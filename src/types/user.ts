export const ROLES = ['guest', 'user', 'premium', 'editor', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_HIERARCHY: Record<Role, number> = {
  guest: 0,
  user: 1,
  premium: 2,
  editor: 3,
  admin: 4,
};

export const hasRole = (userRole: Role, required: Role): boolean =>
  ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}
