/** Mirrors server/src/types/roleCode.ts — the 9 human roles, verbatim from SRS section 2.3.1. */
export const ROLE_CODES = [
  'ADMIN',
  'MERCH',
  'IE',
  'COST',
  'PROC',
  'STORE',
  'PROD',
  'AUDIT',
  'VIEW',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];
