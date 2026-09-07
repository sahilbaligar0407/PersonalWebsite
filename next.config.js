/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle so the Docker image (Railway) stays small.
  output: "standalone",
  images: {
    domains: [],
  },
  // Disable webpack cache on Windows to avoid file locking issues
  webpack: (config, { isServer }) => {
    if (process.platform === 'win32') {
      config.cache = false;
    }
    return config;
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Serve the RoyLee page under alternate paths (URL stays the same).
  async rewrites() {
    const rules = [
      { source: "/roylee", destination: "/RoyLee" },
      { source: "/application", destination: "/RoyLee" },
    ];

    // Proxy /Calendar to the separate SmartCal service (its own Railway service
    // + Postgres + self-hosted SLM). Set CALENDAR_ORIGIN on the personal-site
    // service, e.g. http://smartcal.railway.internal:8080 (private) or the
    // service's public https URL. The /Calendar prefix is preserved because the
    // calendar server serves everything under /Calendar.
    const calendarOrigin = process.env.CALENDAR_ORIGIN;
    if (calendarOrigin) {
      const origin = calendarOrigin.replace(/\/$/, "");
      rules.push(
        { source: "/Calendar", destination: `${origin}/Calendar` },
        { source: "/Calendar/:path*", destination: `${origin}/Calendar/:path*` },
      );
    }

    return rules;
  },
};

module.exports = nextConfig;
