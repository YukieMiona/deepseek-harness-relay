/**
 * dsh-relay — authenticated remote access to a DeepSeek Harness web profile.
 *
 * The harness serves its browser API on loopback and says plainly that its
 * `/api` trust fence "is not an auth layer", that its configuration plane
 * stays loopback-only "until a real authentication layer exists", and that
 * `--host 0.0.0.0` is refused because it "would expose remote code execution
 * to the network". This plugin is that missing layer, mounted beside the
 * harness rather than inside it.
 *
 * It starts its own listener, authenticates, and reverse-proxies to the
 * untouched loopback web server. The harness keeps its shipped bind, so a
 * failed or misconfigured relay leaves the harness unreachable from the
 * network rather than open to it.
 *
 * Everything registered here is an effect, so `dsh plugin remove`, a config
 * edit, or a hot reload closes the listeners, withdraws the mDNS record, and
 * stops the throttles without leaving a port bound.
 * @module dsh-relay
 */
import type { Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
export { Config } from './config.ts';
export type { CompatConfig, PrivilegedPolicy, TlsMode } from './config.ts';
/** Stable Cordis plugin name. */
export declare const name = "relay";
/** The harness web server this relay fronts. */
export declare const inject: string[];
/**
 * Mount the relay.
 * @param ctx - plugin context; `ctx.webServer` is the harness listener to front.
 * @param config - resolved configuration.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map