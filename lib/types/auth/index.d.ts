/**
 * Who is asking, and what that entitles them to.
 *
 * Every inbound request is classified into exactly one credential class before
 * anything is proxied. The classes are ordered by strength, and only the two
 * strongest reach the harness methods that are otherwise pinned to loopback:
 * a source address is not a credential, and the compatibility class that rests
 * on one is fenced accordingly.
 *
 * Verification on the request path is one HMAC against in-memory state. The
 * mobile client opens two WebSockets inside a 3-second budget and then calls
 * `host.describe`; a filesystem read or a scrypt derivation on that path turns
 * a working connection into a reconnect loop.
 * @module dsh-relay/auth
 */
import type { IncomingHttpHeaders } from 'node:http';
import type { Config } from '../config.ts';
import type { DeviceRecord, RelayStore } from '../state.ts';
import { PairingWindow } from './pairing.ts';
/** Name of the signed sign-in cookie. */
export declare const SESSION_COOKIE = "dsh_relay_session";
/**
 * Whether a request visibly came through a forwarding proxy.
 * @param headers - the inbound request headers.
 * @returns true when any forwarding header is present.
 */
export declare function isForwarded(headers: IncomingHttpHeaders): boolean;
/** How a request proved who it is. */
export type CredentialClass = 'loopback' | 'session' | 'device' | 'address-grant' | 'none';
/** The verdict for one request. */
export interface Identity {
    readonly credential: CredentialClass;
    /** Device this request belongs to, when one is known. */
    readonly deviceId?: string;
    /**
     * Whether this request may reach the methods the harness pins to loopback.
     *
     * True for a genuine loopback caller always, and for a session or device
     * credential when the operator configured `privilegedMethods` to allow it.
     * Never true for an address grant: a source address is shared behind NAT,
     * reassigned by DHCP, rotated by IPv6 privacy extensions, and spoofable on
     * the same segment, so it cannot carry the configuration plane.
     */
    readonly privileged: boolean;
}
/** A request's identifying facts. */
export interface AuthRequest {
    readonly headers: IncomingHttpHeaders;
    /** Peer address of the socket, already normalized. */
    readonly address: string;
    /** Whether the peer address is loopback. */
    readonly local: boolean;
}
/** The refusal reason, when a sign-in attempt fails. */
export type SignInFailure = 'no-password' | 'locked-out' | 'bad-password';
/** Result of a successful sign-in. */
export interface SignInSuccess {
    /** The cookie value to set. */
    readonly cookie: string;
    /** Epoch millis the cookie expires. */
    readonly expiresAt: number;
}
/**
 * The relay's authentication state.
 *
 * Owns the in-memory token index, the pairing window, and the throttles; the
 * durable half lives in {@link RelayStore}.
 */
export declare class Authenticator {
    #private;
    private readonly store;
    private readonly config;
    readonly pairing: PairingWindow;
    /**
     * @param store - the durable state store.
     * @param config - resolved plugin configuration.
     */
    constructor(store: RelayStore, config: Config);
    /** Whether a password has been set at all. */
    get hasPassword(): boolean;
    /** Live, unrevoked devices, newest first. */
    get devices(): DeviceRecord[];
    /**
     * Record one request against the per-address rate limit.
     * @param address - normalized source address.
     * @param now - current epoch millis.
     * @returns true when the request is over the limit and must be refused.
     */
    exceedsRate(address: string, now: number): boolean;
    /**
     * When an address's lockout expires, or undefined when it is not locked out.
     * @param address - the normalized source address.
     * @param now - current epoch millis.
     * @returns epoch millis the lockout lifts.
     */
    lockedUntil(address: string, now: number): number | undefined;
    /**
     * Classify one request.
     * @param request - the request's headers, source address, and locality.
     * @param now - current epoch millis.
     * @returns the credential class and what it entitles the caller to.
     */
    identify(request: AuthRequest, now: number): Identity;
    /**
     * Set or replace the sign-in password.
     * @param password - the new plaintext.
     * @returns resolution once the hash is durable.
     */
    setPassword(password: string): Promise<void>;
    /**
     * Verify a sign-in and mint a session cookie.
     * @param password - the plaintext as typed.
     * @param address - normalized source address, for the lockout counter.
     * @param now - current epoch millis.
     * @returns the cookie to set, or the reason the attempt was refused.
     */
    signIn(password: string, address: string, now: number): Promise<SignInSuccess | SignInFailure>;
    /**
     * Enrol a device against the outstanding pairing code.
     * @param options.code - the code as presented.
     * @param options.name - the device label to record.
     * @param options.address - normalized source address.
     * @param now - current epoch millis.
     * @returns the minted token and its device, or undefined when the code did not match.
     */
    pair(options: {
        readonly code: string;
        readonly name: string;
        readonly address: string;
    }, now: number): Promise<{
        readonly token: string;
        readonly device: DeviceRecord;
    } | 'locked-out' | undefined>;
    /**
     * Refresh a device's grant after an accepted request from a new address.
     * @param deviceId - the device.
     * @param address - normalized source address.
     * @param now - current epoch millis.
     * @returns resolution once the record is durable.
     */
    touch(deviceId: string, address: string, now: number): Promise<void>;
    /**
     * Revoke one device and every grant it created.
     * @param deviceId - the device to revoke.
     * @param now - current epoch millis.
     * @returns true when a live device was revoked.
     */
    revoke(deviceId: string, now: number): Promise<boolean>;
    /**
     * Rotate the signing key, invalidating every cookie and every device token.
     *
     * Device records are dropped rather than kept with dead hashes: a token hash
     * is keyed by the signing key, so after rotation none of them could ever
     * match again and leaving them would only misreport what is enrolled.
     * @returns resolution once the new key is durable.
     */
    signOutEverywhere(): Promise<void>;
    /** Stop the throttle sweep. */
    dispose(): void;
}
//# sourceMappingURL=index.d.ts.map