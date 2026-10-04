/**
 * The relay's browser-trust fence.
 *
 * This is not optional bookkeeping. The relay reaches the harness by rewriting
 * `Host` to the loopback authority, which is precisely what the harness's own
 * fence exists to detect — so from the moment the relay proxies anything, the
 * relay IS the DNS-rebinding fence and the cross-site fence. Removing it would
 * let any web page the operator visits point a short-TTL DNS record at the
 * relay's address and drive the agent from the victim's own network position,
 * carrying the victim's own address grant.
 *
 * The rules mirror the harness's `api-request-trust.ts` and are applied before
 * any authentication check, because an untrusted authority must not reach the
 * credential comparison at all.
 *
 * Authentication is a separate layer and lives in `auth/`. This module answers
 * only "is this request addressed to us, by something allowed to address us".
 * @module dsh-relay/fence
 */
import type { IncomingHttpHeaders } from 'node:http';
/** The request facts the fence reads. */
export interface FenceRequest {
    readonly headers: IncomingHttpHeaders;
    /** HTTP method; a cross-site read navigation is judged differently from a write. */
    readonly method?: string | undefined;
    /**
     * Whether the peer really is this machine: a loopback socket that carries no
     * forwarding headers.
     *
     * Only [EMULATOR_HOST_ALIAS] depends on it. A reverse proxy also connects
     * from loopback, so "loopback peer" alone is not the same fact — behind
     * Funnel every client on the internet arrives on that address.
     */
    readonly directLoopbackPeer?: boolean | undefined;
}
/**
 * The address an Android emulator reaches its host machine by.
 *
 * `10.0.2.2` is a fixed alias inside the emulator's private network, NAT'd to
 * the host's loopback — so a request carrying it as `Host` and arriving on a
 * loopback socket can only be the emulator on this machine. It is not an
 * address the relay can discover: it never appears on any interface here, and
 * `localAddresses()` cannot report it.
 *
 * Trusting it is narrower than it looks, and does not weaken the rebinding
 * defence. That attack needs a browser to resolve an attacker's name to a
 * local address and send the attacker's name as `Host`; to be refused here a
 * page would have to send `Host: 10.0.2.2`, which requires the browser to be
 * fetching `http://10.0.2.2:<port>` — an address that does not reach this
 * relay from an ordinary machine. The exemption is gated on a direct loopback
 * peer besides, so a forwarded request never receives it.
 */
export declare const EMULATOR_HOST_ALIAS = "10.0.2.2";
/** Why a request was refused, for the log line and the response body. */
export type FenceRejection = 'missing-host' | 'unparsable-host' | 'untrusted-host' | 'cross-site' | 'opaque-origin' | 'origin-mismatch';
/**
 * Whether a normalized hostname names the local loopback authority.
 * @param hostname - WHATWG URL hostname; IPv6 literals retain their brackets.
 * @returns true for localhost, IPv6 loopback, or any IPv4 address in 127/8.
 */
export declare function isLoopbackHostname(hostname: string): boolean;
/**
 * Whether an address is in a private, link-local, or loopback range.
 *
 * Address grants are refused outside these ranges: a public address is shared
 * by everyone behind the same carrier NAT, so granting one would admit
 * strangers along with the operator's phone.
 * @param address - a bare IPv4 or IPv6 address, brackets optional.
 * @returns true when the address is private, link-local, or loopback.
 */
export declare function isPrivateAddress(address: string): boolean;
/**
 * Refuse a configured authority that is not already canonical.
 *
 * Anything WHATWG parsing would silently rewrite is a typo that must fail the
 * load rather than quietly widening or narrowing the grant: URL parts beyond
 * the authority, a dangling colon, a zero-padded port, or a non-canonical host
 * spelling.
 * @param entry - the configured value, verbatim.
 * @throws {Error} naming the offending entry.
 */
export declare function assertTrustedAuthority(entry: string): void;
/**
 * The IPv4 literals this machine is reachable at on its own networks.
 * @returns non-internal IPv4 addresses, in interface order.
 */
export declare function localAddresses(): string[];
/**
 * The authorities this relay answers to.
 * @param options.trustedHosts - operator-declared authorities, already validated.
 * @param options.publicHostnames - names a port-forwarded deployment is reached by.
 * @returns port-less authorities plus loopback, deduplicated.
 */
export declare function relayAuthorities(options: {
    readonly trustedHosts: readonly string[];
    readonly publicHostnames: readonly string[];
}): string[];
/**
 * Decide whether one request may reach the relay's routes or its proxy.
 * @param request - the inbound request's headers, and whether its peer is
 *   directly this machine.
 * @param authorities - the authorities this relay answers to.
 * @returns the rejection reason, or undefined when the request passes.
 */
export declare function checkFence(request: FenceRequest, authorities: readonly string[]): FenceRejection | undefined;
//# sourceMappingURL=fence.d.ts.map