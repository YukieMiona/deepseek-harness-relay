/**
 * Publishing the relay's configuration to the harness settings service.
 *
 * Registering a namespace is what puts the relay on the web UI's **Plugin
 * configuration** tab: that tab enumerates the namespaces the host serves and
 * dispatches one keyed slot per namespace, so the browser half's card and this
 * registration are two halves of one feature and share the namespace string.
 *
 * The wiring is a local copy of `installSettingsSection` from
 * `@deepseek-ai/dsh-settings` rather than an import of it. It is twenty lines
 * over two services this plugin already reaches through `ctx`, and importing
 * it would pin an out-of-tree plugin to one harness release in exchange for no
 * behaviour of its own.
 * @module dsh-relay/settings-section
 */
import type { Context } from '@deepseek-ai/cordis';
import type z from '@deepseek-ai/schemastery';
/** The settings namespace this plugin owns, in both halves. */
export declare const RELAY_NAMESPACE = "relay";
/**
 * Register the relay's configuration as an editable settings namespace.
 *
 * While a settings service exists, the composition entry becomes the `base`
 * layer and the resolved scope becomes the authoritative source; when the
 * service goes away the relay falls back to the entry it was composed with, so
 * a deployment that never mounted settings behaves exactly as configured.
 * @param ctx - the relay's plugin context.
 * @param schema - the plugin's own Config schema.
 * @param entry - the configuration composed from `cordis.yml`.
 * @param hooks.setSource - receives a thunk returning the authoritative value.
 * @param hooks.onChange - called after every change to that value.
 */
export declare function installSettingsSection<T>(ctx: Context, schema: z<T>, entry: T, hooks: {
    setSource: (current: () => T) => void;
    onChange: () => void;
}): void;
//# sourceMappingURL=settings-section.d.ts.map