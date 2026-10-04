/**
 * The relay's page bodies.
 *
 * Every interaction is a plain form POST. No script runs on these pages beyond
 * the theme bootstrap, which means they work on a phone browser with scripting
 * restricted, they cannot leak a credential through an XHR that outlives the
 * page, and there is nothing to bundle. Cross-site form posts are refused by
 * the fence and the session cookie is `SameSite=Strict`, so the forms need no
 * separate token.
 *
 * Navigation is a control, not a line of prose. A page's ways onward are
 * buttons in an action row — `.btn` gives an anchor the same capsule the
 * harness's Button primitive gives a `button`, so a person reads one weight
 * and one hit target whether the action posts a form or follows a link.
 * @module dsh-relay/pages/views
 */
import type { DeviceRecord } from '../state.ts';
/**
 * The sign-in page.
 * @param options.error - message to show above the form.
 * @param options.next - path to return to after a successful sign-in.
 * @returns the full HTML document.
 */
export declare function loginPage(options: {
    readonly error?: string | undefined;
    readonly next: string;
}): string;
/**
 * The page that sets a password, or replaces the one already set.
 *
 * This is deliberately separate from the sign-in page. A request from the
 * machine running the harness is already the operator — asking it for a
 * password would be theatre, since whoever is there has a shell — so the
 * sign-in page redirects it straight through. That left first-run setup with
 * nowhere to happen, which is what this page is for.
 * @param options.hasPassword - whether a password already exists.
 * @param options.error - message to show above the form.
 * @param options.next - path to return to afterwards.
 * @returns the full HTML document.
 */
export declare function passwordPage(options: {
    readonly hasPassword: boolean;
    readonly error?: string | undefined;
    readonly next: string;
}): string;
/**
 * The operator's pairing page: the QR, the code, and what a device does with them.
 * @param options - the live invitation and the origins it points at.
 * @returns the full HTML document.
 */
export declare function pairPage(options: {
    readonly qrSvg: string;
    readonly code: string;
    readonly expiresInSeconds: number;
    readonly url: string;
    readonly plainUrl?: string | undefined;
    readonly fingerprint?: string | undefined;
}): string;
/**
 * The device-facing enrolment form.
 * @param options.error - message to show above the form.
 * @param options.code - a code carried in the URL, prefilled.
 * @returns the full HTML document.
 */
export declare function claimPage(options: {
    readonly error?: string | undefined;
    readonly code?: string | undefined;
}): string;
/**
 * Confirmation after a device enrols, carrying the token exactly once.
 * @param options - the minted credential and the addresses it works from.
 * @returns the full HTML document.
 */
export declare function pairedPage(options: {
    readonly deviceName: string;
    readonly token: string;
    readonly granted: boolean;
    readonly plainUrl?: string | undefined;
}): string;
/**
 * The device list, with revocation.
 * @param options - the enrolled devices and the relay's current posture.
 * @returns the full HTML document.
 */
export declare function devicesPage(options: {
    readonly devices: readonly DeviceRecord[];
    readonly now: number;
    readonly tlsMode: string;
    readonly hasPassword: boolean;
    readonly fingerprint?: string | undefined;
    readonly url: string;
    readonly plainUrl?: string | undefined;
}): string;
/**
 * A standalone message, used for errors and confirmations.
 * @param options.title - the heading and document title.
 * @param options.message - body copy.
 * @param options.kind - which notice styling to use.
 * @returns the full HTML document.
 */
export declare function messagePage(options: {
    readonly title: string;
    readonly message: string;
    readonly kind?: 'error' | 'warn' | 'tip';
}): string;
//# sourceMappingURL=views.d.ts.map