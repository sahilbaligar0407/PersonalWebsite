export { redisStore } from './chunk-7HKQAMHX.js';
export { SEED_DATACENTER_CIDRS, cidrContains, ipv4ToInt, parseCidr, reputationProvider } from './chunk-YVLEUWEW.js';

// src/core/types.ts
var ACTION_SEVERITY = {
  allow: 0,
  challenge: 1,
  throttle: 2,
  review: 3,
  block: 4
};
function maxAction(a, b) {
  return ACTION_SEVERITY[a] >= ACTION_SEVERITY[b] ? a : b;
}

// src/stores/memory.ts
var MemoryStore = class {
  constructor(opts = {}) {
    this.hits = /* @__PURE__ */ new Map();
    this.sets = /* @__PURE__ */ new Map();
    this.kv = /* @__PURE__ */ new Map();
    this.maxKeys = opts.maxKeys ?? 1e5;
  }
  hit(key, windowMs, now) {
    const cutoff = now - windowMs;
    let arr = this.hits.get(key);
    if (!arr) {
      arr = [];
      this.hits.set(key, arr);
    }
    let i = 0;
    while (i < arr.length && arr[i] <= cutoff) i++;
    if (i > 0) arr.splice(0, i);
    arr.push(now);
    this.evictIfNeeded(this.hits);
    return arr.length;
  }
  addToSet(key, member, ttlMs, now) {
    let entry = this.sets.get(key);
    if (!entry || entry.expiresAt <= now) {
      entry = { members: /* @__PURE__ */ new Map(), expiresAt: now + ttlMs };
      this.sets.set(key, entry);
    }
    entry.members.set(member, now + ttlMs);
    entry.expiresAt = Math.max(entry.expiresAt, now + ttlMs);
    for (const [m, exp] of entry.members) {
      if (exp <= now) entry.members.delete(m);
    }
    this.evictIfNeeded(this.sets);
    return entry.members.size;
  }
  get(key) {
    const entry = this.kv.get(key);
    if (!entry) return void 0;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.kv.delete(key);
      return void 0;
    }
    return entry.value;
  }
  set(key, value, ttlMs) {
    this.kv.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : 0 });
    this.evictIfNeeded(this.kv);
  }
  /** Clear all state (useful in tests). */
  reset() {
    this.hits.clear();
    this.sets.clear();
    this.kv.clear();
  }
  evictIfNeeded(map) {
    if (map.size <= this.maxKeys) return;
    const overflow = map.size - this.maxKeys;
    let n = 0;
    for (const k of map.keys()) {
      map.delete(k);
      if (++n >= overflow) break;
    }
  }
};

// src/core/engine.ts
var DEFAULT_POLICY = {
  challenge: 40,
  throttle: 60,
  review: 75,
  block: 90
};
var AbuseGuard = class {
  constructor(opts) {
    /** Effective weight for a signal: policy override → signal default → 1. */
    this.weightFor = (name) => {
      const override = this.policy.weights?.[name];
      if (override !== void 0) return override;
      const sig = this.signals.find((s) => s.name === name);
      return sig?.weight ?? 1;
    };
    this.signals = opts.signals ?? [];
    this.policy = { ...DEFAULT_POLICY, ...opts.policy };
    this.combine = opts.combine ?? "noisy-or";
    this.mode = opts.mode ?? "enforce";
    this.adjustScore = opts.adjustScore;
    this.store = opts.store ?? new MemoryStore();
    this.onDecision = opts.onDecision;
  }
  /** The engine mode ("enforce" | "shadow"). */
  getMode() {
    return this.mode;
  }
  /** Expose the backing store so adapters/signals can share it. */
  getStore() {
    return this.store;
  }
  /**
   * Evaluate a context and return a {@link Decision}. Signals run concurrently; a signal
   * that throws or rejects is logged into the result as an error reason and treated as
   * abstaining (score 0), so one bad signal can never fail the whole request.
   */
  async evaluate(input) {
    const ctx = { ...input, timestamp: input.timestamp ?? Date.now() };
    const settled = await Promise.all(
      this.signals.map(async (sig) => {
        try {
          return await sig.evaluate(ctx, this.store);
        } catch (err) {
          return {
            signal: sig.name,
            score: 0,
            reasons: [`signal error: ${err.message}`]
          };
        }
      })
    );
    const results = settled.filter((r) => r !== null);
    let overrideAction = "allow";
    const reasons = /* @__PURE__ */ new Set();
    for (const r of results) {
      for (const reason of r.reasons) reasons.add(`[${r.signal}] ${reason}`);
      if (r.action) overrideAction = maxAction(overrideAction, r.action);
    }
    let score = this.combineScores(results);
    if (this.adjustScore) {
      try {
        score = clamp(Math.round(await this.adjustScore(score, ctx, results)), 0, 100);
      } catch {
      }
    }
    const scoredAction = this.actionForScore(score);
    const action = maxAction(scoredAction, overrideAction);
    const decision = {
      action,
      score,
      flagged: action !== "allow",
      enforced: this.mode !== "shadow",
      signals: results,
      reasons: [...reasons],
      context: ctx
    };
    if (this.onDecision) {
      try {
        await this.onDecision(decision);
      } catch {
      }
    }
    return decision;
  }
  /** Combine the contributing signal scores into a single 0–100 risk score. */
  combineScores(results) {
    if (results.length === 0) return 0;
    const strategy = this.combine;
    if (typeof strategy === "function") {
      return clamp(Math.round(strategy(results, this.weightFor)), 0, 100);
    }
    if (strategy === "max") {
      let m = 0;
      for (const r of results) m = Math.max(m, clamp(r.score, 0, 100));
      return Math.round(m);
    }
    if (strategy === "sum") {
      let s = 0;
      for (const r of results) s += clamp(r.score, 0, 100) * this.weightFor(r.signal);
      return clamp(Math.round(s), 0, 100);
    }
    if (strategy === "average") {
      let num = 0;
      let den = 0;
      for (const r of results) {
        const w = this.weightFor(r.signal);
        num += clamp(r.score, 0, 100) * w;
        den += w;
      }
      return den > 0 ? clamp(Math.round(num / den), 0, 100) : 0;
    }
    let product = 1;
    for (const r of results) {
      const p = clamp(r.score, 0, 100) / 100;
      const w = this.weightFor(r.signal);
      product *= Math.pow(1 - p, w);
    }
    return clamp(Math.round((1 - product) * 100), 0, 100);
  }
  actionForScore(score) {
    const p = this.policy;
    if (p.block !== void 0 && score >= p.block) return "block";
    if (p.review !== void 0 && score >= p.review) return "review";
    if (p.throttle !== void 0 && score >= p.throttle) return "throttle";
    if (p.challenge !== void 0 && score >= p.challenge) return "challenge";
    return "allow";
  }
};
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// src/core/presets.ts
var PRESETS = {
  strict: {
    policy: { challenge: 25, throttle: 45, review: 60, block: 80 },
    combine: "noisy-or"
  },
  balanced: {
    policy: { challenge: 40, throttle: 60, review: 75, block: 90 },
    combine: "noisy-or"
  },
  permissive: {
    policy: { challenge: 55, throttle: 75, review: 88, block: 96 },
    combine: "noisy-or"
  }
};
function preset(name, overrides = {}) {
  const base = PRESETS[name];
  const merged = { ...base, ...overrides };
  if (overrides.policy || base.policy) {
    merged.policy = { ...base.policy, ...overrides.policy };
  }
  return merged;
}

// src/trust.ts
var DAY_MS = 24 * 60 * 60 * 1e3;
function createTrustTracker(opts) {
  const store = opts.store;
  const keyOf = opts.keyOf ?? ((c) => c.actorId ?? c.ip ?? c.email);
  const baseline = opts.baseline ?? 50;
  const min = opts.min ?? 0;
  const max = opts.max ?? 100;
  const reward = opts.reward ?? 3;
  const penalty = opts.penalty ?? 20;
  const halfLifeMs = opts.halfLifeMs ?? 30 * DAY_MS;
  const maxReduction = opts.maxReduction ?? 0.5;
  const maxPenalty = opts.maxPenalty ?? 0;
  const prefix = opts.keyPrefix ?? "trust";
  const ttlMs = opts.ttlMs ?? 90 * DAY_MS;
  const keyFor = (id) => `${prefix}:${id}`;
  const clampValue = (v) => Math.max(min, Math.min(max, v));
  function decayed(rec, now) {
    if (!rec) return baseline;
    const elapsed = now - rec.updatedAt;
    if (!(elapsed > 0)) return clampValue(rec.value);
    const factor = Math.pow(0.5, elapsed / halfLifeMs);
    return clampValue(baseline + (rec.value - baseline) * factor);
  }
  async function readRecord(id) {
    const raw = await store.get(keyFor(id));
    if (!raw || typeof raw.value !== "number" || typeof raw.updatedAt !== "number" || Number.isNaN(raw.value) || Number.isNaN(raw.updatedAt)) {
      return void 0;
    }
    return raw;
  }
  const getTrust = async (actorId, now) => {
    const rec = await readRecord(actorId);
    return decayed(rec, now ?? rec?.updatedAt ?? Date.now());
  };
  const setTrust = async (actorId, value, now) => {
    const at = now ?? Date.now();
    await store.set(keyFor(actorId), { value: clampValue(value), updatedAt: at }, ttlMs);
  };
  const record = async (decision) => {
    try {
      const id = keyOf(decision.context);
      if (!id) return;
      const now = decision.context.timestamp ?? Date.now();
      const rec = await readRecord(id);
      const current = decayed(rec, now);
      const delta = decision.action === "allow" ? reward : -penalty;
      await store.set(keyFor(id), { value: clampValue(current + delta), updatedAt: now }, ttlMs);
    } catch {
    }
  };
  const adjust = async (score, ctx) => {
    try {
      const id = keyOf(ctx);
      if (!id) return score;
      const now = ctx.timestamp ?? Date.now();
      const trust = await getTrust(id, now);
      if (trust > baseline) {
        const span = max - baseline;
        const factor = span > 0 ? (trust - baseline) / span * maxReduction : 0;
        return clamp01to100(score * (1 - factor));
      }
      if (trust < baseline && maxPenalty > 0) {
        const span = baseline - min;
        const add = span > 0 ? (baseline - trust) / span * maxPenalty : 0;
        return clamp01to100(score + add);
      }
      return score;
    } catch {
      return score;
    }
  };
  return { adjust, record, getTrust, setTrust };
}
function clamp01to100(n) {
  return Math.max(0, Math.min(100, n));
}

// src/signals/velocity.ts
function velocity(opts = {}) {
  const windowMs = opts.windowMs ?? 6e4;
  const max = opts.max ?? 60;
  const softStart = opts.softStart ?? 0.5;
  const overLimitScore = opts.overLimitScore ?? 70;
  const prefix = opts.keyPrefix ?? "vel";
  const keyOf = opts.keyOf ?? ((c) => c.actorId ?? c.ip);
  return {
    name: "velocity",
    async evaluate(ctx, store) {
      const id = keyOf(ctx);
      if (!id) return null;
      const key = `${prefix}:${ctx.action}:${id}`;
      const count = await store.hit(key, windowMs, ctx.timestamp);
      const ratio = count / max;
      let score = 0;
      if (ratio > softStart) {
        score = Math.round((ratio - softStart) / (1 - softStart) * overLimitScore);
      }
      score = Math.max(0, Math.min(overLimitScore, score));
      const result = {
        signal: "velocity",
        score,
        reasons: [],
        data: { count, max, windowMs }
      };
      if (count > max) {
        result.score = overLimitScore;
        result.action = "throttle";
        result.reasons.push(`rate limit exceeded: ${count}/${max} per ${windowMs}ms`);
      } else if (score > 0) {
        result.reasons.push(`elevated velocity: ${count}/${max} per ${windowMs}ms`);
      }
      return result;
    }
  };
}

// src/signals/device-cluster.ts
function deviceCluster(opts = {}) {
  const windowMs = opts.windowMs ?? 60 * 24 * 60 * 60 * 1e3;
  const fpWeight = opts.fingerprintWeight ?? 30;
  const ipWeight = opts.ipWeight ?? 12;
  const actions = opts.actions === void 0 ? ["signup"] : opts.actions;
  const prefix = opts.keyPrefix ?? "dev";
  return {
    name: "device-cluster",
    async evaluate(ctx, store) {
      if (actions && !actions.includes(ctx.action)) return null;
      const actor = ctx.actorId ?? ctx.email;
      if (!actor || !ctx.fingerprint && !ctx.ip) return null;
      let fpAccounts = 0;
      let ipAccounts = 0;
      const reasons = [];
      if (ctx.fingerprint) {
        const size = await store.addToSet(`${prefix}:fp:${ctx.fingerprint}`, actor, windowMs, ctx.timestamp);
        fpAccounts = Math.max(0, size - 1);
        if (fpAccounts > 0) reasons.push(`${fpAccounts} other account(s) share this device fingerprint`);
      }
      if (ctx.ip) {
        const size = await store.addToSet(`${prefix}:ip:${ctx.ip}`, actor, windowMs, ctx.timestamp);
        ipAccounts = Math.max(0, size - 1);
        if (ipAccounts > 0) reasons.push(`${ipAccounts} other account(s) share this IP`);
      }
      const score = Math.min(100, fpAccounts * fpWeight + ipAccounts * ipWeight);
      if (score === 0) return null;
      return {
        signal: "device-cluster",
        score,
        reasons,
        data: { fpAccounts, ipAccounts, windowMs }
      };
    }
  };
}

// src/signals/disposable-email.ts
var DEFAULT_DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "getnada.com",
  "trashmail.com",
  "fakeinbox.com",
  "sharklasers.com",
  "maildrop.cc",
  "dispostable.com",
  "mailnesia.com",
  "mohmal.com",
  "emailondeck.com",
  "tempmailo.com",
  "mintemail.com",
  "mailcatch.com",
  "spamgourmet.com"
];
function disposableEmail(opts = {}) {
  const base = opts.domains ?? [...DEFAULT_DISPOSABLE_DOMAINS];
  const set = new Set([...base, ...opts.extraDomains ?? []].map((d) => d.toLowerCase()));
  const disposableScore = opts.disposableScore ?? 85;
  const aliasScore = opts.aliasScore ?? 25;
  return {
    name: "disposable-email",
    weight: 1,
    evaluate(ctx) {
      const email = ctx.email?.trim().toLowerCase();
      if (!email || !email.includes("@")) return null;
      const [local, domain] = email.split("@");
      if (set.has(domain)) {
        return {
          signal: "disposable-email",
          score: disposableScore,
          reasons: [`disposable email domain: ${domain}`],
          data: { domain }
        };
      }
      const hasPlus = local.includes("+");
      const hasDots = domain === "gmail.com" && local.includes(".");
      if (hasPlus || hasDots) {
        const reasons = [];
        if (hasPlus) reasons.push("plus-alias in local part");
        if (hasDots) reasons.push("gmail dot-trick in local part");
        return {
          signal: "disposable-email",
          score: aliasScore,
          reasons,
          data: { domain, alias: true }
        };
      }
      return null;
    }
  };
}

// src/signals/ip-reputation.ts
var DEFAULT_BOT_UA = [
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /python-urllib/i,
  /go-http-client/i,
  /okhttp/i,
  /java\//i,
  /headlesschrome/i,
  /phantomjs/i,
  /scrapy/i,
  /bot\b/i,
  /spider/i,
  /crawler/i
];
function ipReputation(opts = {}) {
  const denylist = opts.denylist ?? [];
  const denyScore = opts.denylistScore ?? 90;
  const uaScore = opts.suspiciousUaScore ?? 45;
  const botUa = opts.botUaPatterns ?? DEFAULT_BOT_UA;
  return {
    name: "ip-reputation",
    async evaluate(ctx) {
      let score = 0;
      const reasons = [];
      const data = {};
      if (ctx.ip && denylist.some((d) => ctx.ip === d || ctx.ip.startsWith(d))) {
        score = Math.max(score, denyScore);
        reasons.push(`IP on denylist: ${ctx.ip}`);
        data.denylisted = true;
      }
      const ua = ctx.userAgent?.trim();
      if (!ua) {
        score = Math.max(score, uaScore);
        reasons.push("missing User-Agent");
        data.uaMissing = true;
      } else if (botUa.some((re) => re.test(ua))) {
        score = Math.max(score, uaScore);
        reasons.push(`automated User-Agent: ${ua.slice(0, 80)}`);
        data.uaAutomated = true;
      }
      if (opts.lookup && ctx.ip) {
        const v = await opts.lookup(ctx.ip, ctx);
        if (v) {
          if (typeof v.score === "number") score = Math.max(score, Math.min(100, v.score));
          if (v.reasons) reasons.push(...v.reasons);
          if (v.data) Object.assign(data, v.data);
        }
      }
      if (score === 0) return null;
      return { signal: "ip-reputation", score, reasons, data };
    }
  };
}

// src/signals/content.ts
var LINK_RE = /\bhttps?:\/\/|\bwww\./gi;
function content(opts = {}) {
  const deny = (opts.denyKeywords ?? []).map((k) => k.toLowerCase());
  const maxLinks = opts.maxLinks ?? 4;
  const minLen = opts.minLengthForHeuristics ?? 20;
  return {
    name: "content",
    async evaluate(ctx) {
      const text = ctx.content?.trim();
      if (!text) return null;
      let score = 0;
      const reasons = [];
      const data = {};
      const lower = text.toLowerCase();
      for (const kw of deny) {
        if (lower.includes(kw)) {
          score = Math.max(score, 90);
          reasons.push(`denied keyword: "${kw}"`);
        }
      }
      const links = (text.match(LINK_RE) ?? []).length;
      if (links >= maxLinks) {
        score = Math.max(score, Math.min(80, 30 + (links - maxLinks) * 15));
        reasons.push(`excessive links: ${links}`);
        data.links = links;
      }
      if (text.length >= minLen) {
        const letters = text.replace(/[^a-z]/gi, "");
        const caps = letters.replace(/[^A-Z]/g, "").length;
        if (letters.length > 0 && caps / letters.length > 0.7) {
          score = Math.max(score, 35);
          reasons.push("mostly uppercase (shouting)");
        }
        if (/(.)\1{9,}/.test(text)) {
          score = Math.max(score, 40);
          reasons.push("long character repetition");
        }
      }
      if (opts.moderate) {
        const v = await opts.moderate(text, ctx);
        if (v && (v.flagged || typeof v.score === "number")) {
          const s = typeof v.score === "number" ? v.score : v.flagged ? 90 : 0;
          score = Math.max(score, Math.min(100, s));
          if (v.flagged) reasons.push(`moderation flagged${v.categories?.length ? `: ${v.categories.join(", ")}` : ""}`);
          if (v.categories) data.categories = v.categories;
        }
      }
      if (score === 0) return null;
      return { signal: "content", score, reasons, data };
    }
  };
}

export { ACTION_SEVERITY, AbuseGuard, DEFAULT_DISPOSABLE_DOMAINS, MemoryStore, PRESETS, content, createTrustTracker, deviceCluster, disposableEmail, ipReputation, maxAction, preset, velocity };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map