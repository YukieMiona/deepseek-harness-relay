/**
 * Per-address request throttling and sign-in lockout.
 *
 * Both are keyed by source address and held in memory only: they are abuse
 * controls, not durable policy, and losing them on restart is correct — the
 * credentials themselves are what survive.
 * @module dsh-relay/auth/ratelimit
 */
/**
 * Request and sign-in throttles, keyed by source address.
 *
 * The eviction sweep is the only timer; the caller owns it through
 * {@link dispose} so a plugin unload leaves nothing running.
 */
export declare class Throttle {
    #private;
    private readonly limits;
    /**
     * @param limits.requestsPerMinute - requests one address may make per minute.
     * @param limits.maxFailures - failed sign-ins before lockout.
     * @param limits.lockoutMs - how long a lockout lasts.
     */
    constructor(limits: {
        readonly requestsPerMinute: number;
        readonly maxFailures: number;
        readonly lockoutMs: number;
    });
    /**
     * Record one request and report whether it exceeds the rate limit.
     * @param address - normalized source address.
     * @param now - current epoch millis.
     * @returns true when the request is over the limit and must be refused.
     */
    exceedsRate(address: string, now: number): boolean;
    /**
     * Whether sign-in from this address is currently locked out.
     * @param address - normalized source address.
     * @param now - current epoch millis.
     * @returns epoch millis the lockout ends, or undefined when not locked.
     */
    lockedUntil(address: string, now: number): number | undefined;
    /**
     * Record a failed sign-in, locking the address out at the threshold.
     * @param address - normalized source address.
     * @param now - current epoch millis.
     */
    recordFailure(address: string, now: number): void;
    /**
     * Clear the failure counter after a successful sign-in.
     * @param address - normalized source address.
     */
    recordSuccess(address: string): void;
    /** Stop the eviction sweep and drop every counter. */
    dispose(): void;
}
//# sourceMappingURL=ratelimit.d.ts.map