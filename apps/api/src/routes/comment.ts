import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { BearId } from '../schemas/bear.js';
import {
  Comment,
  CommentPage,
  CommentPageQuery,
  NewComment,
} from '../schemas/comment.js';
import type { CommentService } from '../services/comment-service.js';
import { Problem, problemResponse } from '../schemas/problem.js';
import { currentUser, type RequireAuth } from '../plugins/auth.js';
import type { CommentBus } from '../events/comment-bus.js';
import type { CommentEvent } from '../repositories/comment-event-repository.js';
import { createHash } from 'node:crypto';

export interface CommentRouteOptions {
  comments: CommentService;
  requireAuth: RequireAuth;
  bus: CommentBus;
}

// MAX_BUFFERED_BYTES limit for unsent data queued for one client
// Slow clients will be disconnected
const MAX_BUFFERED_BYTES = 1_048_576;

// Last event id from client
const StreamQuery = z.object({
  // Set by reconnecting-eventsource when it had to open a new EventSource (e.g. after a 502)
  lastEventId: z.coerce.number().int().min(0).optional(),
});

const IdempotencyHeaders = z.looseObject({
  'idempotency-key': z
    .string()
    .regex(/^[\w-]{8,64}$/)
    .optional(), // optional for this route
});

export const commentRoutes: FastifyPluginAsyncZod<CommentRouteOptions> = async (
  app,
  { comments, requireAuth, bus }
) => {
  app.get(
    '/api/bears/:id/comments',
    {
      config: { cache: 'revalidate' },
      schema: {
        params: z.object({ id: BearId }),
        querystring: CommentPageQuery,
        response: { 200: CommentPage, ...problemResponse },
      },
    },
    async (req) => await comments.list(req.params.id, req.query)
  );

  app.post(
    '/api/bears/:id/comments',
    {
      preHandler: requireAuth,
      schema: {
        params: z.object({ id: BearId }),
        headers: IdempotencyHeaders,
        body: NewComment,
        response: {
          201: Comment,
          401: Problem,
          422: Problem,
          ...problemResponse,
        },
      },
    },
    async (req, reply) => {
      const key = req.headers['idempotency-key'];
      // Either he sends a key or not both are valid
      // If he sends a key we also create a fingerprint which is a summary of what the client wants to do
      const idem =
        typeof key === 'string'
          ? {
              key,
              // Same key with another method, URL or body → 422
              fingerprint: createHash('sha256')
                .update(`${req.method} ${req.url} ${JSON.stringify(req.body)}`)
                .digest('hex'),
            }
          : undefined;
      const comment = await comments.create(
        req.params.id,
        req.body,
        currentUser(req),
        idem
      );
      return await reply
        .code(201)
        .header('location', `/api/comments/${comment.id}`)
        .send(comment);
    }
  );

  app.delete(
    '/api/comments/:commentId',
    {
      preHandler: requireAuth,
      schema: {
        params: z.object({ commentId: z.uuid() }),
        response: {
          204: z.null(),
          401: Problem,
          403: Problem,
          ...problemResponse,
        },
      },
    },
    async (req, reply) => {
      await comments.delete(req.params.commentId, currentUser(req));
      return await reply.code(204).send(null);
    }
  );

  app.get(
    '/api/comments/:commentId',
    {
      config: { cache: 'revalidate' },
      schema: {
        params: z.object({ commentId: z.uuid() }),
        response: { 200: Comment, ...problemResponse },
      },
    },
    async (req) => await comments.get(req.params.commentId)
  );

  app.post(
    '/api/comments/:commentId/report',
    {
      schema: {
        params: z.object({ commentId: z.uuid() }),
        response: { 200: Comment, ...problemResponse },
      },
    },
    async (req) => await comments.report(req.params.commentId)
  );

  app.get(
    '/api/bears/:id/comments/stream',
    {
      sse: 'only', // Accept: application/json gets 406 must acceot text/event-stream
      schema: {
        params: z.object({ id: BearId }),
        querystring: StreamQuery,
      },
    },
    async (req, reply) => {
      const bearId = req.params.id;
      await comments.assertBear(bearId); // 404 as problem+json: no SSE header sent yet
      // gets the resume seq id either from header or query
      const resumeFrom = resumePoint(
        reply.sse.lastEventId,
        req.query.lastEventId
      );

      void reply.header('cache-control', 'no-cache, no-transform');
      reply.sse.keepAlive(); // the stream stays open after the handler returns

      let sent = -1; // last event id
      let live = false; // False during catch up
      const early: CommentEvent[] = []; // Buffer events that happen during catchup
      const send = (event: CommentEvent): void => {
        // REturn if event has already been sent - happens during catch up query and in buffer
        // or when client is gone
        if (event.seq <= sent || !reply.sse.isConnected) return;
        if (reply.raw.writableLength > MAX_BUFFERED_BYTES) {
          reply.raw.destroy(); // slow consumer: cut, not buffer forever (close() would try to flush)
          return;
        }
        // Set last seq id and send event
        sent = event.seq;
        reply.sse
          .send({ id: String(event.seq), event: event.type, data: event.data })
          .catch(() => undefined); // rejects once the client is gone; unhandled it would crash Node
      };

      // 1. Subscribe first, so nothing committed during the catch-up query is missed
      const unsubscribe = bus.subscribe(bearId, (event) => {
        if (live) send(event);
        else early.push(event);
      });
      const offShutdown = bus.onShutdown(() => {
        // Used when app shuts down
        reply.sse.close();
      });
      // Used when connection ends
      reply.sse.onClose(() => {
        unsubscribe();
        offShutdown();
      });

      // Never resume beyond the newest event (e.g. after the DB was reset)
      const current = await comments.currentSeq(bearId);
      sent = resumeFrom === null ? current : Math.min(resumeFrom, current);
      // Sends the headers before the handler returns, and gives the client an id from the start
      await reply.sse.send({ id: String(sent), event: 'ready', data: {} });
      // 2. Catch up from the DB
      for (const event of await comments.eventsSince(bearId, sent)) send(event);
      // 3. Go live
      early.forEach(send);
      live = true;
    }
  );
};

// Header from a native reconnect, query from the wrapper; null on a first connect
function resumePoint(
  header: string | null,
  query: number | undefined
): number | null {
  const fromHeader = header === null ? NaN : Number(header); // Number(null) would be 0
  const ids = [fromHeader, query ?? NaN].filter(
    (n) => Number.isSafeInteger(n) && n >= 0
  );
  return ids.length > 0 ? Math.max(...ids) : null;
}
