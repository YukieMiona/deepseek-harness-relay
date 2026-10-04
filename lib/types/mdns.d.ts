/**
 * Local-network advertisement.
 *
 * DSH Mobile finds a harness today by sweeping its own /24 with a TCP knock,
 * because nothing on the network announces itself. Advertising `_dsh._tcp`
 * removes that sweep for any client that learns to look, and the TXT record
 * carries what a client needs before it connects: which port to use, whether
 * the primary listener speaks TLS, the certificate pin to expect, and whether
 * a pairing window is open right now.
 *
 * No shipped client consumes this yet. It is cheap, unloads cleanly, and turns
 * off with one config field.
 * @module dsh-relay/mdns
 */
/** What the advertisement carries. */
export interface Advertisement {
    /** Port of the primary listener. */
    readonly port: number;
    /** Port of the plain-HTTP compatibility listener, when one is running. */
    readonly plainPort?: number | undefined;
    /** Transport posture of the primary listener. */
    readonly tls: string;
    /** SPKI pin of the served certificate, when the listener terminates TLS. */
    readonly fingerprint?: string | undefined;
    /** Service instance name; empty derives one from the machine's hostname. */
    readonly name: string;
}
/**
 * Publish the relay on the local network.
 * @param advertisement - what to announce.
 * @param onError - reports a failure to advertise; advertising is best-effort
 * and must never take the relay down with it.
 * @returns a disposer that withdraws the record.
 */
export declare function advertise(advertisement: Advertisement, onError: (message: string) => void): Promise<() => Promise<void>>;
//# sourceMappingURL=mdns.d.ts.map