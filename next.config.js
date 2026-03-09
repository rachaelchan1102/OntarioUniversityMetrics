/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark better-sqlite3 as external - only used for local dev scripts
  serverExternalPackages: ['better-sqlite3'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
};

module.exports = nextConfig;
