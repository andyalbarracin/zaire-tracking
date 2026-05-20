/* next.config.ts — 2026-05-19
   Configuración de Next.js 16 para SAS Trace */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
