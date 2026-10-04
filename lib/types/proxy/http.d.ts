/**
 * Request forwarding to the loopback harness.
 *
 * Bodies stream in both directions and are never buffered: `session.export`
 * answers a ZIP with no content length, and a chat turn's response is read
 * while the model is still producing it.
 * @module dsh-relay/proxy/http
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HarnessSession } from '../harness-session.ts';
/** What the forwarder needs to reach the harness. */
export interface UpstreamTarget {
    /** Loopback host the harness web server listens on. */
    readonly host: string;
    /** Loopback port the harness web server listens on. */
    readonly port: number;
    /** Deadline for the upstream response to begin. */
    readonly timeoutMs: number;
    /**
     * Mints the harness browser session each forwarded request carries.
     *
     * Absent against a harness older than 0.1.2, which required none. Against
     * 0.1.2 and later its absence means every proxied request is answered 401,
     * which the relay reports at startup rather than leaving to be discovered
     * one refused request at a time.
     */
    readonly session?: HarnessSession | undefined;
}
/** The authority the harness sees, and compares its own fence against. */
export declare function loopbackAuthority(target: UpstreamTarget): string;
/**
 * Forward one request and stream its response back.
 * @param req - the inbound request; its body is piped upstream.
 * @param res - the response to write; owned entirely by this call.
 * @param target - the loopback harness.
 * @returns resolution once the response is finished or an error was reported.
 */
export declare function forward(req: IncomingMessage, res: ServerResponse, target: UpstreamTarget): Promise<void>;
//# sourceMappingURL=http.d.ts.map