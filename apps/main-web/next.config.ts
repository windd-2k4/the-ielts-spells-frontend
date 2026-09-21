import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = dirname(fileURLToPath(import.meta.url));

export default function nextConfig(): NextConfig {
  return {
    transpilePackages: ["@ielts/api-client", "@ielts/contracts", "@ielts/ui"],
    turbopack: { root: resolve(appDirectory, "../..") },
  };
}
