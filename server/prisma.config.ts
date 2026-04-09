import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

/**
 * Prisma 7 Configuration
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  // Add this block for Prisma 7 seeding
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
})
