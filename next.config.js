/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  compiler: {
    styledComponents: true,
  },

  images: {
    domains: [
      // RAWG
      "media.rawg.io",
      "screenshots.rawg.io",

      // Cloudinary (посты, видео превью)
      "res.cloudinary.com",

      // Google avatars (next-auth)
      "lh3.googleusercontent.com",
    ],
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
