import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@ielts/api-client", "@ielts/contracts", "@ielts/ui"],
  turbopack: { root: "../.." },
};

export default config;
