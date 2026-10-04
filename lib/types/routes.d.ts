/**
 * The relay's own endpoints, everything under `/relay`.
 *
 * These are the pages and the small JSON API that gate the proxy: sign-in,
 * device enrolment, the device list, and revocation. Nothing here is
 * forwarded upstream.
 *
 * Two rules shape the whole module. Invitations are issued only to an
 * operator — a request arriving on loopback, or one already carrying a
 * password session — never to the device asking to be paired, because an
 * endpoint that mints its own invitations on demand is a confused deputy. And
 * every unauthorized answer is HTTP 403, never 401: DSH Mobile reads 403 as
 * "the harness is there and refused this address", which is a usable pairing
 * hint, and anything else as "not a harness at all".
 * @module dsh-relay/routes
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Authenticator, Identity } from './auth/index.ts';
import type { Config } from './config.ts';
/** Prefix owning every route in this module. */
export declare const RELAY_PREFIX = "/relay";
/** What a route handler is given. */
export interface RouteContext {
    readonly auth: Authenticator;
    readonly config: Config;
    readonly identity: Identity;
    readonly address: string;
    /** Origin the client reached this relay on, for links and the QR payload. */
    readonly origin: string;
    /** Plain-HTTP origin, when the compatibility listener is running. */
    readonly plainOrigin?: string | undefined;
    /** SPKI pin of the served certificate; absent on a plaintext listener. */
    readonly fingerprint?: string | undefined;
    /** Whether this request arrived over TLS, deciding the cookie's Secure flag. */
    readonly secure: boolean;
    readonly now: number;
}
/** Whether this identity may see the harness at all. */
export declare function isAuthenticated(identity: Identity): boolean;
/**
 * Handle one `/relay` request.
 * @param req - the inbound request.
 * @param res - the response, owned entirely by this call.
 * @param url - the parsed request URL.
 * @param context - the relay's live state for this request.
 * @returns resolution once the response is finished.
 */
export declare function handleRelayRoute(req: IncomingMessage, res: ServerResponse, url: URL, context: RouteContext): Promise<void>;
//# sourceMappingURL=routes.d.ts.map