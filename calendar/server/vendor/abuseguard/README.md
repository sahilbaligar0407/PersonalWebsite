# Vendored: AbuseGuard

Source: https://github.com/sahil-baligar/AbuseGuard
Commit: `fa46053263d9abd05a765939c87e70966d146633`
License: MIT (see `LICENSE`)

These are the **built ESM bundles** (`dist/`) from that commit, copied in rather
than installed. That is not a style preference — the package is not published to
npm (`npm view abuseguard` is a 404), and installing it from the git URL does not
work either, because `package.json` sets `"files": ["dist", ...]` but has no
`prepare`/`prepack` script, so a git install fetches a tree with no `dist/` and
every import resolves to nothing.

To update: build the upstream repo (`npm ci && npm run build`) and copy
`dist/index.js`, `dist/adapters/express.js` and `dist/chunk-*.js` over these
files, then update the commit hash above.

## Configuration this app relies on

See `server/abuse.js`. Two settings there are load-bearing and must not be
changed casually:

- **`trustProxy: false`** — counterintuitive, and required. The adapter's own
  `clientIp()` defaults to reading the *leftmost* `X-Forwarded-For` entry, which
  is the value the client sent. Proxies append, so on Railway that is
  attacker-controlled: every request can claim a fresh IP and IP-keyed limits
  never fire. Passing `false` makes it fall back to `req.ip`, which Express has
  already resolved correctly via its own `trust proxy` setting.
- **No `deviceCluster` signal.** It scores `fpAccounts*30 + ipAccounts*12` over a
  60-day window, so ~8 accounts from one IP reaches a hard block. This is a
  student app: a campus or CGNAT egress IP is shared by thousands of people, and
  enabling it would ban them as a group.
