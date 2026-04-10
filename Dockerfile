FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行环境
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# 从构建阶段拷贝 standalone 产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

# Next.js standalone 模式通过 server.js 启动
CMD ["node", "server.js"]
