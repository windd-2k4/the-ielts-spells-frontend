import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  transpilePackages: ["@ielts/api-client", "@ielts/contracts", "@ielts/ui"],
  turbopack: { root: resolve(appDirectory, "../..") },
};

export default config;
