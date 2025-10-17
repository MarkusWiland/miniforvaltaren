// lib/acl.ts
export const PERMS = {
  TENANT_CREATE: ["OWNER","ADMIN","MANAGER"],
  TENANT_DELETE: ["OWNER","ADMIN","MANAGER"],
  LEASE_CREATE:  ["OWNER","ADMIN","MANAGER"],
  INVOICE_CREATE:["OWNER","ADMIN","ACCOUNTANT"],
  INVOICE_MARK_PAID:["OWNER","ADMIN","ACCOUNTANT"],
  TICKET_CREATE: ["OWNER","ADMIN","MANAGER","STAFF"],
  TICKET_UPDATE: ["OWNER","ADMIN","MANAGER","STAFF"],
  TICKET_DELETE: ["OWNER","ADMIN"],
  SETTINGS:      ["OWNER","ADMIN"],
} as const;

export type Perm = keyof typeof PERMS;

export function hasRoleForPerm(role: string, perm: Perm) {
  return PERMS[perm].includes(role as any);
}
