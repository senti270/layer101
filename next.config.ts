import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase", "@firebase/app", "@firebase/auth", "@firebase/firestore", "@firebase/storage"],
  typescript: { ignoreBuildErrors: true },
  generateBuildId: async () => `build-${Date.now()}`,
};

export default nextConfig;
