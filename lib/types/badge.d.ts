/**
 * A way back to the relay's own pages from inside the harness UI.
 *
 * The relay ships its operational pages on its own listener, so a person
 * looking at the chat had no way to reach pairing, the device list, or the
 * password form except by typing a path they had to already know.
 *
 * `ctx.webServer.tapIndex` is the seam: a pure html-to-html transform the SPA
 * server runs over every index response, the same mechanism the client module
 * system uses to inject its boot manifest.
 *
 * The href stays relative, which reads correctly through the relay and works
 * with no script at all. It also works on the harness's own loopback port,
 * where a relative `/relay/...` would otherwise hit the single-page
 * application's catch-all and land the person back in the chat — the dead end
 * this link exists to remove. What saves it there is a redirect the plugin
 * registers on the harness's own web server; see `redirectRoute` in
 * `src/index.ts`.
 * @module dsh-relay/badge
 */
/**
 * Add the link to one index document.
 *
 * Applied to every index response, including each single-page-application
 * route fallback, so it is idempotent and never throws: it runs inside the
 * harness's own response path, where a failure would break the page rather
 * than just this link.
 * @param html - the index document as the frontend server rendered it.
 * @returns the document with the link before `</body>`, or unchanged when it
 * is already present or there is no body element to inject into.
 */
export declare function injectRelayLink(html: string): string;
//# sourceMappingURL=badge.d.ts.map