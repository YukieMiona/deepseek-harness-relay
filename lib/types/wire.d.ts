/**
 * Small HTTP helpers shared by the relay's own routes.
 *
 * Bodies here are forms and short JSON documents, never proxied traffic, so
 * they are read into memory against a hard cap. Anything larger is a mistake
 * or an attack, not a request this relay serves.
 * @module dsh-relay/wire
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
/**
 * Read a bounded request body.
 * @param req - the inbound request.
 * @returns the body text, or undefined when it exceeded the cap.
 */
export declare function readBody(req: IncomingMessage): Promise<string | undefined>;
/**
 * Parse a body as either a form post or a JSON document.
 * @param req - the inbound request, read for its content type.
 * @param body - the body text.
 * @returns a flat field map; a malformed JSON body yields an empty map.
 */
export declare function parseFields(req: IncomingMessage, body: string): Record<string, string>;
/** Whether the client asked for a JSON answer rather than a page. */
export declare function wantsJson(req: IncomingMessage): boolean;
/**
 * Send an HTML page.
 * @param res - the response to write.
 * @param status - HTTP status.
 * @param html - the document.
 * @param extraHeaders - additional headers, such as a Set-Cookie.
 */
export declare function sendHtml(res: ServerResponse, status: number, html: string, extraHeaders?: Record<string, string | string[]>): void;
/**
 * Send a JSON document.
 * @param res - the response to write.
 * @param status - HTTP status.
 * @param value - the payload.
 * @param extraHeaders - additional headers.
 */
export declare function sendJson(res: ServerResponse, status: number, value: unknown, extraHeaders?: Record<string, string | string[]>): void;
/**
 * Send a redirect.
 * @param res - the response to write.
 * @param location - the target path; always relative to this origin.
 * @param extraHeaders - additional headers, such as a Set-Cookie.
 */
export declare function sendRedirect(res: ServerResponse, location: string, extraHeaders?: Record<string, string | string[]>): void;
/**
 * Build the `Set-Cookie` value for the relay's session cookie.
 * @param options.name - cookie name.
 * @param options.value - cookie value; an empty value clears the cookie.
 * @param options.maxAgeSeconds - lifetime; zero clears the cookie.
 * @param options.secure - mark the cookie `Secure`, for a TLS listener.
 * @returns the header value.
 */
export declare function sessionCookie(options: {
    readonly name: string;
    readonly value: string;
    readonly maxAgeSeconds: number;
    readonly secure: boolean;
}): string;
/**
 * Confine a caller-supplied return path to this origin.
 *
 * A `next` parameter that could name another origin would turn the sign-in
 * page into an open redirect, which is exactly the primitive a phishing page
 * wants from a host the operator already trusts.
 * @param value - the requested path.
 * @returns a same-origin absolute path, defaulting to the root.
 */
export declare function safeNextPath(value: string | null): string;
//# sourceMappingURL=wire.d.ts.map