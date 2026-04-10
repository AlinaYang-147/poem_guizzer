import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
    // Add this line:
    directUrl: env('DIRECT_URL'), 
  },
  migrations: {
    path: 'prisma/migrations',
    // The CLI is explicitly looking for it here
    seed: 'tsx prisma/seed.ts', 
  },
})
