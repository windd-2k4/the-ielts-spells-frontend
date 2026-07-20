import type { NextConfig } from "next";
const config: NextConfig = { transpilePackages: ["@ielts/ui"], turbopack: { root: "../.." } };
export default config;
