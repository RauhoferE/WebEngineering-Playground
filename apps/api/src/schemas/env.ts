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
  // Which proxies may set X-Forwarded-For: "uniquelocal" (Docker network), "loopback" or
  // IPs/CIDRs, comma-separated. Unset: the header is ignored and cannot be spoofed.
  TRUST_PROXY: z.string().trim().min(1).optional(),
  APP_VERSION: z.string().default('dev'),
  // Only for autocannon runs: turns the per-IP API limit off outside production
  BENCH_DISABLE_RATE_LIMIT: z.stringbool().default(false),
  // Worker: must be longer than the slowest normal run, or a healthy job runs twice
  JOB_VISIBILITY_TIMEOUT_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(300),
  // Worker demo only: makes a job slow enough to kill the worker mid-job
  WORKER_DEMO_DELAY_MS: z.coerce.number().int().min(0).default(0),
});

export type Env = z.infer<typeof Env>;

// Fails at startup if the configuration is invalid
export function loadEnv(): Env {
  return Env.parse(process.env);
}
