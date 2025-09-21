import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  env: {
    // AWS credentials are now hardcoded in the service for development
    // In production, use proper environment variables or IAM roles
  }
};

export default nextConfig;
