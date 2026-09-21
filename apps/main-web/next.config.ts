import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = dirname(fileURLToPath(import.meta.url));

export default function nextConfig(phase: string): NextConfig {
  return {
    // Keep development manifests isolated from `next build`. Running both
    // processes against the same .next directory can make the dev router
    // temporarily resolve every route as 404.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    transpilePackages: ["@ielts/api-client", "@ielts/contracts", "@ielts/ui"],
    turbopack: { root: resolve(appDirectory, "../..") },
  };
}
