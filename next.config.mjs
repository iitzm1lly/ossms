/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Tauri
  output: 'export',
  trailingSlash: true,
  
  // Disable image optimization for desktop app
  images: {
    unoptimized: true
  },
  
  // Skip TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Skip ESLint checking during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable source maps to reduce memory usage
  productionBrowserSourceMaps: false,
  
  // Additional memory optimizations
  swcMinify: true,
  compress: true,
  
  // Build optimizations for clean builds
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Reduce bundle size
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize for size
      config.optimization.minimize = true;
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
