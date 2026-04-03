import path from 'node:path';
import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
import './src/libs/Env';

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  outputFileTracingRoot: path.join(process.cwd(), '..'),
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  serverExternalPackages: [
    '@better-auth/core',
    '@better-auth/kysely-adapter',
    'better-auth',
    'import-in-the-middle',
    'kysely',
    'pg',
    'require-in-the-middle',
  ],
};

let configWithPlugins = baseConfig;

// Conditionally enable bundle analysis
if (process.env.ANALYZE === 'true') {
  configWithPlugins = withBundleAnalyzer()(configWithPlugins);
}

const nextConfig = configWithPlugins;
export default nextConfig;
