// src/stores/redis.ts
function redisStore(client, opts = {}) {
  const prefix = opts.keyPrefix ?? "ag:";
  const hitKey = (key) => `${prefix}hit:${key}`;
  const setKey = (key) => `${prefix}set:${key}`;
  const kvKey = (key) => `${prefix}kv:${key}`;
  const toCount = (value, fallback) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return {
    async hit(key, windowMs, now) {
      const k = hitKey(key);
      const member = `${now}-${Math.random().toString(36).slice(2)}`;
      await client.zremrangebyscore(k, 0, now - windowMs);
      await client.zadd(k, now, member);
      const count = await client.zcard(k);
      await client.pexpire(k, windowMs);
      return toCount(count, 1);
    },
    async addToSet(key, member, ttlMs, _now) {
      const k = setKey(key);
      await client.sadd(k, member);
      await client.pexpire(k, ttlMs);
      const size = await client.scard(k);
      return toCount(size, 1);
    },
    async get(key) {
      const raw = await client.get(kvKey(key));
      if (raw === null || raw === void 0) return void 0;
      try {
        return JSON.parse(raw);
      } catch {
        return void 0;
      }
    },
    async set(key, value, ttlMs) {
      const k = kvKey(key);
      const s = JSON.stringify(value);
      if (ttlMs !== void 0) {
        await client.set(k, s, "PX", ttlMs);
      } else {
        await client.set(k, s);
      }
    }
  };
}

export { redisStore };
//# sourceMappingURL=chunk-7HKQAMHX.js.map
//# sourceMappingURL=chunk-7HKQAMHX.js.map