import { z } from 'zod';

export const Env = z.object({
  PORT: z.coerce.number().int().default(3000),
  WIKIPEDIA_BASE_URL: z.url().default('https://en.wikipedia.org'),
  USER_AGENT: z
    .string()
    .min(1)
    .default(
      'BearApp/0.1 (https://github.com/RauhoferE/WebEngineering-Playground)'
    ),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:4173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin !== '')
    ),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  REPORT_MODE: z.enum(['naive', 'transaction', 'locked']).default('locked'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  JWT_SECRET: z.string().min(32),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  TRUST_PROXY: z.boolean().default(false),
  APP_VERSION: z.string().default('dev'),
});

export type Env = z.infer<typeof Env>;

// Fails at startup if the configuration is invalid
export function loadEnv(): Env {
  return Env.parse(process.env);
}
