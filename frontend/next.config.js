/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port:     "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: process.env.API_DOMAIN || "api.trdstore.sa",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      // TRD: /seller -> /seller/register
      { source: "/seller", destination: "/seller/register", permanent: false },
      // TRD: /wishlist -> /shop/wishlist
      { source: "/wishlist", destination: "/shop/wishlist", permanent: false },
    ];
  },
};

module.exports = nextConfig;
