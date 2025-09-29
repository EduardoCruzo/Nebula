import type { NextConfig } from "next";

// 通过环境变量自动推导 basePath/assetPrefix
// - 如果仓库名为 <user>.github.io 则 base 为空
// - 否则为 /<repo>
const repo = process.env.GITHUB_REPOSITORY?.split("/")?.[1] || "";
const owner = process.env.GITHUB_REPOSITORY?.split("/")?.[0] || "";
const isUserSite = repo && owner && repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const base = isUserSite ? "" : (repo ? `/${repo}` : "");

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    turbo: {},
  },
  output: "export",
  basePath: base || undefined,
  assetPrefix: base ? `${base}/` : undefined,
  images: { unoptimized: true },
};

export default nextConfig;




