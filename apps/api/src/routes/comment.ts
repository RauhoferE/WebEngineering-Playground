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

export interface CommentRouteOptions {
  comments: CommentService;
  requireAuth: RequireAuth;
}

export const commentRoutes: FastifyPluginAsyncZod<CommentRouteOptions> = async (
  app,
  { comments, requireAuth }
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
        body: NewComment,
        response: { 201: Comment, 401: Problem, ...problemResponse },
      },
    },
    async (req, reply) => {
      const comment = await comments.create(
        req.params.id,
        req.body,
        currentUser(req)
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
};
