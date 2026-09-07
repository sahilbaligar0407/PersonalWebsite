// src/adapters/shared.ts
var DEFAULT_STATUS = {
  allow: 200,
  challenge: 428,
  throttle: 429,
  review: 200,
  block: 403
};
function isEnforced(action) {
  return action === "block" || action === "throttle" || action === "challenge";
}
function shouldEnforce(decision, shadow) {
  return decision.enforced && !shadow && isEnforced(decision.action);
}
function extractIp(headers, fallback, trustProxy) {
  if (trustProxy) {
    const fwd = headers["x-forwarded-for"];
    const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
    if (first) return first;
  }
  return fallback || void 0;
}
function messageFor(action) {
  switch (action) {
    case "block":
      return "Request blocked due to suspected abuse.";
    case "throttle":
      return "Too many requests. Please slow down and try again shortly.";
    case "challenge":
      return "Additional verification required.";
    default:
      return "OK";
  }
}

export { DEFAULT_STATUS, extractIp, messageFor, shouldEnforce };
//# sourceMappingURL=chunk-CWC65UHW.js.map
//# sourceMappingURL=chunk-CWC65UHW.js.map