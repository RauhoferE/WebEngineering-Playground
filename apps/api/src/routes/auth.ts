import { type FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { toPublic, type AuthService } from '../services/auth-service.js';
import { LoginBody, PublicUser, RegisterBody } from '../schemas/auth.js';
import { Problem, problemResponse } from '../schemas/problem.js';
import {
  currentUser,
  TOKEN_COOKIE,
  type RequireAuth,
} from '../plugins/auth.js';
import { createLoginLimiter, LIMITS } from '../plugins/security.js';

export interface AuthRouteOptions {
  auth: AuthService;
  requireAuth: RequireAuth;
  secureCookie: boolean; // true in production (HTTPS only)
  ttlSeconds: number; // cookie Max-Age = JWT exp
}

export const authRoutes: FastifyPluginAsyncZod<AuthRouteOptions> = async (
  app,
  { auth, requireAuth, secureCookie, ttlSeconds }
) => {
  const limitLogin = createLoginLimiter(app);
  // Same attributes for set and clear, otherwise the browser keeps the old cookie
  const cookieBase = {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    path: '/',
  } as const;

  app.post(
    '/api/auth/register',
    {
      config: { rateLimit: LIMITS.register },
      schema: {
        body: RegisterBody,
        response: { 201: PublicUser, 409: Problem, ...problemResponse },
      },
    },
    async (req, reply) =>
      await reply.code(201).send(await auth.register(req.body))
  );

  app.post(
    '/api/auth/login',
    {
      // Uses prehandler since we need the body for email rate limit and onRequest the body is undefined
      preHandler: limitLogin,
      schema: {
        body: LoginBody,
        response: { 200: PublicUser, 401: Problem, ...problemResponse },
      },
    },
    async (req, reply) => {
      const { user, token } = await auth.login(req.body);
      // @fastify/cookie: maxAge is in SECONDS
      return await reply
        .setCookie(TOKEN_COOKIE, token, { ...cookieBase, maxAge: ttlSeconds })
        .send(user);
    }
  );

  app.post(
    '/api/auth/logout',
    { schema: { response: { 204: z.null() } } },
    async (req, reply) => {
      await auth.logout(req.cookies[TOKEN_COOKIE]); // first revoke on the server...
      return await reply
        .clearCookie(TOKEN_COOKIE, cookieBase) // ...then drop the cookie
        .code(204)
        .send(null);
    }
  );

  app.get(
    '/api/auth/me',
    {
      preHandler: requireAuth,
      schema: {
        response: { 200: PublicUser, 401: Problem, ...problemResponse },
      },
    },
    async (req) => toPublic(currentUser(req))
  );
};
