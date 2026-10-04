/**
 * The relay's card on the harness's **Plugin configuration** tab.
 *
 * What belongs here and what does not: pairing, revocation, and the
 * certificate pin live on the relay's own pages, because they must work before
 * a person is signed in and from a device that is not this one. This card is
 * the configuration surface — the switches that change how the relay behaves —
 * plus the way in to those pages.
 *
 * The card is only ever rendered on loopback. The harness decides whether a
 * settings namespace is writable from `connection.isLoopback`, computed in the
 * browser from the page address, so a remote browser is served no namespaces
 * and this tab dispatches no cards at all. The snapshot's `writable` flag is
 * what that looks like from in here.
 *
 * Edits are staged and written on save, as the neighbouring cards do. That is
 * not only for consistency: saving a relay field rebinds the listeners and
 * drops the connections in flight, so a control that committed as it settled
 * turned one change of mind into several disconnections.
 * @module dsh-relay/client/RelayCard
 */
/** The relay configuration this card reads. */
interface RelayValue {
    readonly bind?: string;
    readonly port?: number;
    readonly tls?: string;
    readonly privilegedMethods?: string;
    readonly uiLink?: boolean;
    readonly mdns?: boolean;
    readonly compat?: {
        readonly addressGrants?: boolean;
        readonly plainPort?: number;
    };
}
/** The snapshot the renderer binds from the settings scope. */
interface RelaySnapshot {
    readonly status: 'loading' | 'ready' | 'unavailable';
    readonly value: RelayValue | undefined;
    readonly writable: boolean;
}
/** Props the renderer composes for this card. */
export interface RelayCardProps {
    /** Bound from the injected `hooks` compartment. */
    useRelayCard: <T>(select: (snapshot: RelaySnapshot) => T) => T;
    /** Write one top-level field of the namespace; resolves to whether it landed. */
    setField: (field: string, value: unknown) => Promise<boolean>;
}
/**
 * Render the relay's configuration card.
 * @param props - the bound snapshot hook and the field writer.
 * @returns the card.
 */
export declare function RelayCard(props: RelayCardProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=RelayCard.d.ts.map