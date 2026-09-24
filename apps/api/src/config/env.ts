import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),
  MONGODB_URI: z.string().trim().min(1).optional(),
  MONGODB_DB_NAME: z.string().trim().min(1).default('erp_universal_development'),
  JWT_SECRET: z.preprocess((value) => (value === '' ? undefined : value), z.string().min(32).optional()),
  JWT_REFRESH_SECRET: z.preprocess((value) => (value === '' ? undefined : value), z.string().min(32).optional()),
  SEED_ADMIN_PASSWORD: z.preprocess((value) => (value === '' ? undefined : value), z.string().min(12).optional()),
});

export const env = environmentSchema.parse(process.env);
