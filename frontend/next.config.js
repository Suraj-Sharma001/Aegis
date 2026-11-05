/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'aegis-backend', 'localhost:8001'],
  },
};

module.exports = nextConfig;