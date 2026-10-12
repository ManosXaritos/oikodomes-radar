/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Always show fresh data when moving between app pages (e.g. «Τα έργα μου» after changing a lead on the map).
  experimental: { staleTimes: { dynamic: 0 } },
};
export default nextConfig;
