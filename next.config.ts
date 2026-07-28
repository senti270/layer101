import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase", "@firebase/app", "@firebase/auth", "@firebase/firestore", "@firebase/storage"],
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
