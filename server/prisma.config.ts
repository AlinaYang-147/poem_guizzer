
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  // In Prisma 7, seed is a top-level property
  seed: {
    command: 'tsx prisma/seed.ts',
  },
})
