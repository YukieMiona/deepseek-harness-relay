/**
 * The relay's browser half: one card on the harness's Plugin configuration tab.
 *
 * Deliberately small. The card is the only thing this bundle contributes, and
 * everything operational — pairing, the device list, the certificate pin, the
 * password — stays on the relay's own pages, which work before a person is
 * signed in and from a device other than this one. A card cannot do either.
 *
 * Types here are declared structurally rather than imported from the harness's
 * client packages. This plugin is installed beside a harness it does not
 * control the version of, and the alternative is four `@deepseek-ai/dsh-*`
 * type dependencies that pin it to one release for no behaviour of their own —
 * the same trade the node half makes by reaching everything through `ctx`.
 * @module dsh-relay/client
 */
/** A reactive settings scope, as `ctx.settingsScope.bind` returns one. */
interface SettingsScopeLike {
    getSnapshot: () => unknown;
    subscribe: (listener: () => void) => () => void;
    set: (field: string, value: unknown) => Promise<void>;
}
/** The slice of the client context this plugin uses. */
interface RelayClientContext {
    settingsScope: {
        bind: (spec: {
            namespace: string;
        }) => SettingsScopeLike;
    };
    slots: {
        inject: (name: string, register: () => unknown) => void;
        register: (spec: {
            name: string;
            key?: string;
            inject?: () => Record<string, unknown>;
        }, component: unknown) => unknown;
    };
    logger?: {
        warn?: (message: string) => void;
    };
}
/** Services the renderer must have before this bundle registers anything. */
export declare const inject: string[];
/**
 * Register the card.
 * @param ctx - the browser plugin context.
 */
export declare function apply(ctx: RelayClientContext): void;
export {};
//# sourceMappingURL=index.d.ts.map