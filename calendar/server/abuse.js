// Abuse protection for the public endpoints.
//
// This sits in front of express-rate-limit rather than replacing it: the
// limiters are a flat per-IP ceiling, while this scores a request on several
// signals and can act earlier on things that look automated. Keeping both means
// a mistake in the scoring layer cannot leave an endpoint unprotected.
//
// See server/vendor/abuseguard/README.md for why the library is vendored and
// why `trustProxy: false` is mandatory.

import { AbuseGuard, velocity, ipReputation, disposableEmail } from "./vendor/abuseguard/index.js";
import { abuseGuardExpress } from "./vendor/abuseguard/adapters/express.js";

// Shared: `req.ip`, resolved by Express's own `trust proxy`. Never the raw
// X-Forwarded-For header — see the README.
const IP_ONLY = { trustProxy: false };

/**
 * Signals deliberately NOT used:
 *
 *   deviceCluster — scores accounts-per-IP over 60 days and hard-blocks at ~8.
 *     Students share a campus NAT egress, so this would ban a whole university
 *     as a group. It is the single most dangerous default for this app.
 *
 *   content — tuned for user-generated posts (link counts, shouting, keyword
 *     denylists). What people paste here is course schedules, which trip those
 *     heuristics for entirely innocent reasons.
 */

/** Anonymous .ics relay: the one endpoint that makes the server fetch a URL. */
const icsGuard = new AbuseGuard({
  signals: [
    velocity({ windowMs: 10 * 60_000, max: 8 }),
    // Scripted clients (curl, python-requests, headless Chrome) have no reason
    // to be here; a real import comes from a browser.
    ipReputation({ suspiciousUaScore: 75 }),
  ],
  // Nothing here is destructive, so prefer slowing down over blocking outright.
  policy: { challenge: 60, throttle: 70, review: 85, block: 95 },
  onDecision: logDecision("ics"),
});

/** Sign-up: the expensive thing to automate is account creation. */
const signupGuard = new AbuseGuard({
  signals: [
    velocity({ windowMs: 60 * 60_000, max: 5 }),
    ipReputation({ suspiciousUaScore: 75 }),
    disposableEmail(),
  ],
  policy: { challenge: 50, throttle: 65, review: 80, block: 90 },
  onDecision: logDecision("signup"),
});

/** AI parsing: each call costs real GPU time on the SLM service. */
const aiGuard = new AbuseGuard({
  signals: [
    velocity({ windowMs: 10 * 60_000, max: 12 }),
    ipReputation({ suspiciousUaScore: 75 }),
  ],
  policy: { challenge: 60, throttle: 70, review: 85, block: 95 },
  onDecision: logDecision("ai"),
});

function logDecision(label) {
  return (d) => {
    // Only worth a line when we actually did something. Never log the email or
    // the pasted content — that is the user's coursework.
    if (d.action === "allow") return;
    console.warn(`[abuse:${label}] ${d.action} score=${d.score} ${d.reasons?.join("; ") ?? ""}`);
  };
}

export const guardIcs = abuseGuardExpress(icsGuard, {
  ...IP_ONLY,
  action: "ics",
});

export const guardSignup = abuseGuardExpress(signupGuard, {
  ...IP_ONLY,
  action: "signup",
  // The email is used for the disposable-domain check only. actorId is left
  // unset so nothing keys a long-lived record on it.
  context: (req) => ({ email: typeof req.body?.email === "string" ? req.body.email : undefined }),
});

export const guardAi = abuseGuardExpress(aiGuard, {
  ...IP_ONLY,
  action: "ai",
  // Signed-in users are keyed by account, so one person on a shared campus IP
  // cannot use up everyone else's budget.
  context: (req) => ({ actorId: req.user?.id }),
});
