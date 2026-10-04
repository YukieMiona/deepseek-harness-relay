/**
 * Header translation between the relay's edge and the loopback harness.
 *
 * Two jobs. The first is ordinary proxy hygiene: hop-by-hop headers belong to
 * one connection and must not be forwarded onto another.
 *
 * The second is the deliberate one. The harness answers `/api` only to a
 * loopback authority, and pins its configuration plane to the same test, so
 * the relay presents itself as loopback. That rewrite is only safe because the
 * relay has already applied its own fence to the original headers — see
 * `fence.ts`. Rewriting before that check would hand every rebound page a
 * loopback identity.
 * @module dsh-relay/proxy/rewrite
 */
import type { IncomingHttpHeaders } from 'node:http';
/**
 * Build the header map for one upstream request.
 * @param headers - the inbound headers, already past the fence.
 * @param loopbackAuthority - `127.0.0.1:<port>` of the harness web server.
 * @param options.keepUpgrade - retain `connection` and `upgrade` for a WebSocket handshake.
 * @param options.cookie - the harness browser session to present, when this
 *   harness requires one. Absent leaves the request unauthenticated, which a
 *   pre-0.1.2 harness accepts and a 0.1.2 one answers 401.
 * @returns the headers to send upstream.
 */
export declare function upstreamHeaders(headers: IncomingHttpHeaders, loopbackAuthority: string, options?: {
    readonly keepUpgrade?: boolean;
    readonly cookie?: string | undefined;
}): Record<string, string | string[]>;
/**
 * Build the header map for one downstream response.
 * @param headers - the upstream response headers.
 * @returns the headers to send to the client, hop-by-hop entries removed.
 */
export declare function downstreamHeaders(headers: IncomingHttpHeaders): Record<string, string | string[]>;
/**
 * Normalize a socket peer address for use as a grant key and log field.
 *
 * Node reports an IPv4 peer on a dual-stack listener as `::ffff:a.b.c.d`;
 * treating that as a different address from `a.b.c.d` would make a grant
 * issued over one listener invisible to the other.
 * @param address - the raw `socket.remoteAddress`, possibly undefined.
 * @returns the normalized address, or an empty string when unknown.
 */
export declare function normalizeAddress(address: string | undefined): string;
//# sourceMappingURL=rewrite.d.ts.map