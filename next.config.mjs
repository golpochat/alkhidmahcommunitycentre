/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/classes",
        destination: "/education",
        permanent: true,
      },
      {
        source: "/classes/:slug",
        destination: "/education/:slug",
        permanent: true,
      },
      {
        source: "/api/classes",
        destination: "/api/education",
        permanent: true,
      },
      {
        source: "/api/classes/:slug",
        destination: "/api/education/:slug",
        permanent: true,
      },
      {
        source: "/admin/classes",
        destination: "/admin/education",
        permanent: true,
      },
      {
        source: "/admin/classes/new",
        destination: "/admin/education/new",
        permanent: true,
      },
      {
        source: "/admin/classes/:id/edit",
        destination: "/admin/education/:id/edit",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
