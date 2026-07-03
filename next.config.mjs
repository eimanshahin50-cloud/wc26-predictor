/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Provider flag/logo images. API-Football serves from media.api-sports.io.
    remotePatterns: [
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "media-*.api-sports.io" },
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
};
export default nextConfig;
