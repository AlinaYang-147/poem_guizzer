/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 必须开启，生成独立运行包
  images: {
    unoptimized: true, // 建议开启，因为云环境不一定支持 Next 内置的 sharp 优化
  },
}

module.exports = nextConfig
