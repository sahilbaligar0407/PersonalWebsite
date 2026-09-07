// src/providers/reputation.ts
var SEED_DATACENTER_CIDRS = [
  // --- AWS (sample) ---
  "3.5.140.0/22",
  // us-east / S3-ish sample block
  "13.32.0.0/15",
  // CloudFront sample block
  "52.94.0.0/22",
  // AWS sample block
  // --- Google Cloud (sample) ---
  "34.64.0.0/10",
  // GCE sample block
  "35.184.0.0/13",
  // GCE sample block
  // --- Microsoft Azure (sample) ---
  "20.33.0.0/16",
  // Azure sample block
  "40.74.0.0/15",
  // Azure sample block
  // --- DigitalOcean (sample) ---
  "104.131.0.0/16",
  // DO sample block
  "159.203.0.0/16",
  // DO sample block
  // --- OVH (sample) ---
  "51.68.0.0/16",
  // OVH sample block
  "141.94.0.0/16"
  // OVH sample block
];
var BOGON_CIDRS = [
  { cidr: "0.0.0.0/8", label: "this-network (RFC1122)" },
  { cidr: "10.0.0.0/8", label: "private (RFC1918)" },
  { cidr: "100.64.0.0/10", label: "CGNAT (RFC6598)" },
  { cidr: "127.0.0.0/8", label: "loopback" },
  { cidr: "169.254.0.0/16", label: "link-local (RFC3927)" },
  { cidr: "172.16.0.0/12", label: "private (RFC1918)" },
  { cidr: "192.0.0.0/24", label: "IETF protocol assignments (RFC6890)" },
  { cidr: "192.0.2.0/24", label: "TEST-NET-1 (RFC5737)" },
  { cidr: "192.168.0.0/16", label: "private (RFC1918)" },
  { cidr: "198.18.0.0/15", label: "benchmarking (RFC2544)" },
  { cidr: "198.51.100.0/24", label: "TEST-NET-2 (RFC5737)" },
  { cidr: "203.0.113.0/24", label: "TEST-NET-3 (RFC5737)" },
  { cidr: "224.0.0.0/4", label: "multicast (RFC5771)" },
  { cidr: "240.0.0.0/4", label: "reserved (RFC1112)" },
  { cidr: "255.255.255.255/32", label: "limited broadcast" }
];
var DEFAULT_PRIVATE_SCORE = 10;
var DEFAULT_DATACENTER_SCORE = 50;
var DEFAULT_TOR_SCORE = 70;
var DEFAULT_TOR_TTL_MS = 36e5;
var TOR_CACHE_KEY = "abuseguard:reputation:tor-exits";
function ipv4ToInt(ip) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let acc = 0;
  for (const part of parts) {
    if (part.length === 0 || part.length > 3) return null;
    if (!/^\d+$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    acc = acc << 8 | n;
  }
  return acc >>> 0;
}
function parseCidr(cidr) {
  const trimmed = cidr.trim();
  const slash = trimmed.indexOf("/");
  const addrPart = slash === -1 ? trimmed : trimmed.slice(0, slash);
  const prefixPart = slash === -1 ? "32" : trimmed.slice(slash + 1);
  const addr = ipv4ToInt(addrPart);
  if (addr === null) return null;
  if (!/^\d+$/.test(prefixPart)) return null;
  const prefix = Number(prefixPart);
  if (prefix < 0 || prefix > 32) return null;
  const mask = prefix === 0 ? 0 : 4294967295 << 32 - prefix >>> 0;
  const base = (addr & mask) >>> 0;
  return { base, mask, raw: trimmed };
}
function cidrContains(parsed, ipInt) {
  return (ipInt & parsed.mask) >>> 0 === parsed.base;
}
function compileCidrs(cidrs) {
  const out = [];
  for (const c of cidrs) {
    const p = parseCidr(c);
    if (p) out.push(p);
  }
  return out;
}
function firstMatch(parsedList, ipInt) {
  for (const p of parsedList) {
    if (cidrContains(p, ipInt)) return p;
  }
  return void 0;
}
function reputationProvider(opts = {}) {
  const privateScore = opts.privateIpScore ?? DEFAULT_PRIVATE_SCORE;
  const datacenterScore = opts.datacenterScore ?? DEFAULT_DATACENTER_SCORE;
  const torScore = opts.torScore ?? DEFAULT_TOR_SCORE;
  const torTtlMs = opts.torCacheTtlMs ?? DEFAULT_TOR_TTL_MS;
  const store = opts.store;
  const bogons = BOGON_CIDRS.map((b) => ({ label: b.label, parsed: parseCidr(b.cidr) }));
  const baseDatacenter = opts.datacenterCidrs ?? [...SEED_DATACENTER_CIDRS];
  const datacenter = compileCidrs([...baseDatacenter, ...opts.extraDatacenterCidrs ?? []]);
  const staticTor = opts.torExitNodes ? new Set(opts.torExitNodes instanceof Set ? opts.torExitNodes : opts.torExitNodes) : void 0;
  let memoryCache;
  let inflight;
  async function loadTorSet(now) {
    if (!opts.fetchTorExits) return void 0;
    if (store) {
      const cached = await store.get(TOR_CACHE_KEY);
      if (cached && cached.expiresAt > now) return new Set(cached.ips);
    } else if (memoryCache && memoryCache.expiresAt > now) {
      return memoryCache.ips;
    }
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const list = await opts.fetchTorExits();
        const set = new Set(list.map((s) => s.trim()).filter((s) => s.length > 0));
        const expiresAt = now + torTtlMs;
        if (store) {
          await store.set(TOR_CACHE_KEY, { ips: [...set], expiresAt }, torTtlMs);
        } else {
          memoryCache = { ips: set, expiresAt };
        }
        return set;
      } catch {
        return void 0;
      } finally {
        inflight = void 0;
      }
    })();
    return inflight;
  }
  return async function lookup(ip, _ctx) {
    if (typeof ip !== "string" || ip.length === 0) return null;
    const ipInt = ipv4ToInt(ip);
    let score = 0;
    const reasons = [];
    const data = {};
    if (ipInt !== null) {
      const bogon = bogons.find((b) => cidrContains(b.parsed, ipInt));
      if (bogon) {
        score = Math.max(score, privateScore);
        reasons.push(`private/reserved IP (${bogon.label}) \u2014 likely a misconfigured proxy`);
        data.private = true;
        data.asnHint = "bogon";
      }
      const dc = firstMatch(datacenter, ipInt);
      if (dc) {
        score = Math.max(score, datacenterScore);
        reasons.push(`datacenter/VPN IP range (${dc.raw})`);
        data.datacenter = true;
        data.asnHint = "datacenter";
      }
    }
    let isTor = staticTor?.has(ip) ?? false;
    if (!isTor) {
      const dynamic = await loadTorSet(Date.now());
      if (dynamic?.has(ip)) isTor = true;
    }
    if (isTor) {
      score = Math.max(score, torScore);
      reasons.push("Tor exit node");
      data.tor = true;
      data.asnHint = "tor";
    }
    if (reasons.length === 0) return null;
    return { score, reasons, data };
  };
}

export { SEED_DATACENTER_CIDRS, cidrContains, ipv4ToInt, parseCidr, reputationProvider };
//# sourceMappingURL=chunk-YVLEUWEW.js.map
//# sourceMappingURL=chunk-YVLEUWEW.js.map