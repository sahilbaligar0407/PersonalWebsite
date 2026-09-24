/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle so the Docker image (Railway) stays small.
  output: "standalone",
  images: {
    // Self-hosted standalone doesn't bundle `sharp`, so the default image
    // optimizer fails at runtime. These are a couple of static assets — serve
    // them as-is instead of pulling in a native dependency.
    unoptimized: true,
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
  async rewrites() {
    const afterFiles = [];

    // Proxy /Calendar to the separate SmartCal service (its own Railway service
    // + Postgres + self-hosted SLM). The /Calendar prefix is PRESERVED because
    // the calendar server serves everything under /Calendar (APP_BASE_PATH).
    //
    // NOTE: rewrites() runs at BUILD time and is compiled into routes-manifest.json,
    // so CALENDAR_ORIGIN must be present during `next build` (see the ARG in the
    // Dockerfile) — setting it only at runtime has no effect. This log makes it
    // obvious in the Railway build logs whether the proxy was baked in.
    const beforeFiles = [];
    const calendarOrigin = process.env.CALENDAR_ORIGIN;
    if (calendarOrigin) {
      const origin = calendarOrigin.replace(/\/$/, "");
      // beforeFiles runs before filesystem/route resolution, so nothing in the
      // app can shadow the proxy and cause a premature 404.
      beforeFiles.push(
        { source: "/Calendar", destination: `${origin}/Calendar` },
        { source: "/Calendar/:path*", destination: `${origin}/Calendar/:path*` },
      );
      console.log(`[next.config] Calendar proxy ENABLED -> ${origin}/Calendar`);
    } else {
      console.warn(
        "[next.config] CALENDAR_ORIGIN not set at build time — /Calendar proxy will NOT be generated.",
      );
    }

    return { beforeFiles, afterFiles };
  },
};

module.exports = nextConfig;
