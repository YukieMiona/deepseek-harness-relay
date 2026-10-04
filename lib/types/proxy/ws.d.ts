/**
 * WebSocket upgrade forwarding.
 *
 * The relay never terminates the WebSocket protocol: it forwards the
 * handshake, replays the upstream's 101 verbatim, and then pipes bytes. That
 * keeps `Sec-WebSocket-Accept` correct without recomputing it, leaves
 * extension negotiation end-to-end, and means the harness's own close frames
 * (it closes with 1008 on the first client-sent frame, both downlinks being
 * server-to-client only) reach the client unchanged.
 *
 * Every upgraded socket is registered with the caller's ledger. Node's
 * `server.closeAllConnections()` does not include upgraded sockets, so without
 * the ledger a plugin unload would hang on a live downlink — the harness's own
 * web server works around the same gap.
 * @module dsh-relay/proxy/ws
 */
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { type UpstreamTarget } from './http.ts';
/** Tracks live upgraded sockets so teardown can force them closed. */
export declare class SocketLedger {
    #private;
    /**
     * Register a socket and forget it again when it closes.
     * @param socket - the upgraded socket.
     */
    track(socket: Duplex): void;
    /** Destroy every tracked socket. */
    destroyAll(): void;
    /** How many sockets are live. */
    get size(): number;
}
/**
 * Refuse an upgrade before it is established.
 * @param socket - the client socket.
 * @param status - HTTP status line code.
 * @param reason - reason phrase, echoed into the body.
 */
export declare function rejectUpgrade(socket: Duplex, status: number, reason: string): void;
/**
 * Forward one upgrade to the harness and pipe the resulting sockets together.
 * @param req - the upgrade request.
 * @param socket - the client socket, still holding the handshake.
 * @param head - bytes the client already sent past the handshake.
 * @param target - the loopback harness.
 * @param ledger - registry the established socket pair joins.
 */
export declare function forwardUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer, target: UpstreamTarget, ledger: SocketLedger): void;
//# sourceMappingURL=ws.d.ts.map