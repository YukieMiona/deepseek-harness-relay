/**
 * The sign-in password, stored as a salted scrypt hash.
 *
 * Verification is deliberately kept off the request hot path: it costs tens of
 * milliseconds by design, and the mobile client opens two WebSockets inside a
 * 3-second budget. Only `POST /relay/login` verifies a password; everything
 * after it presents a signed cookie that verifies with one HMAC.
 * @module dsh-relay/auth/password
 */
import type { PasswordRecord } from '../state.ts';
/**
 * Hash a password for storage.
 * @param password - the plaintext, as typed.
 * @returns the record to persist; the plaintext is never retained.
 */
export declare function hashPassword(password: string): Promise<PasswordRecord>;
/**
 * Verify a candidate password against a stored record.
 * @param record - the stored credential.
 * @param candidate - the plaintext to check.
 * @returns true on a match; comparison is constant time in the hash length.
 */
export declare function verifyPassword(record: PasswordRecord, candidate: string): Promise<boolean>;
//# sourceMappingURL=password.d.ts.map