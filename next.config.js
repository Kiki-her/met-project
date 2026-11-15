/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的ホスティング（Netlify / Cloudflare Pages 等）にそのまま置けるよう完全静的出力
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

module.exports = nextConfig;
