import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  webpack: (config, { isServer, webpack }) => {
    // Add polyfills for browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
      
      // Define global for browser
      config.plugins.push(
        new webpack.ProvidePlugin({
          global: 'globalThis',
        })
      );
    }
    
    return config;
  },
};

export default withNextIntl(nextConfig);


