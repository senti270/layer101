import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase", "@firebase/app", "@firebase/auth", "@firebase/firestore", "@firebase/storage"],
};

export default nextConfig;
