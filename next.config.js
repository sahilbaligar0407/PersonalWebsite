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
};

module.exports = nextConfig;
