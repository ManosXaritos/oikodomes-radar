/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Always show fresh data when moving between app pages (e.g. «Τα έργα μου» after changing a lead on the map).
  experimental: { staleTimes: { dynamic: 0 } },
  // Basic protection: no embedding in other sites, no file-type guessing, private referrers.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default nextConfig;
