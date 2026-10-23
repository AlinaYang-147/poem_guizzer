FROM node:22.23.4-alpine AS builder
RUN apk add --no-cache ca-certificates && apk upgrade --no-cache ca-certificates && update-ca-certificates
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行环境
FROM node:22.23.4-alpine AS runner
RUN apk add --no-cache ca-certificates && apk upgrade --no-cache ca-certificates && update-ca-certificates
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
