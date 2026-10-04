/**
 * The harness browser session the relay presents upstream.
 *
 * From harness 0.1.2 the harness authenticates its complete `/api` surface —
 * every Remote call, the `/api/remote.mux` upgrade, and the session-log
 * download — against a signed, authority-bound cookie, and answers 401 without
 * one. The relay strips the client's own `Cookie` before forwarding (that
 * header authenticates the phone to the *relay* and means nothing upstream),
 * so without a session of its own every proxied request is refused.
 *
 * The relay cannot obtain one the way a browser does: the launch token is
 * printed once per harness process, is only accepted on the index route, and is
 * never persisted. What it can do is what the harness itself does — read the
 * durable signing secret from the credential store it shares and mint a cookie
 * directly. That is not a bypass. The relay already runs inside the harness
 * process with the operator's authority; a plugin that can read `ctx.credentials`
 * could call any harness API in-process without a cookie at all. Minting one
 * only lets it speak the same HTTP contract as the browser.
 *
 * @module dsh-relay/harness-session
 */
import type { Context } from '@deepseek-ai/cordis';
/** Mints harness browser-session cookies for proxied requests. */
export declare class HarnessSession {
    private readonly secret;
    private constructor();
    /**
     * Load the harness's cookie-signing secret.
     *
     * @param ctx - plugin context; `ctx.credentials` is the harness's own store.
     * @returns a minter, or undefined when this harness keeps no such secret —
     *   which is every release before 0.1.2, where nothing needed one.
     */
    static load(ctx: Context): Promise<HarnessSession | undefined>;
    /**
     * A minter backed by a secret of the caller's choosing. Tests only.
     * @param secret - a 32-byte signing secret.
     * @returns a minter over that secret.
     */
    static forTesting(secret?: Buffer): HarnessSession;
    /**
     * The `Cookie` header value proving a browser session for [authority].
     * @param authority - the upstream `host:port` this request will carry.
     * @returns one `name=value` pair, ready to send as `Cookie`.
     */
    cookieFor(authority: string): string;
}
//# sourceMappingURL=harness-session.d.ts.map