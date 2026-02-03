/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // 明確指定工作區根目錄
  turbopack: {
    root: process.cwd(), // 或使用絕對路徑
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cpm2.bes.com.tw',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // 只在客戶端構建時添加 fallback
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dgram: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        'node:url': false,
        'node:util': false,
        'node:stream': false,
        'node:buffer': false,
      }
    }
    return config
  },
}

export default nextConfig
