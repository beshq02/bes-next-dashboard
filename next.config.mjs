import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // 明確指定工作區根目錄
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ['mssql', 'tedious'],
  outputFileTracingRoot: __dirname,
  eslint: {
    // ESLint parser 不支援 optional chaining (?.)，build 時跳過
    ignoreDuringBuilds: true,
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
    // 移除 @vercel/nft 相關插件，避免 UNC 路徑被解析為 glob 掃描 C:\
    if (isServer) {
      config.plugins = config.plugins.filter(plugin => {
        const name = plugin.constructor.name
        return name !== 'TraceEntryPointsPlugin'
      })
    }

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
