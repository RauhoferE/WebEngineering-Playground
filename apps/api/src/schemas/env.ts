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
});
export type Env = z.infer<typeof Env>;

// Fails at startup if the configuration is invalid
export function loadEnv(): Env {
  return Env.parse(process.env);
}
