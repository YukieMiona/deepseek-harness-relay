// src/fence.ts
import { networkInterfaces } from "node:os";
var EMULATOR_HOST_ALIAS = "10.0.2.2";
function header(headers, name2) {
  const value = headers[name2];
  return typeof value === "string" ? value : void 0;
}
function parseAuthority(authority) {
  try {
    return new URL(`http://${authority}`);
  } catch {
    return void 0;
  }
}
function canonicalAuthority(authority, parsed) {
  const port = parsed.port !== "" ? parsed.port : new URL(`https://${authority}`).port;
  return port === "" ? parsed.hostname : `${parsed.hostname}:${port}`;
}
function isLoopbackHostname(hostname2) {
  if (hostname2 === "localhost" || hostname2 === "[::1]") return true;
  const parts = hostname2.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function isPrivateAddress(address) {
  const bare = address.replace(/^\[/, "").replace(/\]$/, "").replace(/^::ffff:/i, "");
  if (bare === "::1") return true;
  const lower = bare.toLowerCase();
  if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) return true;
  const octets = bare.split(".");
  if (octets.length !== 4) return false;
  if (!octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return false;
  const a = Number(octets[0]);
  const b = Number(octets[1]);
  if (a === 10 || a === 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}
function assertTrustedAuthority(entry) {
  const parsed = parseAuthority(entry);
  if (parsed !== void 0 && canonicalAuthority(entry, parsed) === entry.toLowerCase()) return;
  throw new Error(`dsh-relay: trustedHosts entry ${JSON.stringify(entry)} is not a bare host[:port] authority`);
}
function localAddresses() {
  const addresses = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) addresses.push(entry.address);
    }
  }
  return addresses;
}
function relayAuthorities(options) {
  return [.../* @__PURE__ */ new Set([
    "127.0.0.1",
    "localhost",
    ...localAddresses(),
    ...options.publicHostnames,
    ...options.trustedHosts
  ])];
}
function matchesAuthority(hostUrl, authorities) {
  return authorities.some((entry) => {
    const parsed = parseAuthority(entry);
    if (parsed === void 0) return false;
    return canonicalAuthority(entry, parsed) === parsed.hostname ? parsed.hostname === hostUrl.hostname : parsed.host === hostUrl.host;
  });
}
function isReadNavigation(request) {
  const method = (request.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return false;
  if (header(request.headers, "sec-fetch-mode") !== "navigate") return false;
  const destination = header(request.headers, "sec-fetch-dest");
  return destination === void 0 || destination === "document";
}
function checkFence(request, authorities) {
  const host = header(request.headers, "host");
  if (host === void 0) return "missing-host";
  const hostUrl = parseAuthority(host);
  if (hostUrl === void 0) return "unparsable-host";
  if (!isLoopbackHostname(hostUrl.hostname) && !(request.directLoopbackPeer === true && hostUrl.hostname === EMULATOR_HOST_ALIAS) && !matchesAuthority(hostUrl, authorities)) return "untrusted-host";
  if (header(request.headers, "sec-fetch-site") === "cross-site" && !isReadNavigation(request)) {
    return "cross-site";
  }
  const origin = header(request.headers, "origin");
  if (origin === void 0) return void 0;
  if (origin === "null") return "opaque-origin";
  try {
    return new URL(origin).host === hostUrl.host ? void 0 : "origin-mismatch";
  } catch {
    return "origin-mismatch";
  }
}

// src/auth/password.ts
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
var scryptAsync = promisify(scrypt);
var DEFAULT_COST = 16384;
var BLOCK_SIZE = 8;
var PARALLELISM = 1;
var KEY_LENGTH = 64;
var SALT_BYTES = 16;
function maxmemFor(cost) {
  return 256 * cost * BLOCK_SIZE * 2;
}
async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: DEFAULT_COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    maxmem: maxmemFor(DEFAULT_COST)
  });
  return {
    salt: salt.toString("hex"),
    hash: derived.toString("hex"),
    cost: DEFAULT_COST,
    updatedAt: Date.now()
  };
}
async function verifyPassword(record, candidate) {
  const expected = Buffer.from(record.hash, "hex");
  const derived = await scryptAsync(candidate.normalize("NFKC"), Buffer.from(record.salt, "hex"), expected.length, {
    N: record.cost,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    maxmem: maxmemFor(record.cost)
  });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

// src/auth/pairing.ts
import { randomInt } from "node:crypto";

// src/auth/tokens.ts
import { createHmac, randomBytes as randomBytes2, timingSafeEqual as timingSafeEqual2 } from "node:crypto";
var TOKEN_BYTES = 32;
var DEVICE_ID_BYTES = 8;
function constantTimeEqual(a, b) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual2(left, right);
}
function mintToken() {
  return randomBytes2(TOKEN_BYTES).toString("base64url");
}
function mintDeviceId() {
  return randomBytes2(DEVICE_ID_BYTES).toString("hex");
}
function hashToken(signingKey, token) {
  return createHmac("sha256", signingKey).update(token).digest("hex");
}
function signSession(signingKey, claims) {
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const signature = createHmac("sha256", signingKey).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
function verifySession(signingKey, value, now) {
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return void 0;
  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = createHmac("sha256", signingKey).update(payload).digest("base64url");
  if (!constantTimeEqual(signature, expected)) return void 0;
  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return void 0;
  }
  if (typeof claims.subject !== "string") return void 0;
  if (typeof claims.issuedAt !== "number" || typeof claims.expiresAt !== "number") return void 0;
  if (now >= claims.expiresAt) return void 0;
  if (now < claims.issuedAt) return void 0;
  return claims;
}
function readCookie(header2, name2) {
  if (header2 === void 0) return void 0;
  for (const part of header2.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name2) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return void 0;
}
function readBearer(header2) {
  if (header2 === void 0) return void 0;
  const match = /^Bearer +(\S+)$/i.exec(header2.trim());
  return match?.[1];
}

// src/auth/pairing.ts
var PairingWindow = class {
  #current;
  /**
   * Issue a fresh code, replacing any outstanding one.
   * @param digits - length of the numeric code.
   * @param windowMs - how long it stays claimable.
   * @param now - current epoch millis.
   * @returns the new code.
   */
  issue(digits, windowMs, now) {
    let code = "";
    while (code.length < digits) code += String(randomInt(0, 10));
    this.#current = { code, expiresAt: now + windowMs };
    return this.#current;
  }
  /**
   * The outstanding code, if one is still claimable.
   * @param now - current epoch millis.
   * @returns the code, or undefined when none is outstanding or it expired.
   */
  peek(now) {
    if (this.#current === void 0) return void 0;
    if (now >= this.#current.expiresAt) {
      this.#current = void 0;
      return void 0;
    }
    return this.#current;
  }
  /**
   * Claim the outstanding code.
   *
   * Success consumes it, so a code intercepted in transit is worthless once
   * the intended device has used it — and an operator who sees an unexpected
   * "already paired" is being told the code leaked.
   * @param candidate - the code as presented.
   * @param now - current epoch millis.
   * @returns true when the code matched and has now been consumed.
   */
  claim(candidate, now) {
    const current = this.peek(now);
    if (current === void 0) return false;
    if (!constantTimeEqual(candidate, current.code)) return false;
    this.#current = void 0;
    return true;
  }
  /** Withdraw any outstanding code. */
  clear() {
    this.#current = void 0;
  }
};
function pairingPayload(parts) {
  return {
    v: 1,
    kind: "dsh-relay-pair",
    url: parts.url,
    ...parts.plainUrl !== void 0 && { plainUrl: parts.plainUrl },
    ...parts.fingerprint !== void 0 && { fingerprint: parts.fingerprint },
    code: parts.code.code,
    expiresAt: parts.code.expiresAt
  };
}

// src/auth/ratelimit.ts
var IDLE_EVICTION_MS = 36e5;
var WINDOW_MS = 6e4;
var Throttle = class {
  /**
   * @param limits.requestsPerMinute - requests one address may make per minute.
   * @param limits.maxFailures - failed sign-ins before lockout.
   * @param limits.lockoutMs - how long a lockout lasts.
   */
  constructor(limits) {
    this.limits = limits;
    this.#sweep = setInterval(() => {
      this.#evict();
    }, IDLE_EVICTION_MS);
    this.#sweep.unref();
  }
  limits;
  #addresses = /* @__PURE__ */ new Map();
  #sweep;
  /**
   * Counters for one address, created on first sight.
   * @param address - normalized source address.
   * @returns the live counters.
   */
  #for(address) {
    let counters = this.#addresses.get(address);
    if (counters === void 0) {
      counters = { requests: [], failures: 0, lockedUntil: 0 };
      this.#addresses.set(address, counters);
    }
    return counters;
  }
  /**
   * Record one request and report whether it exceeds the rate limit.
   * @param address - normalized source address.
   * @param now - current epoch millis.
   * @returns true when the request is over the limit and must be refused.
   */
  exceedsRate(address, now) {
    const counters = this.#for(address);
    const cutoff = now - WINDOW_MS;
    while (counters.requests.length > 0 && counters.requests[0] <= cutoff) counters.requests.shift();
    counters.requests.push(now);
    return counters.requests.length > this.limits.requestsPerMinute;
  }
  /**
   * Whether sign-in from this address is currently locked out.
   * @param address - normalized source address.
   * @param now - current epoch millis.
   * @returns epoch millis the lockout ends, or undefined when not locked.
   */
  lockedUntil(address, now) {
    const counters = this.#addresses.get(address);
    if (counters === void 0 || counters.lockedUntil <= now) return void 0;
    return counters.lockedUntil;
  }
  /**
   * Record a failed sign-in, locking the address out at the threshold.
   * @param address - normalized source address.
   * @param now - current epoch millis.
   */
  recordFailure(address, now) {
    const counters = this.#for(address);
    counters.failures += 1;
    if (counters.failures >= this.limits.maxFailures) {
      counters.failures = 0;
      counters.lockedUntil = now + this.limits.lockoutMs;
    }
  }
  /**
   * Clear the failure counter after a successful sign-in.
   * @param address - normalized source address.
   */
  recordSuccess(address) {
    const counters = this.#addresses.get(address);
    if (counters === void 0) return;
    counters.failures = 0;
    counters.lockedUntil = 0;
  }
  /** Drop counters for addresses that have gone quiet. */
  #evict() {
    const cutoff = Date.now() - IDLE_EVICTION_MS;
    for (const [address, counters] of this.#addresses) {
      const lastRequest = counters.requests.at(-1) ?? 0;
      if (lastRequest <= cutoff && counters.lockedUntil <= Date.now()) this.#addresses.delete(address);
    }
  }
  /** Stop the eviction sweep and drop every counter. */
  dispose() {
    clearInterval(this.#sweep);
    this.#addresses.clear();
  }
};

// src/auth/index.ts
var SESSION_COOKIE = "dsh_relay_session";
var FORWARDING_TELLS = ["forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-real-ip", "via"];
function isForwarded(headers) {
  return FORWARDING_TELLS.some((name2) => headers[name2] !== void 0);
}
var Authenticator = class {
  /**
   * @param store - the durable state store.
   * @param config - resolved plugin configuration.
   */
  constructor(store, config) {
    this.store = store;
    this.config = config;
    this.#throttle = new Throttle({
      requestsPerMinute: config.rateLimitPerMinute,
      maxFailures: config.maxFailedAttempts,
      lockoutMs: config.lockoutMs
    });
    this.#reindex();
  }
  store;
  config;
  /** token hash → device id, rebuilt from the store on construction and on every mutation. */
  #tokenIndex = /* @__PURE__ */ new Map();
  #throttle;
  pairing = new PairingWindow();
  /** Rebuild the token lookup index from durable state. */
  #reindex() {
    const index = /* @__PURE__ */ new Map();
    for (const device of Object.values(this.store.state.devices)) {
      if (device.revokedAt !== void 0) continue;
      index.set(device.tokenHash, device.id);
    }
    this.#tokenIndex = index;
  }
  /** Whether a password has been set at all. */
  get hasPassword() {
    return this.store.state.password !== void 0;
  }
  /** Live, unrevoked devices, newest first. */
  get devices() {
    return Object.values(this.store.state.devices).filter((device) => device.revokedAt === void 0).toSorted((a, b) => b.createdAt - a.createdAt);
  }
  /**
   * Record one request against the per-address rate limit.
   * @param address - normalized source address.
   * @param now - current epoch millis.
   * @returns true when the request is over the limit and must be refused.
   */
  exceedsRate(address, now) {
    return this.#throttle.exceedsRate(address, now);
  }
  /**
   * When an address's lockout expires, or undefined when it is not locked out.
   * @param address - the normalized source address.
   * @param now - current epoch millis.
   * @returns epoch millis the lockout lifts.
   */
  lockedUntil(address, now) {
    return this.#throttle.lockedUntil(address, now);
  }
  /**
   * Classify one request.
   * @param request - the request's headers, source address, and locality.
   * @param now - current epoch millis.
   * @returns the credential class and what it entitles the caller to.
   */
  identify(request, now) {
    const allowPrivileged = this.config.privilegedMethods === "allow-authenticated";
    if (request.local && !isForwarded(request.headers)) return { credential: "loopback", privileged: true };
    const bearer = readBearer(request.headers.authorization);
    if (bearer !== void 0) {
      const device = this.#deviceForToken(bearer, now);
      if (device !== void 0) {
        return { credential: "device", deviceId: device.id, privileged: allowPrivileged };
      }
    }
    const cookie = readCookie(request.headers.cookie, SESSION_COOKIE);
    if (cookie !== void 0) {
      const claims = verifySession(this.store.state.signingKey, cookie, now);
      if (claims !== void 0) {
        return {
          credential: "session",
          ...claims.subject !== "password" && { deviceId: claims.subject },
          privileged: allowPrivileged
        };
      }
    }
    if (this.config.compat.addressGrants) {
      const grant = this.store.state.grants[request.address];
      if (grant !== void 0 && now < grant.expiresAt && now >= grant.createdAt) {
        const device = this.store.state.devices[grant.deviceId];
        if (device !== void 0 && device.revokedAt === void 0) {
          return { credential: "address-grant", deviceId: grant.deviceId, privileged: false };
        }
      }
    }
    return { credential: "none", privileged: false };
  }
  /**
   * Resolve a bearer token to its device.
   * @param token - the token as presented.
   * @param now - current epoch millis.
   * @returns the device, or undefined when the token is unknown, revoked, or expired.
   */
  #deviceForToken(token, now) {
    const deviceId = this.#tokenIndex.get(hashToken(this.store.state.signingKey, token));
    if (deviceId === void 0) return void 0;
    const device = this.store.state.devices[deviceId];
    if (device === void 0 || device.revokedAt !== void 0) return void 0;
    if (now >= device.expiresAt || now < device.createdAt) return void 0;
    return device;
  }
  /**
   * Set or replace the sign-in password.
   * @param password - the new plaintext.
   * @returns resolution once the hash is durable.
   */
  async setPassword(password) {
    const record = await hashPassword(password);
    await this.store.update((draft) => {
      draft.password = record;
    });
  }
  /**
   * Verify a sign-in and mint a session cookie.
   * @param password - the plaintext as typed.
   * @param address - normalized source address, for the lockout counter.
   * @param now - current epoch millis.
   * @returns the cookie to set, or the reason the attempt was refused.
   */
  async signIn(password, address, now) {
    const record = this.store.state.password;
    if (record === void 0) return "no-password";
    if (this.#throttle.lockedUntil(address, now) !== void 0) return "locked-out";
    if (!await verifyPassword(record, password)) {
      this.#throttle.recordFailure(address, now);
      return "bad-password";
    }
    this.#throttle.recordSuccess(address);
    const expiresAt = now + this.config.sessionTtlMs;
    return {
      cookie: signSession(this.store.state.signingKey, { subject: "password", issuedAt: now, expiresAt }),
      expiresAt
    };
  }
  /**
   * Enrol a device against the outstanding pairing code.
   * @param options.code - the code as presented.
   * @param options.name - the device label to record.
   * @param options.address - normalized source address.
   * @param now - current epoch millis.
   * @returns the minted token and its device, or undefined when the code did not match.
   */
  async pair(options, now) {
    if (this.#throttle.lockedUntil(options.address, now) !== void 0) return "locked-out";
    if (!this.pairing.claim(options.code, now)) {
      this.#throttle.recordFailure(options.address, now);
      return void 0;
    }
    this.#throttle.recordSuccess(options.address);
    const token = mintToken();
    const device = {
      id: mintDeviceId(),
      name: options.name.slice(0, 64) || "device",
      tokenHash: hashToken(this.store.state.signingKey, token),
      createdAt: now,
      expiresAt: now + this.config.deviceTokenTtlMs,
      lastAddress: options.address
    };
    await this.store.update((draft) => {
      draft.devices[device.id] = device;
      if (this.config.compat.addressGrants && isPrivateAddress(options.address)) {
        draft.grants[options.address] = {
          address: options.address,
          deviceId: device.id,
          createdAt: now,
          expiresAt: now + this.config.compat.addressGrantTtlMs
        };
      }
    });
    this.#reindex();
    return { token, device };
  }
  /**
   * Refresh a device's grant after an accepted request from a new address.
   * @param deviceId - the device.
   * @param address - normalized source address.
   * @param now - current epoch millis.
   * @returns resolution once the record is durable.
   */
  async touch(deviceId, address, now) {
    const device = this.store.state.devices[deviceId];
    if (device === void 0) return;
    if (device.lastAddress === address && (device.lastSeenAt ?? 0) > now - 6e4) return;
    await this.store.update((draft) => {
      const record = draft.devices[deviceId];
      if (record === void 0) return;
      record.lastSeenAt = now;
      record.lastAddress = address;
      if (this.config.compat.addressGrants && isPrivateAddress(address)) {
        draft.grants[address] = {
          address,
          deviceId,
          createdAt: now,
          expiresAt: now + this.config.compat.addressGrantTtlMs
        };
      }
    });
  }
  /**
   * Revoke one device and every grant it created.
   * @param deviceId - the device to revoke.
   * @param now - current epoch millis.
   * @returns true when a live device was revoked.
   */
  async revoke(deviceId, now) {
    const device = this.store.state.devices[deviceId];
    if (device === void 0 || device.revokedAt !== void 0) return false;
    await this.store.update((draft) => {
      const record = draft.devices[deviceId];
      if (record !== void 0) record.revokedAt = now;
      for (const [address, grant] of Object.entries(draft.grants)) {
        if (grant.deviceId === deviceId) delete draft.grants[address];
      }
    });
    this.#reindex();
    return true;
  }
  /**
   * Rotate the signing key, invalidating every cookie and every device token.
   *
   * Device records are dropped rather than kept with dead hashes: a token hash
   * is keyed by the signing key, so after rotation none of them could ever
   * match again and leaving them would only misreport what is enrolled.
   * @returns resolution once the new key is durable.
   */
  async signOutEverywhere() {
    const { randomBytes: randomBytes5 } = await import("node:crypto");
    await this.store.update((draft) => {
      draft.signingKey = randomBytes5(32).toString("base64url");
      draft.devices = {};
      draft.grants = {};
    });
    this.#reindex();
    this.pairing.clear();
  }
  /** Stop the throttle sweep. */
  dispose() {
    this.#throttle.dispose();
    this.pairing.clear();
  }
};

// src/config.ts
import z from "@deepseek-ai/schemastery";
var Config = z.object({
  bind: z.string().default("0.0.0.0"),
  port: z.natural().max(65535).default(3443),
  stateDir: z.string().required(),
  trustedHosts: z.array(String).default([]),
  publicHostnames: z.array(String).default([]),
  tls: z.union(["self-signed", "files", "off"]).default("self-signed"),
  tlsCertPath: z.string().default(""),
  tlsKeyPath: z.string().default(""),
  auth: z.union(["password", "device-token", "both"]).default("both"),
  sessionTtlMs: z.natural().min(6e4).default(432e5),
  deviceTokenTtlMs: z.natural().min(6e4).default(2592e6),
  pairingWindowMs: z.natural().min(1e4).default(3e5),
  pairingCodeLength: z.natural().min(6).max(12).default(8),
  maxFailedAttempts: z.natural().min(1).default(5),
  lockoutMs: z.natural().min(1e3).default(9e5),
  rateLimitPerMinute: z.natural().min(1).default(600),
  privilegedMethods: z.union(["allow-authenticated", "loopback-only"]).default("allow-authenticated"),
  extraProxyPaths: z.array(String).default([]),
  proxyTimeoutMs: z.natural().min(1e3).default(12e4),
  compat: z.object({
    addressGrants: z.boolean().default(true),
    addressGrantTtlMs: z.natural().min(6e4).default(864e5),
    plainPort: z.natural().max(65535).default(0)
  }),
  uiLink: z.boolean().default(true),
  mdns: z.boolean().default(true),
  mdnsName: z.string().default("")
});
function assertCoherent(config) {
  if (config.tls === "files" && (config.tlsCertPath === "" || config.tlsKeyPath === "")) {
    throw new Error('dsh-relay: tls "files" requires both tlsCertPath and tlsKeyPath');
  }
  if (config.compat.plainPort !== 0 && config.compat.plainPort === config.port) {
    throw new Error("dsh-relay: compat.plainPort must differ from port");
  }
  for (const path of config.extraProxyPaths) {
    if (!path.startsWith("/")) {
      throw new Error(`dsh-relay: extraProxyPaths entry ${JSON.stringify(path)} must start with "/"`);
    }
  }
}

// src/badge.ts
var ELEMENT_ID = "dsh-relay-link";
var TARGET_PATH = "/relay/devices";
var MARKUP = `<a id="${ELEMENT_ID}" href="${TARGET_PATH}" title="dsh-relay \u2014 pairing, devices, and password">
<svg width="14" height="14" viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="2.4" fill="currentColor"/><path d="M6.6 6.6a6.2 6.2 0 0 0 0 8.8M15.4 6.6a6.2 6.2 0 0 1 0 8.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
<span>Relay</span></a>
<style>
#${ELEMENT_ID} {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483000;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 14px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
  background: var(--dsw-alias-bg-layer-2, #fff);
  color: var(--dsw-alias-label-secondary, #61666b);
  font: 12px/18px var(--dsw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  text-decoration: none;
  box-shadow: var(--dsw-shadow-lv1, 0 2px 4px 0 rgba(0, 0, 0, 0.05));
  opacity: 0.75;
  transition: opacity 0.2s var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)),
    background 0.2s var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1));
}
#${ELEMENT_ID}:hover, #${ELEMENT_ID}:focus-visible {
  opacity: 1;
  color: var(--dsw-alias-label-primary, #0f1115);
  background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06));
}
@media (prefers-reduced-motion: reduce) { #${ELEMENT_ID} { transition: none; } }
</style>`;
function injectRelayLink(html) {
  if (html.includes(ELEMENT_ID)) return html;
  const close = html.lastIndexOf("</body>");
  if (close < 0) return html;
  return `${html.slice(0, close)}${MARKUP}
${html.slice(close)}`;
}

// src/harness-session.ts
import { createHash, createHmac as createHmac2, randomBytes as randomBytes3 } from "node:crypto";
var RECORD_KEY = "client-connection/browser-session";
var COOKIE_PREFIX = "dsh-auth-";
var COOKIE_PAYLOAD_VERSION = 1;
var STORED_SECRET_VERSION = 1;
var SECRET_BYTES = 32;
var LIFETIME_MS = 6e4;
function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readSecret(record) {
  if (!isRecord(record) || record.kind !== "grant" || !isRecord(record.payload)) return void 0;
  if (record.payload.version !== STORED_SECRET_VERSION) return void 0;
  const secret = record.payload.secret;
  if (typeof secret !== "string") return void 0;
  const decoded = Buffer.from(secret.replaceAll("-", "+").replaceAll("_", "/"), "base64");
  return decoded.byteLength === SECRET_BYTES ? decoded : void 0;
}
function cookieName(authority) {
  return COOKIE_PREFIX + encodeBase64Url(createHash("sha256").update(authority).digest());
}
var HarnessSession = class _HarnessSession {
  constructor(secret) {
    this.secret = secret;
  }
  secret;
  /**
   * Load the harness's cookie-signing secret.
   *
   * @param ctx - plugin context; `ctx.credentials` is the harness's own store.
   * @returns a minter, or undefined when this harness keeps no such secret —
   *   which is every release before 0.1.2, where nothing needed one.
   */
  static async load(ctx) {
    try {
      const credentials = ctx.get("credentials");
      if (credentials?.readRecord !== void 0) {
        const record = await credentials.readRecord(RECORD_KEY).catch(() => void 0);
        const secret = readSecret(record);
        if (secret !== void 0) return new _HarnessSession(secret);
      }
    } catch {
    }
    try {
      const home = process.env.DSH_HOME || process.env.USERPROFILE || process.env.HOME || "";
      const { join: join4 } = await import("node:path");
      const { existsSync, readFileSync } = await import("node:fs");
      const credPath = join4(home, ".dsh", ".credentials.yaml");
      if (existsSync(credPath)) {
        const raw = readFileSync(credPath, "utf8");
        const match = /client-connection\/browser-session:[\s\S]*?secret:\s*([A-Za-z0-9_\-]+)/.exec(raw);
        if (match && match[1]) {
          const decoded = Buffer.from(match[1].replaceAll("-", "+").replaceAll("_", "/"), "base64");
          if (decoded.byteLength === SECRET_BYTES) {
            return new _HarnessSession(decoded);
          }
        }
      }
    } catch {
    }
    return void 0;
  }
  /**
   * A minter backed by a secret of the caller's choosing. Tests only.
   * @param secret - a 32-byte signing secret.
   * @returns a minter over that secret.
   */
  static forTesting(secret = randomBytes3(SECRET_BYTES)) {
    return new _HarnessSession(secret);
  }
  /**
   * The `Cookie` header value proving a browser session for [authority].
   * @param authority - the upstream `host:port` this request will carry.
   * @returns one `name=value` pair, ready to send as `Cookie`.
   */
  cookieFor(authority) {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + LIFETIME_MS;
    const body = encodeBase64Url(Buffer.from(JSON.stringify({
      version: COOKIE_PAYLOAD_VERSION,
      authority,
      issuedAt,
      expiresAt
    }), "utf8"));
    const signature = encodeBase64Url(createHmac2("sha256", this.secret).update(body).digest());
    return `${cookieName(authority)}=v1.${body}.${signature}`;
  }
};

// src/mdns.ts
import { hostname } from "node:os";
var SERVICE_TYPE = "dsh";
async function advertise(advertisement, onError) {
  let bonjour;
  try {
    const module = await import("bonjour-service");
    bonjour = new module.Bonjour();
  } catch (error) {
    onError(`mDNS unavailable: ${String(error)}`);
    return async () => void 0;
  }
  try {
    const service = bonjour.publish({
      // The port is part of the default name because a name collision on the
      // network is reported as a failure, and two relays on one machine — a
      // second harness, or one being tested beside another — are ordinary.
      name: advertisement.name === "" ? `DSH Relay on ${hostname()} (${String(advertisement.port)})` : advertisement.name,
      type: SERVICE_TYPE,
      port: advertisement.port,
      txt: {
        v: "1",
        relay: "dsh-relay",
        tls: advertisement.tls,
        ...advertisement.plainPort !== void 0 && { plain: String(advertisement.plainPort) },
        ...advertisement.fingerprint !== void 0 && { pin: advertisement.fingerprint }
      }
    });
    service.on("error", (error) => {
      onError(`mDNS advertisement failed, continuing without it: ${String(error)}`);
    });
  } catch (error) {
    onError(`mDNS publish failed: ${String(error)}`);
    bonjour.destroy();
    return async () => void 0;
  }
  return async () => {
    await new Promise((resolve2) => {
      bonjour.unpublishAll(() => {
        resolve2();
      });
    });
    bonjour.destroy();
  };
}

// src/paths.ts
import { homedir } from "node:os";
import { join, resolve } from "node:path";
var DEFAULT_HOME_DIR = ".dsh";
var HOME_ENV = "DSH_HOME";
var RELAY_DIR = "relay";
function expandHomePath(path) {
  if (path === "~") return homedir();
  if (path.startsWith("~/") || path.startsWith("~\\")) return join(homedir(), path.slice(2));
  return path;
}
function relayStateDir(ctx, configured) {
  if (configured !== void 0 && configured.trim().length > 0) {
    return resolve(expandHomePath(configured));
  }
  const provided = ctx.get("dshHomePath");
  if (typeof provided === "function") return provided(RELAY_DIR);
  const fromEnv = process.env[HOME_ENV];
  const home = fromEnv !== void 0 && fromEnv.trim().length > 0 ? fromEnv : join(homedir(), DEFAULT_HOME_DIR);
  return join(resolve(expandHomePath(home)), RELAY_DIR);
}

// src/settings-section.ts
var FIBER_DISPOSED = 4;
var FIBER_UNLOADING = 5;
var RELAY_NAMESPACE = "relay";
var NAMESPACE_PATTERN = /^[a-z][\da-z]*(-[\da-z]+)*$/;
function isUnloading(ctx) {
  const state = ctx.fiber.state;
  return state === FIBER_UNLOADING || state === FIBER_DISPOSED;
}
function installSettingsSection(ctx, schema, entry, hooks) {
  if (!NAMESPACE_PATTERN.test(RELAY_NAMESPACE)) {
    throw new Error(`dsh-relay: settings namespace ${JSON.stringify(RELAY_NAMESPACE)} must be lowercase kebab-case`);
  }
  ctx.inject(["settings"], (scoped) => {
    const settings = scoped.get("settings");
    const scope = settings.register(RELAY_NAMESPACE, schema, { base: entry });
    hooks.setSource(() => scope.get());
    hooks.onChange();
    scoped.effect(() => () => {
      if (isUnloading(ctx)) return;
      hooks.setSource(() => entry);
      hooks.onChange();
    }, "dsh-relay: settings fallback");
    scope.watch(() => {
      if (isUnloading(ctx)) return;
      hooks.onChange();
    });
  });
}

// src/routes.ts
import QRCode from "qrcode";

// src/pages/theme.ts
var THEME_CSS = `
:root {
  --dsw-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --ds-font-family-code: 'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas,
    'Liberation Mono', Menlo, Courier, 'PingFang SC', 'Microsoft YaHei';
  --ds-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ds-transition-duration: 0.2s;
  /* Shadows are the one family upstream does not flip between themes. */
  --dsw-shadow-lv1: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  --dsw-shadow-lv3:
    0 0 1px 0 rgba(0, 0, 0, 0.2), 0 0 4px 0 rgba(0, 0, 0, 0.02), 0 12px 32px 0 rgba(0, 0, 0, 0.08);
}

body {
  --dsw-alias-bg-base: rgb(255, 255, 255);
  --dsw-alias-bg-layer-1: rgb(255, 255, 255);
  --dsw-alias-bg-layer-2: rgb(255, 255, 255);
  --dsw-alias-bg-layer-3: rgb(255, 255, 255);
  --dsw-alias-bg-module-platform: rgb(245, 246, 247);
  --dsw-alias-border-l1: rgba(0, 0, 0, 0.04);
  --dsw-alias-border-l2: rgba(0, 0, 0, 0.1);
  --dsw-alias-border-l3: rgba(0, 0, 0, 0.12);
  --dsw-alias-brand-primary: rgb(15, 17, 21);
  --dsw-alias-button-primary-fill: rgb(15, 17, 21);
  --dsw-alias-button-primary-hover: rgb(67, 69, 74);
  --dsw-alias-interactive-bg-hover: rgba(38, 49, 72, 0.06);
  --dsw-alias-interactive-bg-active: rgba(38, 49, 72, 0.1);
  --dsw-alias-label-primary: rgb(15, 17, 21);
  --dsw-alias-label-secondary: rgb(97, 102, 107);
  --dsw-alias-label-tertiary: rgb(129, 133, 140);
  --dsw-alias-label-caption: rgb(173, 178, 184);
  --dsw-alias-label-dimmed: rgb(225, 229, 238);
  --dsw-alias-label-primary-foreground: rgb(255, 255, 255);
  --dsw-alias-scrollbar-bg-l2: rgb(229, 229, 229);
  --dsw-alias-scrollbar-hover-l2: rgb(212, 212, 212);
  --dsw-alias-state-business-primary: rgb(65, 118, 230);
  --dsw-alias-state-error-primary: rgb(236, 19, 19);
  --dsw-alias-state-success-primary: rgb(34, 197, 94);
  --dsw-alias-state-warn-primary: rgb(245, 158, 11);
  --dsw-alias-state-warn-tertiary: rgb(254, 245, 231);
  --dsw-alias-state-warn-label: rgb(221, 134, 41);
  --dsw-static-neutral-bluish-400: rgb(173, 178, 184);
  --dsw-specific-login-input: rgb(249, 250, 251);
  --dsw-specific-tip: rgb(245, 246, 247);
  /* Upstream has no state-error-tertiary alias, so an error notice was
     borrowing the amber warn surface. These are its red-100 and red-900 steps. */
  --dsw-specific-error-tip: rgb(254, 226, 226);
  --dsw-qr-ink: rgb(15, 17, 21);
  --dsw-qr-paper: rgb(255, 255, 255);
}

body[data-ds-dark-theme] {
  --dsw-alias-bg-base: rgb(21, 21, 23);
  --dsw-alias-bg-layer-1: rgb(35, 35, 36);
  --dsw-alias-bg-layer-2: rgb(44, 44, 46);
  --dsw-alias-bg-layer-3: rgb(53, 54, 56);
  --dsw-alias-bg-module-platform: rgb(53, 54, 56);
  --dsw-alias-border-l1: rgba(255, 255, 255, 0.06);
  --dsw-alias-border-l2: rgba(255, 255, 255, 0.12);
  --dsw-alias-border-l3: rgba(255, 255, 255, 0.16);
  --dsw-alias-brand-primary: rgb(249, 250, 251);
  --dsw-alias-button-primary-fill: rgb(249, 250, 251);
  --dsw-alias-button-primary-hover: rgb(235, 238, 242);
  --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, 0.08);
  --dsw-alias-interactive-bg-active: rgba(255, 255, 255, 0.14);
  --dsw-alias-label-primary: rgb(249, 250, 251);
  --dsw-alias-label-secondary: rgb(207, 211, 214);
  --dsw-alias-label-tertiary: rgb(173, 178, 184);
  --dsw-alias-label-caption: rgb(129, 133, 140);
  --dsw-alias-label-dimmed: rgb(67, 69, 74);
  --dsw-alias-label-primary-foreground: rgb(15, 17, 21);
  --dsw-alias-scrollbar-bg-l2: rgb(84, 85, 87);
  --dsw-alias-scrollbar-hover-l2: rgb(101, 103, 107);
  --dsw-alias-state-business-primary: rgb(103, 158, 254);
  --dsw-alias-state-error-primary: rgb(242, 90, 90);
  --dsw-alias-state-warn-tertiary: rgb(39, 36, 31);
  --dsw-specific-login-input: rgb(27, 27, 28);
  --dsw-specific-tip: rgb(53, 54, 56);
  --dsw-specific-error-tip: rgb(87, 12, 12);
  --dsw-qr-ink: rgb(15, 17, 21);
  --dsw-qr-paper: rgb(249, 250, 251);
}

html { height: 100%; }
body { min-height: 100%; margin: 0; }

body {
  font-family: var(--dsw-font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
  display: flex;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

button, input, select, textarea { font-family: inherit; }

/* Scrollbar skin, ported from the harness sheet so a scrolling relay page does
   not render a light native bar over the dark palette. The @supports gate is
   load-bearing rather than defensive: a non-auto scrollbar-color makes
   Chromium and Safari drop every ::-webkit-scrollbar rule, so declaring both
   paths silences the hover state on exactly the engines that implement it. */
@supports not selector(::-webkit-scrollbar) {
  body, body * {
    scrollbar-width: thin;
    scrollbar-color: var(--dsw-alias-scrollbar-bg-l2) transparent;
  }
}
@supports selector(::-webkit-scrollbar) {
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { border-radius: 4px; background: var(--dsw-alias-scrollbar-bg-l2); }
  ::-webkit-scrollbar-thumb:hover { background: var(--dsw-alias-scrollbar-hover-l2); }
}

/* Centred by auto margins rather than align-items: a flex item centred on the
   cross axis is clipped past the top of the viewport once it grows taller than
   one, and the device list does. Auto margins centre while there is room and
   yield to the scroll when there is not. */
.card {
  width: min(380px, 100%);
  margin: auto 0;
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 24px;
  background: var(--dsw-alias-bg-layer-2);
  box-shadow: var(--dsw-shadow-lv3);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card.wide { width: min(560px, 100%); }

.brand { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-brand-primary); }
.brand svg { display: block; }
.brand .wordmark { font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: 0.08em; }

h1 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 500; }
p { margin: 0; font-size: 14px; line-height: 22px; color: var(--dsw-alias-label-secondary); }
.caption { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
code, .mono { font-family: var(--ds-font-family-code); font-size: 13px; line-height: 20px; }

form { display: flex; flex-direction: column; gap: 12px; }
label { font-size: 13px; line-height: 20px; font-weight: 500; }

input[type="text"], input[type="password"] {
  height: 36px;
  box-sizing: border-box;
  width: 100%;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-specific-login-input);
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
  outline: none;
  transition: border-color var(--ds-transition-duration) var(--ds-ease-in-out);
}
input:focus-visible { border-color: var(--dsw-alias-state-business-primary); }

/* The capsule from the harness's Button primitive: h36, pad 0/14, gap 4, r18,
   with the compact form at h28/r14. The .btn class carries the same geometry
   onto an anchor, so a navigation target is a control rather than a line of
   underlined text: every action on these pages ends up with one weight and one
   hit target whether it posts a form or follows a link. */
button, .btn {
  height: 36px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 14px;
  border: none;
  border-radius: 18px;
  cursor: pointer;
  font-size: 14px;
  line-height: 22px;
  font-weight: 400;
  color: var(--dsw-alias-label-primary);
  background: transparent;
  text-decoration: none;
  transition: background var(--ds-transition-duration) var(--ds-ease-in-out),
    color var(--ds-transition-duration) var(--ds-ease-in-out);
}
button:disabled { cursor: not-allowed; opacity: 0.4; }
button.primary, .btn.primary {
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
}
button.primary:hover:not(:disabled), .btn.primary:hover {
  background: var(--dsw-alias-button-primary-hover);
}
button.outline, .btn.outline { border: 1px solid var(--dsw-alias-border-l2); }
button.outline:hover:not(:disabled), .btn.outline:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
button.ghost, .btn.ghost { color: var(--dsw-alias-label-secondary); }
button.ghost:hover:not(:disabled), .btn.ghost:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
button.ghost:active:not(:disabled), .btn.ghost:active {
  background: var(--dsw-alias-interactive-bg-active);
}
button.sm, .btn.sm { height: 28px; padding: 0 10px; border-radius: 14px; font-size: 12px; line-height: 18px; }
button:focus-visible, .btn:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}

/* One row of equal-weight actions. A form is a column everywhere else on these
   pages, which would otherwise put every single-button form on a line of its
   own; inside an action row it is only the wrapper its button needs to post,
   so display: contents lets the button itself be the flex item. */
.actions { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; }
.actions form { display: contents; }
.actions > .btn, .actions > button, .actions form > button { flex: 1 1 auto; }
.actions.stack { flex-direction: column; }
.actions.stack > .btn, .actions.stack > button, .actions.stack form > button { flex: none; }

/* A link inside running prose keeps the accent treatment. A link wearing .btn
   is a control, and a control never underlines. */
a { color: var(--dsw-alias-state-business-primary); text-decoration: none; }
a:hover, a:focus-visible { text-decoration: underline; }
a.btn:hover, a.btn:focus-visible { text-decoration: none; }

.notice {
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 20px;
}
.notice.error { background: var(--dsw-specific-error-tip); color: var(--dsw-alias-state-error-primary); }
.notice.warn { background: var(--dsw-alias-state-warn-tertiary); color: var(--dsw-alias-state-warn-label); }
.notice.tip { background: var(--dsw-specific-tip); color: var(--dsw-alias-label-secondary); }

.rows { display: flex; flex-direction: column; gap: 8px; }
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
}
.row .meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.row .name { font-size: 14px; line-height: 22px; font-weight: 500; }
.row .sub { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.row form { display: contents; }
.row .end { display: flex; align-items: center; gap: 10px; flex: none; }

/* The StateDot halo: a full-size layer at a tenth opacity behind a solid core
   inset to 60%, both riding the colour its state sets on the element. */
.dot {
  position: relative;
  display: inline-block;
  width: 10px;
  height: 10px;
  flex: none;
}
.dot::before, .dot::after { content: ''; position: absolute; border-radius: 50%; background: currentColor; }
.dot::before { inset: 0; opacity: 0.1; }
.dot::after { inset: 20%; }
.dot.ok { color: var(--dsw-alias-state-success-primary); }
.dot.off { color: var(--dsw-alias-label-caption); }

.qr { display: flex; justify-content: center; padding: 16px; border-radius: 12px; background: var(--dsw-qr-paper); }
.qr svg { width: 100%; height: auto; max-width: 260px; shape-rendering: crispEdges; }

.code {
  text-align: center;
  font-family: var(--ds-font-family-code);
  font-size: 24px;
  line-height: 32px;
  letter-spacing: 0.24em;
  font-weight: 600;
}

.fingerprint { word-break: break-all; color: var(--dsw-alias-label-tertiary); }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
`;
var THEME_BOOT_JS = `
try {
  var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.body.toggleAttribute('data-ds-dark-theme', dark);
} catch (error) { /* a browser without matchMedia simply stays light */ }
`;

// src/pages/layout.ts
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
var MARK = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
  <circle cx="11" cy="11" r="2.4" fill="currentColor"/>
  <path d="M6.6 6.6a6.2 6.2 0 0 0 0 8.8M15.4 6.6a6.2 6.2 0 0 1 0 8.8"
        stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M3.6 3.6a10.4 10.4 0 0 0 0 14.8M18.4 3.6a10.4 10.4 0 0 1 0 14.8"
        stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.4"/>
</svg>`;
function page(options) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(options.title)}</title>
<style>${THEME_CSS}</style>
</head>
<body>
<script>${THEME_BOOT_JS}</script>
<main class="card${options.wide === true ? " wide" : ""}">
  <div class="brand">${MARK}<span class="wordmark">DSH RELAY</span></div>
  ${options.body}
</main>
</body>
</html>
`;
}

// src/pages/views.ts
function since(timestamp, now) {
  if (timestamp === void 0) return "never";
  const seconds = Math.max(0, Math.round((now - timestamp) / 1e3));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${String(minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${String(hours)} h ago`;
  return `${String(Math.round(hours / 24))} d ago`;
}
function loginPage(options) {
  const notice = options.error === void 0 ? "" : `<div class="notice error">${escapeHtml(options.error)}</div>`;
  return page({
    title: "Sign in",
    body: `
  <h1>Sign in</h1>
  <p>This relay fronts a DeepSeek Harness on this machine.</p>
  ${notice}
  <form method="post" action="/relay/login">
    <input type="hidden" name="next" value="${escapeHtml(options.next)}">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
    <button class="primary" type="submit">Sign in</button>
  </form>`
  });
}
function passwordPage(options) {
  const notice = options.error === void 0 ? "" : `<div class="notice error">${escapeHtml(options.error)}</div>`;
  const heading = options.hasPassword ? "Change the password" : "Set a password";
  const lead = options.hasPassword ? 'Replacing it does not sign anyone out. Use <a href="/relay/devices">sign out everywhere</a> on the devices page for that.' : "Nobody can sign in from the network until you set one. Anyone who does can run commands on this machine, because that is what the agent does.";
  return page({
    title: heading,
    body: `
  <h1>${escapeHtml(heading)}</h1>
  <p>${lead}</p>
  ${notice}
  <form method="post" action="/relay/password">
    <input type="hidden" name="next" value="${escapeHtml(options.next)}">
    <label for="password">${options.hasPassword ? "New password" : "Password"}</label>
    <input id="password" name="password" type="password" autocomplete="new-password" required minlength="10" autofocus>
    <label for="confirm">Confirm</label>
    <input id="confirm" name="confirm" type="password" autocomplete="new-password" required minlength="10">
    <button class="primary" type="submit">${options.hasPassword ? "Replace password" : "Set password"}</button>
  </form>
  <p class="caption">At least 10 characters. Only reachable from the machine running the harness${options.hasPassword ? ", or with an existing session" : ""}.</p>`
  });
}
function pairPage(options) {
  const plain = options.plainUrl === void 0 ? "" : `<div class="notice tip">DSH Mobile 0.5.0 cannot use TLS, so it connects over the plain listener instead:
       <br><span class="mono">${escapeHtml(options.plainUrl)}</span></div>`;
  const pin = options.fingerprint === void 0 ? `<div class="notice warn">This relay is serving plaintext. Anything on the network path can read the traffic.</div>` : `<p class="caption fingerprint">Certificate pin (SHA-256/SPKI)<br><span class="mono">${escapeHtml(options.fingerprint)}</span></p>`;
  return page({
    wide: true,
    title: "Pair a device",
    body: `
  <h1>Pair a device</h1>
  <p>Scan this on the device, or open <span class="mono">${escapeHtml(options.url)}/relay/pair</span> there and type the code.</p>
  <div class="qr">${options.qrSvg}</div>
  <div class="code">${escapeHtml(options.code)}</div>
  <p class="caption">Expires in ${String(options.expiresInSeconds)} seconds, and works once.</p>
  ${plain}
  ${pin}
  <div class="actions">
    <form method="post" action="/relay/pair/new">
      <button class="outline" type="submit">New code</button>
    </form>
    <a class="btn outline" href="/relay/devices">Paired devices</a>
  </div>
  <div class="actions">
    <a class="btn ghost" href="/">Back to the harness</a>
  </div>`
  });
}
function claimPage(options) {
  const notice = options.error === void 0 ? "" : `<div class="notice error">${escapeHtml(options.error)}</div>`;
  return page({
    title: "Pair this device",
    body: `
  <h1>Pair this device</h1>
  <p>Enter the code shown on the machine running the harness.</p>
  ${notice}
  <form method="post" action="/relay/pair">
    <label for="code">Pairing code</label>
    <input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
           required value="${escapeHtml(options.code ?? "")}" ${options.code === void 0 ? "autofocus" : ""}>
    <label for="name">Device name</label>
    <input id="name" name="name" type="text" required maxlength="64" placeholder="Pixel 8"
           ${options.code === void 0 ? "" : "autofocus"}>
    <button class="primary" type="submit">Pair</button>
  </form>`
  });
}
function pairedPage(options) {
  const grant = options.granted ? `<div class="notice tip">This device's network address is now accepted for a limited time, so DSH Mobile 0.5.0 \u2014
       which cannot send a credential of its own \u2014 can connect. It is not a substitute for the token: it stops working
       when the address changes, and it never reaches the harness settings or credentials.</div>` : "";
  const plain = options.plainUrl === void 0 ? "" : `<p class="caption">In DSH Mobile, connect to <span class="mono">${escapeHtml(options.plainUrl)}</span>.</p>`;
  return page({
    wide: true,
    title: "Device paired",
    body: `
  <h1>Paired</h1>
  <p><strong>${escapeHtml(options.deviceName)}</strong> is enrolled. Its token is shown once and never again \u2014 a client
     that supports it sends this as <span class="mono">Authorization: Bearer &lt;token&gt;</span>.</p>
  <div class="notice tip mono" style="word-break: break-all">${escapeHtml(options.token)}</div>
  ${grant}
  ${plain}
  <div class="actions">
    <a class="btn primary" href="/">Open the harness</a>
    <a class="btn outline" href="/relay/devices">Paired devices</a>
  </div>`
  });
}
function devicesPage(options) {
  const rows = options.devices.length === 0 ? '<p class="caption">Nothing paired yet.</p>' : options.devices.map((device) => `
    <div class="row">
      <div class="meta">
        <span class="name">${escapeHtml(device.name)}</span>
        <span class="sub">last seen ${escapeHtml(since(device.lastSeenAt, options.now))}${device.lastAddress === void 0 ? "" : ` &middot; ${escapeHtml(device.lastAddress)}`}</span>
      </div>
      <div class="end">
        <span class="dot ${device.lastSeenAt === void 0 ? "off" : "ok"}"></span>
        <form method="post" action="/relay/devices/revoke">
          <input type="hidden" name="deviceId" value="${escapeHtml(device.id)}">
          <button class="outline sm" type="submit">Revoke</button>
        </form>
      </div>
    </div>`).join("");
  const pin = options.fingerprint === void 0 ? "" : `<p class="caption fingerprint">Pin <span class="mono">${escapeHtml(options.fingerprint)}</span></p>`;
  const plain = options.plainUrl === void 0 ? "" : `<div class="row"><div class="meta"><span class="name">Plain listener</span>
       <span class="sub">${escapeHtml(options.plainUrl)} &middot; compatibility clients only</span></div>
       <span class="dot ok"></span></div>`;
  return page({
    wide: true,
    title: "Paired devices",
    body: `
  <h1>Paired devices</h1>
  <div class="rows">
    <div class="row">
      <div class="meta">
        <span class="name">Relay</span>
        <span class="sub">${escapeHtml(options.url)} &middot; TLS ${escapeHtml(options.tlsMode)}</span>
      </div>
      <span class="dot ok"></span>
    </div>
    ${plain}
  </div>
  ${pin}
  <div class="rows">${rows}</div>
  <div class="row">
    <div class="meta">
      <span class="name">Password sign-in</span>
      <span class="sub">${options.hasPassword ? "set" : "not set \u2014 nobody can sign in from the network"}</span>
    </div>
    <span class="dot ${options.hasPassword ? "ok" : "off"}"></span>
  </div>
  <div class="actions">
    <form method="post" action="/relay/pair/new">
      <button class="primary" type="submit">Pair a new device</button>
    </form>
  </div>
  <div class="actions">
    <a class="btn outline" href="/relay/password">${options.hasPassword ? "Change the password" : "Set a password"}</a>
    <form method="post" action="/relay/signout-everywhere">
      <button class="outline" type="submit">Sign out everywhere</button>
    </form>
  </div>
  <p class="caption">Signing out everywhere rotates the signing key: every paired device and every browser session stops working at once.</p>
  <div class="actions">
    <a class="btn ghost" href="/">Back to the harness</a>
  </div>`
  });
}
function messagePage(options) {
  return page({
    title: options.title,
    body: `
  <h1>${escapeHtml(options.title)}</h1>
  <div class="notice ${options.kind ?? "tip"}">${escapeHtml(options.message)}</div>
  <div class="actions">
    <a class="btn outline" href="/">Back</a>
  </div>`
  });
}

// src/wire.ts
var MAX_BODY_BYTES = 64 * 1024;
var NO_STORE = "no-store, no-cache, must-revalidate, private";
async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = chunk;
    total += buffer.length;
    if (total > MAX_BODY_BYTES) {
      req.destroy();
      return void 0;
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}
function parseFields(req, body) {
  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(body);
      const fields2 = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") fields2[key] = value;
      }
      return fields2;
    } catch {
      return {};
    }
  }
  const fields = {};
  for (const [key, value] of new URLSearchParams(body)) fields[key] = value;
  return fields;
}
function wantsJson(req) {
  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) return true;
  const accept = req.headers.accept ?? "";
  return accept.includes("application/json") && !accept.includes("text/html");
}
function sendHtml(res, status, html, extraHeaders = {}) {
  res.writeHead(status, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": NO_STORE,
    "referrer-policy": "same-origin",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    ...extraHeaders
  });
  res.end(html);
}
function sendJson(res, status, value, extraHeaders = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": NO_STORE,
    "x-content-type-options": "nosniff",
    ...extraHeaders
  });
  res.end(JSON.stringify(value));
}
function sendRedirect(res, location, extraHeaders = {}) {
  res.writeHead(303, { location, "cache-control": NO_STORE, ...extraHeaders });
  res.end();
}
function sessionCookie(options) {
  const parts = [
    `${options.name}=${encodeURIComponent(options.value)}`,
    "Path=/",
    "HttpOnly",
    // Strict rather than Lax: every relay form is same-origin, and a Lax
    // cookie would ride along on a top-level navigation another site initiated.
    "SameSite=Strict",
    `Max-Age=${String(options.maxAgeSeconds)}`
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}
function safeNextPath(value) {
  if (value === null || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

// src/routes.ts
var RELAY_PREFIX = "/relay";
function isOperator(identity) {
  return identity.credential === "loopback" || identity.credential === "session";
}
function isAuthenticated(identity) {
  return identity.credential !== "none";
}
function refuse(req, res, message) {
  if (wantsJson(req)) {
    sendJson(res, 403, { error: "forbidden", message });
    return;
  }
  sendHtml(res, 403, messagePage({ title: "Not allowed", message, kind: "error" }));
}
async function renderQr(context, code) {
  let reachableUrl = context.origin;
  try {
    const u = new URL(reachableUrl);
    if (isLoopbackHostname(u.hostname)) {
      if (context.config.publicHostnames.length > 0) {
        const target = context.config.publicHostnames[0];
        if (target) {
          u.hostname = target.replace(/:\d+$/, "");
          u.port = "";
          reachableUrl = u.origin;
        }
      } else {
        const lan = localAddresses()[0];
        if (lan !== void 0) {
          u.hostname = lan;
          reachableUrl = u.origin;
        }
      }
    }
  } catch {
  }
  let isPublicDomain = false;
  try {
    const parsed = new URL(reachableUrl);
    isPublicDomain = context.config.publicHostnames.some((h) => parsed.hostname === h.replace(/:\d+$/, "")) || !isLoopbackHostname(parsed.hostname) && !localAddresses().includes(parsed.hostname);
  } catch {
  }
  const payload = pairingPayload({
    url: reachableUrl,
    plainUrl: context.plainOrigin,
    fingerprint: isPublicDomain ? void 0 : context.fingerprint,
    code
  });
  return QRCode.toString(JSON.stringify(payload), {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0f1115", light: "#ffffff" }
  });
}
async function handleRelayRoute(req, res, url, context) {
  const { auth, config, identity, now } = context;
  const path = url.pathname;
  const method = req.method ?? "GET";
  if (path === "/relay/health" && (method === "GET" || method === "HEAD")) {
    sendJson(res, 200, { service: "dsh-relay", ok: true });
    return;
  }
  if (path === "/relay/login" && method === "GET") {
    if (!auth.hasPassword && isOperator(identity)) {
      sendRedirect(res, "/relay/password");
      return;
    }
    if (isAuthenticated(identity)) {
      sendRedirect(res, safeNextPath(url.searchParams.get("next")));
      return;
    }
    if (!auth.hasPassword) {
      refuse(req, res, "No password is set yet. Set one from the machine running the harness first.");
      return;
    }
    sendHtml(res, 200, loginPage({ next: safeNextPath(url.searchParams.get("next")) }));
    return;
  }
  if (path === "/relay/password" && method === "GET") {
    if (auth.hasPassword ? !isOperator(identity) : identity.credential !== "loopback") {
      refuse(req, res, "Set the password from the machine running the harness.");
      return;
    }
    sendHtml(res, 200, passwordPage({
      hasPassword: auth.hasPassword,
      next: safeNextPath(url.searchParams.get("next"))
    }));
    return;
  }
  if (path === "/relay/password" && method === "POST") {
    if (auth.hasPassword ? !isOperator(identity) : identity.credential !== "loopback") {
      refuse(req, res, "Set the password from the machine running the harness.");
      return;
    }
    const body = await readBody(req);
    if (body === void 0) {
      refuse(req, res, "Request too large.");
      return;
    }
    const fields = parseFields(req, body);
    const password = fields.password ?? "";
    const next = safeNextPath(fields.next ?? "/relay/devices");
    const reject = (message) => {
      sendHtml(res, 400, passwordPage({ hasPassword: auth.hasPassword, error: message, next }));
    };
    if (password.length < 10) {
      reject("Use at least 10 characters.");
      return;
    }
    if (fields.confirm !== void 0 && fields.confirm !== password) {
      reject("The two passwords do not match.");
      return;
    }
    await auth.setPassword(password);
    if (wantsJson(req)) {
      sendJson(res, 200, { ok: true });
      return;
    }
    sendRedirect(res, next);
    return;
  }
  if (path === "/relay/login" && method === "POST") {
    const body = await readBody(req);
    if (body === void 0) {
      refuse(req, res, "Request too large.");
      return;
    }
    const fields = parseFields(req, body);
    const next = safeNextPath(fields.next ?? "/");
    const outcome = await auth.signIn(fields.password ?? "", context.address, now);
    if (outcome === "no-password") {
      refuse(req, res, "No password is set yet.");
      return;
    }
    if (outcome === "locked-out") {
      sendHtml(res, 429, loginPage({ error: "Too many attempts. Try again later.", next }), {
        "retry-after": String(Math.ceil(config.lockoutMs / 1e3))
      });
      return;
    }
    if (outcome === "bad-password") {
      sendHtml(res, 403, loginPage({ error: "That password did not match.", next }));
      return;
    }
    const cookie = sessionCookie({
      name: SESSION_COOKIE,
      value: outcome.cookie,
      maxAgeSeconds: Math.floor(config.sessionTtlMs / 1e3),
      secure: context.secure
    });
    if (wantsJson(req)) {
      sendJson(res, 200, { expiresAt: outcome.expiresAt }, { "set-cookie": cookie });
      return;
    }
    sendRedirect(res, next, { "set-cookie": cookie });
    return;
  }
  if (path === "/relay/logout" && method === "POST") {
    const cookie = sessionCookie({ name: SESSION_COOKIE, value: "", maxAgeSeconds: 0, secure: context.secure });
    sendRedirect(res, "/relay/login", { "set-cookie": cookie });
    return;
  }
  if (path === "/relay/pair/new" && method === "POST") {
    if (!isOperator(identity)) {
      refuse(req, res, "Pairing codes are issued from the machine running the harness.");
      return;
    }
    auth.pairing.issue(config.pairingCodeLength, config.pairingWindowMs, now);
    sendRedirect(res, "/relay/pair");
    return;
  }
  if (path === "/relay/pair" && method === "GET") {
    if (isOperator(identity)) {
      const code = auth.pairing.peek(now) ?? auth.pairing.issue(config.pairingCodeLength, config.pairingWindowMs, now);
      let displayUrl = context.origin;
      try {
        const u = new URL(displayUrl);
        if (isLoopbackHostname(u.hostname)) {
          if (context.config.publicHostnames.length > 0) {
            const target = context.config.publicHostnames[0];
            if (target) {
              u.hostname = target.replace(/:\d+$/, "");
              u.port = "";
              displayUrl = u.origin;
            }
          } else {
            const lan = localAddresses()[0];
            if (lan !== void 0) {
              u.hostname = lan;
              displayUrl = u.origin;
            }
          }
        }
      } catch {
      }
      sendHtml(res, 200, pairPage({
        qrSvg: await renderQr(context, code),
        code: code.code,
        expiresInSeconds: Math.max(0, Math.round((code.expiresAt - now) / 1e3)),
        url: displayUrl,
        plainUrl: context.plainOrigin,
        fingerprint: context.fingerprint
      }));
      return;
    }
    const supplied = url.searchParams.get("code");
    sendHtml(res, 200, claimPage({ code: supplied ?? void 0 }));
    return;
  }
  if (path === "/relay/pair" && method === "POST") {
    const body = await readBody(req);
    if (body === void 0) {
      refuse(req, res, "Request too large.");
      return;
    }
    const fields = parseFields(req, body);
    const paired = await auth.pair({
      code: fields.code ?? "",
      name: fields.name ?? fields.deviceName ?? "device",
      address: context.address
    }, now);
    if (paired === "locked-out") {
      const until = auth.lockedUntil(context.address, now) ?? now + config.lockoutMs;
      const retryAfter = String(Math.max(1, Math.ceil((until - now) / 1e3)));
      if (wantsJson(req)) {
        sendJson(res, 429, { error: "rate-limited", message: "Too many attempts. Try again later." }, {
          "retry-after": retryAfter
        });
        return;
      }
      sendHtml(res, 429, claimPage({ error: "Too many attempts from this device. Try again later." }), {
        "retry-after": retryAfter
      });
      return;
    }
    if (paired === void 0) {
      if (wantsJson(req)) {
        sendJson(res, 403, { error: "pairing-failed", message: "That code is not valid." });
        return;
      }
      sendHtml(res, 403, claimPage({ error: "That code is not valid, has expired, or was already used." }));
      return;
    }
    const granted = context.config.compat.addressGrants && auth.identify({ headers: {}, address: context.address, local: false }, now).credential === "address-grant";
    if (wantsJson(req)) {
      const currentHost = (req.headers.host ?? "").replace(/:\d+$/, "");
      const isPublicHost = context.config.publicHostnames.some((h) => currentHost === h.replace(/:\d+$/, "")) || !isLoopbackHostname(currentHost) && !localAddresses().includes(currentHost);
      sendJson(res, 200, {
        deviceId: paired.device.id,
        token: paired.token,
        expiresAt: paired.device.expiresAt,
        ...!isPublicHost && context.fingerprint !== void 0 && { fingerprint: context.fingerprint }
      });
      return;
    }
    const cookie = sessionCookie({
      name: SESSION_COOKIE,
      value: "",
      maxAgeSeconds: 0,
      secure: context.secure
    });
    sendHtml(res, 200, pairedPage({
      deviceName: paired.device.name,
      token: paired.token,
      granted,
      plainUrl: context.plainOrigin
    }), { "set-cookie": cookie });
    return;
  }
  if (path === "/relay/devices" && method === "GET") {
    if (!isOperator(identity)) {
      refuse(req, res, "Sign in to manage devices.");
      return;
    }
    sendHtml(res, 200, devicesPage({
      devices: auth.devices,
      now,
      tlsMode: config.tls,
      hasPassword: auth.hasPassword,
      fingerprint: context.fingerprint,
      url: context.origin,
      plainUrl: context.plainOrigin
    }));
    return;
  }
  if (path === "/relay/devices/revoke" && method === "POST") {
    if (!isOperator(identity)) {
      refuse(req, res, "Sign in to manage devices.");
      return;
    }
    const body = await readBody(req);
    if (body === void 0) {
      refuse(req, res, "Request too large.");
      return;
    }
    const fields = parseFields(req, body);
    await auth.revoke(fields.deviceId ?? "", now);
    sendRedirect(res, "/relay/devices");
    return;
  }
  if (path === "/relay/signout-everywhere" && method === "POST") {
    if (!isOperator(identity)) {
      refuse(req, res, "Sign in to manage devices.");
      return;
    }
    await auth.signOutEverywhere();
    const cookie = sessionCookie({ name: SESSION_COOKIE, value: "", maxAgeSeconds: 0, secure: context.secure });
    sendRedirect(res, "/relay/login", { "set-cookie": cookie });
    return;
  }
  if (wantsJson(req)) {
    sendJson(res, 404, { error: "not-found" });
    return;
  }
  sendHtml(res, 404, messagePage({ title: "Not found", message: "No such relay endpoint.", kind: "error" }));
}

// src/secure-context.ts
var ELEMENT_ID2 = "dsh-relay-secure-context";
var SCRIPT = `(function(){try{
var c=globalThis.crypto;
if(!c||typeof c.randomUUID==='function'||typeof c.getRandomValues!=='function')return;
var mint=function(){
var b=c.getRandomValues(new Uint8Array(16));
b[6]=(b[6]&0x0f)|0x40;b[8]=(b[8]&0x3f)|0x80;
var h='';for(var i=0;i<16;i++)h+=(b[i]+0x100).toString(16).slice(1);
return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)};
try{Object.defineProperty(c,'randomUUID',{value:mint,configurable:true,writable:true})}
catch(e){c.randomUUID=mint}
}catch(e){}})()`;
var MARKUP2 = `<script id="${ELEMENT_ID2}">${SCRIPT}</script>`;
function injectSecureContextShim(html) {
  if (html.includes(ELEMENT_ID2)) return html;
  const open = /<head(?:\s[^>]*)?>/i.exec(html) ?? /<body(?:\s[^>]*)?>/i.exec(html);
  if (open === null) return html;
  const at = open.index + open[0].length;
  return `${html.slice(0, at)}${MARKUP2}${html.slice(at)}`;
}

// src/server.ts
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";

// src/privileged.ts
var PRIVILEGED_METHODS = /* @__PURE__ */ new Set([
  // ---- agent-preset authoring
  "agentPresets/read",
  "agentPresets/copy",
  "agentPresets/deletePreset",
  "agentPreset.read",
  "agentPreset.copy",
  "agentPreset.openDocument",
  "agentPreset.remove",
  // ---- host desktop and filesystem
  "directoryPicker/pick",
  "directoryPicker/list",
  "directoryPicker/createDirectory",
  "session/openWorkspacePath",
  "host.pickDirectory",
  "host.openPath",
  "host.listDirectory",
  "host.createDirectory",
  // ---- configuration plane
  "settings/describe",
  "settings/update",
  "settings/replace",
  "settings/mutate",
  "settings/openSettingsDocument",
  "settings/openAgentPresetDirectory",
  "settings.describe",
  "settings.openDocument",
  "settings.update",
  "settings.replace",
  "settings.mutate",
  // ---- secret store
  "credentials/describe",
  "credentials/set",
  "credentials/unset",
  "credentials.describe",
  "credentials.set",
  "credentials.unset",
  // ---- outbound probe carrying a draft credential
  "llm/discoverModels",
  "llm.discoverModels"
]);
function apiMethodOf(pathname) {
  return pathname.startsWith("/api/") ? pathname.slice("/api/".length) : void 0;
}
function isPinnedMethod(pathname, allowed) {
  if (allowed) return false;
  const method = apiMethodOf(pathname);
  return method !== void 0 && PRIVILEGED_METHODS.has(method);
}

// src/proxy/http.ts
import { request as httpRequest } from "node:http";

// src/proxy/rewrite.ts
var HOP_BY_HOP = /* @__PURE__ */ new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);
var RELAY_ONLY = /* @__PURE__ */ new Set(["authorization", "cookie"]);
function upstreamHeaders(headers, loopbackAuthority2, options = {}) {
  const dropped = new Set(HOP_BY_HOP);
  if (options.keepUpgrade === true) {
    dropped.delete("connection");
    dropped.delete("upgrade");
  }
  const connection = headers.connection;
  if (typeof connection === "string" && options.keepUpgrade !== true) {
    for (const name2 of connection.split(",")) dropped.add(name2.trim().toLowerCase());
  }
  const out = {};
  for (const [name2, value] of Object.entries(headers)) {
    if (value === void 0) continue;
    const lower = name2.toLowerCase();
    if (dropped.has(lower) || RELAY_ONLY.has(lower)) continue;
    if (lower === "host" || lower === "origin" || lower === "referer") continue;
    out[lower] = value;
  }
  out.host = loopbackAuthority2;
  if (options.cookie !== void 0) out.cookie = options.cookie;
  if (headers.origin !== void 0) out.origin = `http://${loopbackAuthority2}`;
  if (headers.referer !== void 0) out.referer = `http://${loopbackAuthority2}/`;
  return out;
}
function downstreamHeaders(headers) {
  const out = {};
  for (const [name2, value] of Object.entries(headers)) {
    if (value === void 0) continue;
    if (HOP_BY_HOP.has(name2.toLowerCase())) continue;
    out[name2] = value;
  }
  return out;
}
function normalizeAddress(address) {
  if (address === void 0) return "";
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);
  return (mapped?.[1] ?? address).toLowerCase();
}

// src/proxy/http.ts
function loopbackAuthority(target) {
  return `${target.host}:${String(target.port)}`;
}
function forward(req, res, target) {
  return new Promise((resolve2) => {
    const upstream = httpRequest({
      host: target.host,
      port: target.port,
      method: req.method ?? "GET",
      path: req.url ?? "/",
      headers: upstreamHeaders(req.headers, loopbackAuthority(target), {
        cookie: target.session?.cookieFor(loopbackAuthority(target))
      }),
      // Each proxied request gets its own socket rather than sharing the
      // global agent's pool, so one stalled streaming response cannot hold a
      // slot another request is waiting for.
      agent: false
    });
    upstream.setTimeout(target.timeoutMs, () => {
      upstream.destroy(new Error("dsh-relay: upstream timed out"));
    });
    const fail = (status, message) => {
      if (!res.headersSent) {
        res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
        res.end(message);
      } else {
        res.destroy();
      }
      resolve2();
    };
    upstream.on("error", () => {
      fail(502, "upstream unavailable");
    });
    upstream.on("response", (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, downstreamHeaders(upstreamRes.headers));
      upstreamRes.pipe(res);
      upstreamRes.on("error", () => {
        res.destroy();
      });
      res.on("close", () => {
        upstreamRes.destroy();
      });
      upstreamRes.on("end", () => {
        resolve2();
      });
    });
    req.on("error", () => {
      upstream.destroy();
    });
    req.pipe(upstream);
  });
}

// src/proxy/ws.ts
import { request as httpRequest2 } from "node:http";
var SocketLedger = class {
  #sockets = /* @__PURE__ */ new Set();
  /**
   * Register a socket and forget it again when it closes.
   * @param socket - the upgraded socket.
   */
  track(socket) {
    this.#sockets.add(socket);
    socket.once("close", () => {
      this.#sockets.delete(socket);
    });
  }
  /** Destroy every tracked socket. */
  destroyAll() {
    for (const socket of this.#sockets) socket.destroy();
    this.#sockets.clear();
  }
  /** How many sockets are live. */
  get size() {
    return this.#sockets.size;
  }
};
function rejectUpgrade(socket, status, reason) {
  socket.end(`HTTP/1.1 ${String(status)} ${reason}\r
Connection: close\r
\r
`);
}
function tune(socket) {
  const tunable = socket;
  tunable.setNoDelay?.(true);
  tunable.setTimeout?.(0);
  tunable.setKeepAlive?.(true, 3e4);
}
function forwardUpgrade(req, socket, head, target, ledger) {
  const upstream = httpRequest2({
    host: target.host,
    port: target.port,
    method: req.method ?? "GET",
    path: req.url ?? "/",
    // The upgrade needs the session as much as a POST does: 0.1.2 authenticates
    // `/api/remote.mux` before the handshake, and a refusal there surfaces to a
    // client as a stream that would not open rather than as a 401 it can read.
    headers: upstreamHeaders(req.headers, loopbackAuthority(target), {
      keepUpgrade: true,
      cookie: target.session?.cookieFor(loopbackAuthority(target))
    }),
    agent: false
  });
  const abandon = () => {
    upstream.destroy();
    if (!socket.destroyed) socket.destroy();
  };
  socket.on("error", abandon);
  upstream.on("error", () => {
    if (!socket.destroyed) rejectUpgrade(socket, 502, "Bad Gateway");
    upstream.destroy();
  });
  upstream.on("response", (response) => {
    const status = response.statusCode ?? 502;
    rejectUpgrade(socket, status, response.statusMessage ?? "Upgrade Failed");
    response.destroy();
  });
  upstream.on("upgrade", (response, upstreamSocket, upstreamHead) => {
    const lines = [`HTTP/1.1 ${String(response.statusCode ?? 101)} ${response.statusMessage ?? "Switching Protocols"}`];
    for (const [name2, value] of Object.entries(response.headers)) {
      if (value === void 0) continue;
      for (const single of Array.isArray(value) ? value : [value]) lines.push(`${name2}: ${single}`);
    }
    socket.write(`${lines.join("\r\n")}\r
\r
`);
    tune(socket);
    tune(upstreamSocket);
    ledger.track(socket);
    ledger.track(upstreamSocket);
    upstreamSocket.on("error", abandon);
    socket.removeListener("error", abandon);
    socket.on("error", () => {
      upstreamSocket.destroy();
    });
    upstreamSocket.on("close", () => {
      socket.destroy();
    });
    socket.on("close", () => {
      upstreamSocket.destroy();
    });
    if (upstreamHead.length > 0) socket.write(upstreamHead);
    if (head.length > 0) upstreamSocket.write(head);
    upstreamSocket.pipe(socket);
    socket.pipe(upstreamSocket);
  });
  upstream.end();
}

// src/server.ts
var PRIMARY_POLICY = (secure) => ({
  secure,
  accepts: /* @__PURE__ */ new Set(["loopback", "session", "device", "address-grant"]),
  servesRelayRoutes: true
});
var COMPAT_POLICY = {
  secure: false,
  accepts: /* @__PURE__ */ new Set(["loopback", "device", "address-grant"]),
  servesRelayRoutes: false
};
var WRITE_PREFIXES = ["/api/", "/api?"];
var WRITE_PATHS = /* @__PURE__ */ new Set(["/api"]);
function writeAllowed(pathname, extra) {
  if (WRITE_PATHS.has(pathname)) return true;
  if (WRITE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return extra.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
function wantsDocument(req) {
  const accept = req.headers.accept ?? "";
  return accept.includes("text/html");
}
function originOf(req, secure) {
  const host = typeof req.headers.host === "string" ? req.headers.host : "localhost";
  return `${secure ? "https" : "http"}://${host}`;
}
function plainOriginOf(req, plainPort) {
  if (plainPort === void 0) return void 0;
  const host = typeof req.headers.host === "string" ? req.headers.host : "localhost";
  const hostname2 = host.replace(/:\d+$/, "");
  return `http://${hostname2}:${String(plainPort)}`;
}
async function serve(req, res, runtime, policy, authorities) {
  const now = Date.now();
  const address = normalizeAddress(req.socket.remoteAddress);
  const local = isLoopbackHostname(address === "" ? "x" : address);
  if ((!local || isForwarded(req.headers)) && runtime.auth.exceedsRate(address, now)) {
    res.writeHead(429, { "content-type": "text/plain; charset=utf-8", "retry-after": "60" });
    res.end("too many requests");
    return;
  }
  const rejection = checkFence(
    { headers: req.headers, method: req.method, directLoopbackPeer: local && !isForwarded(req.headers) },
    authorities
  );
  if (rejection !== void 0) {
    const named = rejection === "untrusted-host" ? `${rejection} (Host: ${String(req.headers.host ?? "")}; add it to publicHostnames)` : rejection;
    runtime.log(`refused ${req.method ?? "GET"} ${req.url ?? "/"} from ${address}: ${named}`);
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("forbidden");
    return;
  }
  let url;
  try {
    url = new URL(req.url ?? "/", "http://relay.invalid");
  } catch {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("bad request");
    return;
  }
  const identity = classify(runtime.auth, req, address, local, policy, now);
  if (url.pathname === RELAY_PREFIX || url.pathname.startsWith(`${RELAY_PREFIX}/`)) {
    if (!policy.servesRelayRoutes && url.pathname !== "/relay/health") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    await handleRelayRoute(req, res, url, {
      auth: runtime.auth,
      config: runtime.config,
      identity,
      address,
      origin: originOf(req, policy.secure),
      plainOrigin: plainOriginOf(req, runtime.plainPort),
      fingerprint: runtime.fingerprint,
      secure: policy.secure,
      now
    });
    return;
  }
  const method = req.method ?? "GET";
  const isRead = method === "GET" || method === "HEAD" || method === "OPTIONS";
  if (!isRead && !writeAllowed(url.pathname, runtime.config.extraProxyPaths)) {
    runtime.log(`refused ${method} ${url.pathname}: not a proxied write path`);
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
    return;
  }
  if (!isAuthenticated(identity)) {
    if (wantsDocument(req) && policy.servesRelayRoutes) {
      sendRedirect(res, `/relay/login?next=${encodeURIComponent(url.pathname + url.search)}`);
      return;
    }
    if ((req.headers.accept ?? "").includes("application/json") || url.pathname.startsWith("/api")) {
      sendJson(res, 403, { error: "forbidden", message: "pair this device with the relay first" });
      return;
    }
    sendHtml(res, 403, messagePage({
      title: "Not signed in",
      message: "Pair this device with the relay, or sign in, before reaching the harness.",
      kind: "error"
    }));
    return;
  }
  if (isPinnedMethod(url.pathname, identity.privileged)) {
    runtime.log(`refused ${url.pathname} for ${identity.credential}: privileged method`);
    sendJson(res, 403, {
      error: "forbidden",
      message: "this method is served only to the machine running the harness"
    });
    return;
  }
  if (identity.deviceId !== void 0) {
    void runtime.auth.touch(identity.deviceId, address, now);
  }
  await forward(req, res, runtime.target);
}
function classify(auth, req, address, local, policy, now) {
  const identity = auth.identify({ headers: req.headers, address, local }, now);
  if (!policy.accepts.has(identity.credential)) return { credential: "none", privileged: false };
  return identity;
}
function serveUpgrade(req, socket, head, runtime, policy, authorities, ledger) {
  const now = Date.now();
  const address = normalizeAddress(req.socket.remoteAddress);
  const local = isLoopbackHostname(address === "" ? "x" : address);
  if (checkFence(
    { headers: req.headers, method: req.method, directLoopbackPeer: local && !isForwarded(req.headers) },
    authorities
  ) !== void 0) {
    rejectUpgrade(socket, 403, "Forbidden");
    return;
  }
  const identity = classify(runtime.auth, req, address, local, policy, now);
  if (!isAuthenticated(identity)) {
    rejectUpgrade(socket, 403, "Forbidden");
    return;
  }
  if (identity.deviceId !== void 0) {
    void runtime.auth.touch(identity.deviceId, address, now);
  }
  forwardUpgrade(req, socket, head, runtime.target, ledger);
}
async function startListener(options) {
  const policy = options.compat === true ? COMPAT_POLICY : PRIMARY_POLICY(options.tls !== void 0);
  const ledger = new SocketLedger();
  const handler = (req, res) => {
    void serve(req, res, options.runtime, policy, options.authorities).catch((error) => {
      options.runtime.log(`request failed: ${String(error)}`);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
        res.end("internal error");
      } else {
        res.destroy();
      }
    });
  };
  const server = options.tls === void 0 ? createHttpServer(handler) : createHttpsServer({ cert: options.tls.cert, key: options.tls.key, minVersion: "TLSv1.2" }, handler);
  server.on("upgrade", (req, socket, head) => {
    serveUpgrade(req, socket, head, options.runtime, policy, options.authorities, ledger);
  });
  server.setTimeout(12e4);
  await new Promise((resolve2, reject) => {
    server.once("error", reject);
    server.listen(options.port, options.bind, () => {
      server.removeListener("error", reject);
      resolve2();
    });
  });
  const bound = server.address();
  const port = typeof bound === "object" && bound !== null ? bound.port : options.port;
  return {
    port,
    close: async () => {
      ledger.destroyAll();
      server.closeAllConnections();
      await new Promise((resolve2) => {
        server.close(() => {
          resolve2();
        });
      });
    }
  };
}

// src/state.ts
import { randomBytes as randomBytes4 } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join as join2 } from "node:path";
var STATE_VERSION = 1;
var STATE_FILE = "state.json";
var SECRET_MODE = 384;
function emptyState() {
  return {
    version: STATE_VERSION,
    signingKey: randomBytes4(32).toString("base64url"),
    devices: {},
    grants: {}
  };
}
var RelayStore = class _RelayStore {
  constructor(file, state) {
    this.file = file;
    this.#state = state;
  }
  file;
  #state;
  #chain = Promise.resolve();
  #closed = false;
  /**
   * Load the state file, creating it when absent.
   * @param dir - the relay state directory; created with owner-only permissions.
   * @returns the open store.
   * @throws {Error} when the file exists but is unparsable or carries another format version — a
   * corrupt credential store must fail loud rather than silently reset to "no password set".
   */
  static async open(dir) {
    await mkdir(dir, { recursive: true, mode: 448 });
    const file = join2(dir, STATE_FILE);
    let state;
    try {
      const raw = await readFile(file, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.version !== STATE_VERSION) {
        throw new Error(`dsh-relay: ${file} has format version ${String(parsed.version)}, expected ${String(STATE_VERSION)}`);
      }
      state = { ...parsed, devices: parsed.devices ?? {}, grants: parsed.grants ?? {} };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      state = emptyState();
      await writeFile(file, `${JSON.stringify(state, null, 2)}
`, { mode: SECRET_MODE });
    }
    return new _RelayStore(file, state);
  }
  /**
   * Current state, synchronously from memory.
   * @returns the live state object; treat it as read-only and mutate through {@link update}.
   */
  get state() {
    return this.#state;
  }
  /**
   * Apply one mutation and persist the result.
   * @param mutate - synchronous transform over a draft copy of the state.
   * @returns resolution after the new state is on disk.
   */
  async update(mutate) {
    const task = this.#chain.then(async () => {
      if (this.#closed) throw new Error("dsh-relay: state store is closed");
      const draft = structuredClone(this.#state);
      mutate(draft);
      const temp = `${this.file}.${randomBytes4(6).toString("hex")}.tmp`;
      await writeFile(temp, `${JSON.stringify(draft, null, 2)}
`, { mode: SECRET_MODE });
      await rename(temp, this.file);
      this.#state = draft;
    });
    this.#chain = task.then(() => void 0, () => void 0);
    return task;
  }
  /**
   * Drain queued writes and refuse further ones.
   * @returns resolution after the last queued write has landed.
   */
  async close() {
    const drained = this.#chain;
    this.#closed = true;
    await drained;
  }
};

// src/tls.ts
import { X509Certificate, createHash as createHash2 } from "node:crypto";
import { chmod, mkdir as mkdir2, readFile as readFile2, writeFile as writeFile2 } from "node:fs/promises";
import { join as join3 } from "node:path";
var SECRET_MODE2 = 384;
var CERT_FILE = "relay-cert.pem";
var KEY_FILE = "relay-key.pem";
var VALIDITY_DAYS = 825;
var SAN_DNS = 2;
var SAN_IP = 7;
function spkiFingerprint(certPem) {
  const spki = new X509Certificate(certPem).publicKey.export({ type: "spki", format: "der" });
  return createHash2("sha256").update(spki).digest("base64");
}
function certificateSans(publicHostnames) {
  return [.../* @__PURE__ */ new Set(["localhost", "127.0.0.1", ...localAddresses(), ...publicHostnames])];
}
async function generate(dir, sans) {
  const { default: selfsigned } = await import("selfsigned");
  const notBefore = /* @__PURE__ */ new Date();
  const notAfter = new Date(notBefore.getTime() + VALIDITY_DAYS * 864e5);
  const pems = await selfsigned.generate([{ name: "commonName", value: "dsh-relay" }], {
    keyType: "ec",
    curve: "P-256",
    algorithm: "sha256",
    notBeforeDate: notBefore,
    notAfterDate: notAfter,
    extensions: [
      { name: "basicConstraints", cA: false, critical: true },
      { name: "keyUsage", digitalSignature: true, keyEncipherment: true, critical: true },
      { name: "extKeyUsage", serverAuth: true },
      {
        name: "subjectAltName",
        altNames: sans.map((value) => /^\d{1,3}(\.\d{1,3}){3}$/.test(value) ? { type: SAN_IP, ip: value } : { type: SAN_DNS, value })
      }
    ]
  });
  await mkdir2(dir, { recursive: true, mode: 448 });
  await writeFile2(join3(dir, CERT_FILE), pems.cert, { mode: SECRET_MODE2 });
  await writeFile2(join3(dir, KEY_FILE), pems.private, { mode: SECRET_MODE2 });
  return {
    cert: pems.cert,
    key: pems.private,
    record: {
      fingerprint: spkiFingerprint(pems.cert),
      sans: [...sans],
      generatedAt: notBefore.getTime(),
      expiresAt: notAfter.getTime()
    }
  };
}
async function loadCertificate(options) {
  if (options.mode === "off") return void 0;
  if (options.mode === "files") {
    const [cert, key] = await Promise.all([
      readFile2(options.certPath, "utf8"),
      readFile2(options.keyPath, "utf8")
    ]);
    const parsed = new X509Certificate(cert);
    return {
      cert,
      key,
      record: {
        fingerprint: spkiFingerprint(cert),
        sans: [...options.sans],
        generatedAt: Date.parse(parsed.validFrom),
        expiresAt: Date.parse(parsed.validTo)
      }
    };
  }
  const wanted = [...options.sans].toSorted().join(",");
  const covered = options.existing !== void 0 && [...options.existing.sans].toSorted().join(",") === wanted;
  if (options.existing !== void 0 && covered && Date.now() < options.existing.expiresAt) {
    try {
      const [cert, key] = await Promise.all([
        readFile2(join3(options.dir, CERT_FILE), "utf8"),
        readFile2(join3(options.dir, KEY_FILE), "utf8")
      ]);
      await chmod(join3(options.dir, KEY_FILE), SECRET_MODE2).catch(() => void 0);
      return { cert, key, record: options.existing };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return generate(options.dir, options.sans);
}

// src/index.ts
var name = "relay";
var inject = ["webServer"];
function loggerFor(ctx) {
  const logger = ctx.get("logger");
  return {
    info: (message) => void (logger?.info?.(`[dsh-relay] ${message}`) ?? console.log(`[dsh-relay] ${message}`)),
    warn: (message) => void (logger?.warn?.(`[dsh-relay] ${message}`) ?? console.warn(`[dsh-relay] ${message}`))
  };
}
function apply(ctx, config) {
  assertCoherent(config);
  for (const entry of [...config.trustedHosts, ...config.publicHostnames]) assertTrustedAuthority(entry);
  const log = loggerFor(ctx);
  if (ctx.webServer.host === "0.0.0.0") {
    log.warn(
      "dsh-relay: the harness web server is bound to 0.0.0.0. The relay will proxy connections, but consider binding the web server to 127.0.0.1 for maximum isolation."
    );
  }
  ctx.effect(() => {
    const supervisor = new Supervisor(ctx, log);
    let source = () => config;
    installSettingsSection(ctx, Config, config, {
      setSource: (current) => {
        source = current;
      },
      onChange: () => {
        supervisor.apply(source());
      }
    });
    supervisor.apply(source());
    return async () => {
      await supervisor.stop();
    };
  }, "dsh-relay: listeners");
}
var Supervisor = class {
  /**
   * @param ctx - the plugin context passed through to each launch.
   * @param log - the relay's logging.
   */
  constructor(ctx, log) {
    this.ctx = ctx;
    this.log = log;
  }
  ctx;
  log;
  #generation = 0;
  #chain = Promise.resolve();
  #running;
  #applied;
  /**
   * Run the relay under a new configuration, replacing any current one.
   *
   * An unusable configuration leaves the running relay alone rather than
   * taking it down: a typo in a settings form should not cost the operator
   * their remote access until they can reach the machine to fix it.
   * @param config - the newly resolved configuration.
   */
  apply(config) {
    try {
      assertCoherent(config);
    } catch (error) {
      this.log.warn(`ignoring an unusable configuration, keeping the running one: ${String(error)}`);
      return;
    }
    const fingerprint = JSON.stringify(config);
    if (fingerprint === this.#applied) return;
    this.#applied = fingerprint;
    const mine = ++this.#generation;
    this.#chain = this.#chain.then(async () => {
      if (mine !== this.#generation) return;
      await this.#running?.stop();
      this.#running = void 0;
      if (mine !== this.#generation) return;
      try {
        this.#running = await start(this.ctx, config, this.log);
      } catch (error) {
        this.log.warn(`failed to start: ${String(error)}`);
      }
    }, () => void 0);
  }
  /**
   * Stop for good.
   * @returns resolution once the last transition has settled and the listeners are closed.
   */
  async stop() {
    this.#generation += 1;
    await this.#chain;
    await this.#running?.stop();
    this.#running = void 0;
  }
};
async function start(ctx, config, log) {
  const dir = relayStateDir(ctx, config.stateDir);
  const store = await RelayStore.open(dir);
  const auth = new Authenticator(store, config);
  const sans = certificateSans(config.publicHostnames);
  const material = await loadCertificate({
    mode: config.tls,
    dir,
    certPath: config.tlsCertPath,
    keyPath: config.tlsKeyPath,
    sans,
    existing: store.state.certificate
  });
  if (material !== void 0 && material.record.fingerprint !== store.state.certificate?.fingerprint) {
    await store.update((draft) => {
      draft.certificate = material.record;
    });
  }
  const session = await HarnessSession.load(ctx);
  if (session === void 0) {
    log.info(
      "no harness browser-session secret found; forwarding unauthenticated. That is correct for a harness before 0.1.2. On 0.1.2 or later every proxied request will be answered 401 \u2014 start `dsh web` once so it creates the secret, then reload this plugin."
    );
  }
  const runtime = {
    auth,
    config,
    target: {
      host: "127.0.0.1",
      port: ctx.webServer.port,
      timeoutMs: config.proxyTimeoutMs,
      session
    },
    fingerprint: material?.record.fingerprint,
    log: (message) => {
      log.warn(message);
    }
  };
  const authorities = relayAuthorities(config);
  const primary = await startListener({ runtime, bind: config.bind, port: config.port, tls: material, authorities });
  const compat = config.compat.plainPort === 0 ? void 0 : await startListener({
    runtime,
    bind: config.bind,
    port: config.compat.plainPort,
    compat: true,
    authorities
  });
  if (compat !== void 0) runtime.plainPort = compat.port;
  const scheme = material === void 0 ? "http" : "https";
  const unroute = ctx.webServer.register({
    kind: "prefix",
    path: RELAY_PREFIX,
    handler: (req, res) => {
      const host = typeof req.headers.host === "string" ? req.headers.host : "127.0.0.1";
      const hostname2 = host.replace(/:\d+$/, "");
      const target = `${scheme}://${hostname2}:${String(primary.port)}${req.url ?? RELAY_PREFIX}`;
      res.writeHead(302, { location: target, "cache-control": "no-store" });
      res.end();
    }
  });
  const untap = config.uiLink ? ctx.webServer.tapIndex(injectRelayLink) : () => void 0;
  const untapShim = ctx.webServer.tapIndex(injectSecureContextShim);
  const reachable = ["127.0.0.1", ...localAddresses()].map((address) => `${scheme}://${address}:${String(primary.port)}`).join(" ");
  log.info(`listening on ${reachable} (harness on 127.0.0.1:${String(ctx.webServer.port)})`);
  if (material === void 0) {
    log.warn("serving plaintext: anything on the network path can read this traffic and the credentials on it");
  }
  if (compat !== void 0) {
    log.warn(`plain compatibility listener on port ${String(compat.port)}: DSH Mobile 0.5.0 only, no configuration access`);
  }
  if (!auth.hasPassword) {
    log.info(`no password set yet \u2014 open ${scheme}://127.0.0.1:${String(primary.port)}/relay/password on this machine to set one`);
  }
  const unadvertise = config.mdns ? await advertise({
    port: primary.port,
    plainPort: compat?.port,
    tls: config.tls,
    fingerprint: material?.record.fingerprint,
    name: config.mdnsName
  }, (message) => {
    log.warn(message);
  }) : async () => void 0;
  return {
    // One disposer, in reverse order of construction: cordis runs multiple
    // async disposers concurrently with no completion ordering, so anything
    // order-dependent belongs inside a single one.
    stop: async () => {
      untapShim();
      untap();
      unroute();
      await unadvertise();
      await compat?.close();
      await primary.close();
      auth.dispose();
      await store.close();
    }
  };
}
export {
  Config,
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
