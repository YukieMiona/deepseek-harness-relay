/**
 * Signed session cookies and device bearer tokens.
 *
 * Both verify with one HMAC against an in-memory key, because the mobile
 * client opens two WebSockets inside a 3-second budget and then calls
 * `host.describe`: anything that touches the filesystem or re-derives a
 * password hash on that path turns a working connection into a backoff loop.
 *
 * Rotating the signing key invalidates every cookie and every device token at
 * once — that is what "sign out everywhere" does.
 * @module dsh-relay/auth/tokens
 */
/** Fields carried inside a signed session cookie. */
export interface SessionClaims {
    /** Subject: `password` for a browser sign-in, or a device id. */
    readonly subject: string;
    /** Epoch millis the cookie was issued. */
    readonly issuedAt: number;
    /** Epoch millis the cookie stops being accepted. */
    readonly expiresAt: number;
}
/**
 * Compare two strings without leaking their difference through timing.
 * @param a - first value.
 * @param b - second value.
 * @returns true when the values are byte-identical.
 */
export declare function constantTimeEqual(a: string, b: string): boolean;
/**
 * Mint a new bearer token.
 * @returns a URL-safe token; only its hash is ever stored.
 */
export declare function mintToken(): string;
/**
 * Mint a new device id.
 * @returns a short opaque id, also the revocation handle.
 */
export declare function mintDeviceId(): string;
/**
 * Hash a bearer token for storage and for the in-memory lookup index.
 * @param signingKey - the relay's current signing key.
 * @param token - the bearer token as presented.
 * @returns the keyed hash, hex.
 */
export declare function hashToken(signingKey: string, token: string): string;
/**
 * Sign a set of session claims into a cookie value.
 * @param signingKey - the relay's current signing key.
 * @param claims - the claims to carry.
 * @returns `<payload>.<signature>`, both base64url.
 */
export declare function signSession(signingKey: string, claims: SessionClaims): string;
/**
 * Verify a cookie value and return its claims.
 *
 * A clock step backwards — suspend and resume, an NTP correction — would
 * otherwise make a long-lived cookie appear freshly issued or instantly
 * expired, so a cookie claiming to be issued in the future is refused rather
 * than trusted.
 * @param signingKey - the relay's current signing key.
 * @param value - the cookie value as presented.
 * @param now - current epoch millis.
 * @returns the claims, or undefined when the value is forged, malformed, or expired.
 */
export declare function verifySession(signingKey: string, value: string, now: number): SessionClaims | undefined;
/**
 * Read one cookie out of a request's `Cookie` header.
 * @param header - the raw header value, or undefined.
 * @param name - the cookie name.
 * @returns the decoded value, or undefined when absent.
 */
export declare function readCookie(header: string | undefined, name: string): string | undefined;
/**
 * Read a bearer credential from an `Authorization` header.
 * @param header - the raw header value, or undefined.
 * @returns the token, or undefined when the header is absent or not a bearer.
 */
export declare function readBearer(header: string | undefined): string | undefined;
//# sourceMappingURL=tokens.d.ts.map