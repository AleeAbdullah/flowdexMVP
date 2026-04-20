import path from 'node:path';
import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
import './src/libs/Env';

const isStaticExportBuild = process.env.STATIC_EXPORT === 'true';

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  ...(isStaticExportBuild
    ? {
        output: 'export',
        trailingSlash: true,
        skipTrailingSlashRedirect: true,
        images: {
          unoptimized: true,
        },
      }
    : {}),
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
