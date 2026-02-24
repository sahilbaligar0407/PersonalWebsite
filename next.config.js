/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // rewrite alternate paths to the Senate page
  async rewrites() {
    return [
      { source: '/vote', destination: '/Senate' },
      { source: '/Vote', destination: '/Senate' },
      { source: '/senate', destination: '/Senate' },
      { source: '/campaign', destination: '/Senate' },
      { source: '/Campaign', destination: '/Senate' },
    ];
  },
};

module.exports = nextConfig;
