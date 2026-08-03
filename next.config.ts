import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase", "@firebase/app", "@firebase/auth", "@firebase/firestore", "@firebase/storage"],
  typescript: { ignoreBuildErrors: true },
  generateBuildId: async () => `build-${Date.now()}`,
  async redirects() {
    return [
      { source: "/wardrobe", destination: "/workspace/calculators/built-in", permanent: true },
      { source: "/system", destination: "/workspace/clients", permanent: false },
      { source: "/system/projects", destination: "/workspace/clients", permanent: false },
      { source: "/system/projects/:id", destination: "/workspace/clients/:id", permanent: false },
      { source: "/system/styles", destination: "/workspace/styles", permanent: false },
      { source: "/system/styles/:id", destination: "/workspace/styles/:id", permanent: false },
      { source: "/system/styles/:id/:styleId", destination: "/workspace/styles/:id/:styleId", permanent: false },
      { source: "/system/dashboard", destination: "/workspace/clients", permanent: false },
      { source: "/studio", destination: "/workspace", permanent: false },
    ];
  },
};

export default nextConfig;
