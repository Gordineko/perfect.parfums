
const path = require("path");

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  outputFileTracingRoot: path.join(__dirname, ".."),

  images: {
    domains: [
      "i.postimg.cc",
      "fcdn.site",
      "localhost:8080",
      "192.168.1.126",
      "picsum.photos",
      "yourcdn.com",
      "cdn.site",
      "d3og57k1dk4307.cloudfront.net",
      "localhost",
      // CDN бекенду (картинки товарів з API)
      "maloeatelier.com",
      // legacy CDN (частина товарів ще віддає URL зі старого домену)
      "worldofheels.com.ua",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maloeatelier.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "worldofheels.com.ua",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
