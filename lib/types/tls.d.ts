/**
 * The relay's transport identity.
 *
 * Three postures, and which one is right depends on who is connecting:
 *
 * - `files` is the browser answer. A certificate a browser already trusts
 *   (mkcert on the LAN, an ACME certificate on a forwarded name) is the only
 *   way a phone browser reaches the relay without an interstitial warning.
 * - `self-signed` is the pinning answer. The relay mints its own certificate
 *   and publishes the SHA-256 of its SubjectPublicKeyInfo; a client that pins
 *   that value gets real transport security with no certificate authority
 *   involved. Browsers will still warn.
 * - `off` serves plaintext. DSH Mobile 0.5.0 hardcodes `http://` for both its
 *   RPC calls and its two WebSocket downlinks, so this is the only posture it
 *   can reach — hence the separate plain-HTTP compatibility listener rather
 *   than making the whole relay give up TLS for one client.
 * @module dsh-relay/tls
 */
import type { CertificateRecord } from './state.ts';
/** A loaded key pair plus the identity a pinning client compares. */
export interface TlsMaterial {
    readonly cert: string;
    readonly key: string;
    readonly record: CertificateRecord;
}
/**
 * SHA-256 of a certificate's DER SubjectPublicKeyInfo, base64.
 *
 * This is the value a pinning client compares, and it is deliberately the
 * public key rather than the whole certificate: renewing with the same key
 * then leaves every paired device working.
 * @param certPem - the certificate, PEM encoded.
 * @returns the base64 digest.
 */
export declare function spkiFingerprint(certPem: string): string;
/**
 * The names a generated certificate must cover.
 * @param publicHostnames - names a forwarded deployment is reached by.
 * @returns DNS names and IP literals, deduplicated.
 */
export declare function certificateSans(publicHostnames: readonly string[]): string[];
/**
 * Load the certificate for the configured posture, generating one if needed.
 *
 * A generated certificate is regenerated when it has expired or when the set
 * of addresses it covers has changed — a laptop that moved networks would
 * otherwise present a certificate naming an address it no longer has.
 *
 * The private key is written mode 0600. **That is a no-op on Windows**, where
 * the file inherits the ACL of the harness home directory; a deployment that
 * shares that directory should restrict it with `icacls` or point `tls` at
 * files it manages itself.
 * @param options.mode - the configured posture; `off` returns undefined.
 * @param options.dir - the relay state directory.
 * @param options.certPath - operator-supplied certificate, for `files`.
 * @param options.keyPath - operator-supplied key, for `files`.
 * @param options.sans - names a generated certificate must cover.
 * @param options.existing - the certificate record from durable state, if any.
 * @returns the material to hand `https.createServer`, or undefined for plaintext.
 */
export declare function loadCertificate(options: {
    readonly mode: 'self-signed' | 'files' | 'off';
    readonly dir: string;
    readonly certPath: string;
    readonly keyPath: string;
    readonly sans: readonly string[];
    readonly existing?: CertificateRecord | undefined;
}): Promise<TlsMaterial | undefined>;
//# sourceMappingURL=tls.d.ts.map