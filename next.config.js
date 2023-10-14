/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack5: true,
  webpack: config => {
    config.resolve.fallback = {
      fs: false,
    };

    return config;
  },
  images: {
    domains: ["images.metmuseum.org"],
  },
};

module.exports = nextConfig;
