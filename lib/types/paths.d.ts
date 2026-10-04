/**
 * Where the relay keeps its own files.
 *
 * The harness resolves its home as an explicit override, then `$DSH_HOME`,
 * then `~/.dsh`, and provides `dshHomePath` as a root service. This module
 * prefers that service so a custom home is honoured identically, and mirrors
 * the same precedence when the service is absent (unit tests, a composition
 * that never mounted app-boot).
 * @module dsh-relay/paths
 */
import type { Context } from '@deepseek-ai/cordis';
/**
 * Resolve the directory holding this plugin's state, certificate, and key.
 * @param ctx - plugin context, read for the optional `dshHomePath` service.
 * @param configured - explicit override from plugin config; empty means unset.
 * @returns the absolute directory path, not yet created on disk.
 */
export declare function relayStateDir(ctx: Context, configured?: string): string;
//# sourceMappingURL=paths.d.ts.map