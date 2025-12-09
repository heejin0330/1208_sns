import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { 
        hostname: "*.supabase.co",
        protocol: "https",
      },
      // 또는 정확한 도메인을 알고 있다면:
      // { 
      //   hostname: "gmlnsikxreriwmwgshro.supabase.co",
      //   protocol: "https",
      // },
    ],
  },
};

export default nextConfig;