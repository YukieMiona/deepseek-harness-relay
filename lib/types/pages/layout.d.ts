/**
 * The HTML shell the relay's own pages render into.
 *
 * The mark here is this project's own. The harness's brand guidelines ask
 * third-party projects not to present official brand art in a way that reads
 * as endorsement, and to name themselves with the `DSH` abbreviation rather
 * than the full trademark — so these pages carry a relay glyph and the words
 * "DSH RELAY", never the official wordmark.
 * @module dsh-relay/pages/layout
 */
/**
 * Escape a value for interpolation into HTML text or a quoted attribute.
 * @param value - the untrusted string.
 * @returns the escaped string.
 */
export declare function escapeHtml(value: string): string;
/**
 * Render one complete page.
 * @param options.title - the document title.
 * @param options.body - already-escaped markup for the card's contents.
 * @param options.wide - render the wider card used by the admin page.
 * @returns the full HTML document.
 */
export declare function page(options: {
    title: string;
    body: string;
    wide?: boolean;
}): string;
//# sourceMappingURL=layout.d.ts.map