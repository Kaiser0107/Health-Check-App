/**
 * Backward compatibility alias for admin users.
 * Prefer importing from constants/adminUsers.ts
 */
import { ADMIN_USERNAMES } from './adminUsers';

export const ADMIN_EMAILS: string[] = ADMIN_USERNAMES.map(
  (u) => `${u.toLowerCase()}@healthcheck.local`
);
