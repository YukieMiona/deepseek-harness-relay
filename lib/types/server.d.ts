/**
 * The relay's listeners and the order every request passes through.
 *
 * One request, one sequence, and the order is the security model:
 *
 * 1. rate limit, so an attacker cannot make the rest of this cheap to probe;
 * 2. the trust fence, which decides whether this request is even addressed to
 *    us — before any credential is read, so an untrusted authority never
 *    reaches the comparison;
 * 3. the relay's own routes, which are how a client obtains a credential;
 * 4. write-method scoping, which keeps a POST off any upstream path this relay
 *    does not know about;
 * 5. authentication;
 * 6. the pinned-method gate, which re-imposes upstream's loopback-only set
 *    that step 7 is about to lift;
 * 7. the proxy, which rewrites `Host` to loopback and forwards.
 *
 * Reordering any of these is a vulnerability, not a refactor.
 * @module dsh-relay/server
 */
import type { Authenticator } from './auth/index.ts';
import type { Config } from './config.ts';
import { type UpstreamTarget } from './proxy/http.ts';
import type { TlsMaterial } from './tls.ts';
/** Everything a listener needs to serve one request. */
export interface RelayRuntime {
    readonly auth: Authenticator;
    readonly config: Config;
    readonly target: UpstreamTarget;
    readonly fingerprint?: string | undefined;
    /**
     * Port of the plain-HTTP compatibility listener, when one is running.
     *
     * The port rather than a whole origin: a machine commonly has several LAN
     * addresses (a virtual-machine adapter alongside real Wi-Fi), and picking
     * one at startup names an address the client may have no route to. The
     * origin is built per request from the host the client actually reached,
     * which is reachable from that client by construction.
     */
    plainPort?: number | undefined;
    /** Report a refusal; the plugin routes this to the Cordis logger. */
    readonly log: (message: string) => void;
}
/** A running listener and the handle that shuts it down. */
export interface RelayListener {
    /** The port actually bound, resolved when the configured port was zero. */
    readonly port: number;
    /** Close the listener and force every connection, upgraded ones included. */
    close: () => Promise<void>;
}
/**
 * Start one listener.
 * @param options.runtime - the relay's live state.
 * @param options.bind - listen address.
 * @param options.port - listen port; zero requests an OS-assigned port.
 * @param options.tls - certificate material, or undefined for plaintext.
 * @param options.compat - run under the compatibility policy rather than the primary one.
 * @param options.authorities - the authorities this relay answers to.
 * @returns the running listener.
 */
export declare function startListener(options: {
    readonly runtime: RelayRuntime;
    readonly bind: string;
    readonly port: number;
    readonly tls?: TlsMaterial | undefined;
    readonly compat?: boolean;
    readonly authorities: readonly string[];
}): Promise<RelayListener>;
//# sourceMappingURL=server.d.ts.map