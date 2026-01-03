/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  reactStrictMode: true,

  images: {
    domains: ["media.rawg.io", "screenshots.rawg.io", "res.cloudinary.com"],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

module.exports = nextConfig;

// Next/Image по умолчанию разрешает только определённые домены
// Cloudinary — внешний домен, поэтому его добавляют в next.config.js
