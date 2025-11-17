/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.supabase.smartcamp.ai'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
}

module.exports = nextConfig
