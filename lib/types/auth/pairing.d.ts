/**
 * Device enrolment.
 *
 * A pairing code is created only by an operator action arriving on loopback —
 * the admin page opened on the machine running the harness, or the plugin's
 * own startup banner. It is never created by a request from the device asking
 * to be paired: an endpoint that mints its own invitations on demand is the
 * confused deputy the rest of this plugin exists to avoid.
 *
 * A code is single use, expires on a short window, and is compared in constant
 * time. Claiming one mints a bearer token whose hash is all the relay stores.
 * @module dsh-relay/auth/pairing
 */
/** One outstanding invitation. */
export interface PairingCode {
    /** The digits the operator reads out, or that the QR carries. */
    readonly code: string;
    /** Epoch millis the code stops being claimable. */
    readonly expiresAt: number;
}
/**
 * The live pairing window.
 *
 * At most one code is outstanding: a second `issue()` replaces the first, so
 * an operator who re-opens the pairing screen cannot accidentally leave a
 * forgotten invitation valid behind them.
 */
export declare class PairingWindow {
    #private;
    /**
     * Issue a fresh code, replacing any outstanding one.
     * @param digits - length of the numeric code.
     * @param windowMs - how long it stays claimable.
     * @param now - current epoch millis.
     * @returns the new code.
     */
    issue(digits: number, windowMs: number, now: number): PairingCode;
    /**
     * The outstanding code, if one is still claimable.
     * @param now - current epoch millis.
     * @returns the code, or undefined when none is outstanding or it expired.
     */
    peek(now: number): PairingCode | undefined;
    /**
     * Claim the outstanding code.
     *
     * Success consumes it, so a code intercepted in transit is worthless once
     * the intended device has used it — and an operator who sees an unexpected
     * "already paired" is being told the code leaked.
     * @param candidate - the code as presented.
     * @param now - current epoch millis.
     * @returns true when the code matched and has now been consumed.
     */
    claim(candidate: string, now: number): boolean;
    /** Withdraw any outstanding code. */
    clear(): void;
}
/** What a QR code carries, and what a client needs to reach and trust the relay. */
export interface PairingPayload {
    /** Payload format version. */
    readonly v: 1;
    /** Discriminator, so a scanner can tell this QR from any other. */
    readonly kind: 'dsh-relay-pair';
    /** Primary origin, including scheme and port. */
    readonly url: string;
    /** Plain-HTTP origin for clients that cannot speak TLS; absent when none is listening. */
    readonly plainUrl?: string;
    /** SHA-256 of the DER SubjectPublicKeyInfo, base64; absent when the relay serves plaintext. */
    readonly fingerprint?: string;
    /** The single-use enrolment code. */
    readonly code: string;
    /** Epoch millis the code stops being claimable. */
    readonly expiresAt: number;
}
/**
 * Build the payload a QR code or a copied link carries.
 * @param parts - the relay's reachable origins, certificate identity, and live code.
 * @returns the payload, ready to serialize.
 */
export declare function pairingPayload(parts: {
    readonly url: string;
    readonly plainUrl?: string | undefined;
    readonly fingerprint?: string | undefined;
    readonly code: PairingCode;
}): PairingPayload;
//# sourceMappingURL=pairing.d.ts.map