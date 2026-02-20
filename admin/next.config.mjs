/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/admin",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/admin/login",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
