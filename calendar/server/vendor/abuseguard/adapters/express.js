import { DEFAULT_STATUS, shouldEnforce, messageFor } from '../chunk-CWC65UHW.js';

// src/adapters/express.ts
function clientIp(req, trustProxy = true) {
  if (trustProxy) {
    const fwd = req.headers["x-forwarded-for"];
    const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || void 0;
}
function abuseGuardExpress(guard, opts = {}) {
  const trustProxy = opts.trustProxy ?? true;
  const status = { ...DEFAULT_STATUS, ...opts.statusByAction };
  return async function middleware(req, res, next) {
    try {
      const action = typeof opts.action === "function" ? opts.action(req) : opts.action ?? req.path ?? "request";
      const ctx = {
        action,
        ip: clientIp(req, trustProxy),
        userAgent: req.headers["user-agent"] || void 0,
        ...opts.context?.(req)
      };
      const decision = await guard.evaluate(ctx);
      req.abuse = decision;
      if (opts.respond) {
        if (opts.respond(decision, req, res)) return;
      } else if (shouldEnforce(decision, opts.shadow)) {
        if (decision.action === "throttle") res.setHeader("Retry-After", "60");
        res.status(status[decision.action]).json({
          error: messageFor(decision.action),
          action: decision.action
        });
        return;
      }
      next();
    } catch (err) {
      next();
    }
  };
}

export { abuseGuardExpress, clientIp };
//# sourceMappingURL=express.js.map
//# sourceMappingURL=express.js.map