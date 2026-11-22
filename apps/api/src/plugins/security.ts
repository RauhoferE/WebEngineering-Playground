import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { RateLimitedError } from '../schemas/errors.js';

// Every limit in one place; the tests and the brute-force script read them from here
export const LIMITS = {
  api: { max: 300, timeWindow: '1 minute' }, // safety net per IP, every /api route
  loginAccount: { max: 5, timeWindow: '1 minute' }, // per IP + e-mail: guessing one password
  loginIp: { max: 20, timeWindow: '5 minutes' }, // per IP, all e-mails: trying many accounts
  register: { max: 10, timeWindow: '15 minutes' }, // per IP: account spam
} as const;

export function registerSecurity(
  app: FastifyInstance,
  production: boolean
): void {
  void app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        frameAncestors: ["'none'"],
        // Over plain http (dev) this would rewrite Swagger UI's assets to https and break them
        upgradeInsecureRequests: production ? [] : null,
      },
    },
  });
  void app.register(rateLimit, {
    global: true,
    ...LIMITS.api,
    errorResponseBuilder: (_req, context) =>
      new RateLimitedError(Math.ceil(context.ttl / 1000)),
  });
}

export type LoginLimiter = (req: FastifyRequest) => Promise<void>;

// The body after validation: trimmed and lower-cased, so "A@x.org" and "a@x.org" share a bucket
function emailOf(req: FastifyRequest): string {
  const body = req.body;
  return typeof body === 'object' &&
    body !== null &&
    'email' in body &&
    typeof body.email === 'string'
    ? body.email
    : '';
}

// Call inside a route plugin: createRateLimit only exists once the plugin has loaded.
// Not two rateLimit configs: the plugin runs only the first hook-based limiter per request
export function createLoginLimiter(app: FastifyInstance): LoginLimiter {
  const perIp = app.createRateLimit({
    ...LIMITS.loginIp,
    keyGenerator: (req) => `login-ip:${req.ip}`,
  });
  const perAccount = app.createRateLimit({
    ...LIMITS.loginAccount,
    keyGenerator: (req) => `login:${req.ip}:${emailOf(req)}`,
  });
  return async (req) => {
    for (const limit of [perIp, perAccount]) {
      const result = await limit(req);
      if (!result.isAllowed && result.isExceeded) {
        // a union type: narrow with isAllowed first
        // A09: make spikes visible. Log the IP only, the e-mail is personal data
        req.log.warn({ ip: req.ip }, 'login rate limit exceeded');
        throw new RateLimitedError(result.ttlInSeconds);
      }
    }
  };
}
