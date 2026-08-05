/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // vercel.json installs with `--omit=dev`, so eslint isn't available during the
    // deploy build. Lint locally or in CI (`npx next lint`) instead.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
