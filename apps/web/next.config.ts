import path from 'node:path';

import type { NextConfig } from 'next';

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // Pin the Turbopack workspace root to this monorepo (two levels up from apps/web).
  // Without it, Turbopack's root-inference walks up parent directories and can pick up an
  // unrelated pnpm-workspace.yaml (e.g. when this repo is checked out as a nested git worktree
  // under another repo's directory tree), which then fails to resolve the `next` package and
  // crashes the dev server.
  turbopack: {
    root: path.join(__dirname, '..', '..'),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
