/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize font loading
  experimental: {
    optimizeCss: false,
  },
  // Add turbopack config (empty for now, silences the warning)
  turbopack: {},
  // Add webpack config to handle workers properly
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't try to bundle worker files
      config.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
      });
    }
    return config;
  },
}

module.exports = nextConfig
