import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { BearId } from '../schemas/bear.js';
import { Comment, CommentList, NewComment } from '../schemas/comment.js';
import type { CommentService } from '../services/comment-service.js';
import { problemResponse } from '../schemas/problem.js';

export const commentRoutes: FastifyPluginAsyncZod<{
  comments: CommentService;
}> = async (app, { comments }) => {
  app.get(
    '/api/bears/:id/comments',
    {
      schema: {
        params: z.object({ id: BearId }),
        response: { 200: CommentList, ...problemResponse },
      },
    },
    async (req) => ({ items: await comments.list(req.params.id) })
  );

  app.post(
    '/api/bears/:id/comments',
    {
      schema: {
        params: z.object({ id: BearId }),
        body: NewComment,
        response: { 201: Comment, ...problemResponse },
      },
    },
    async (req, reply) => {
      const comment = await comments.create(req.params.id, req.body);
      return await reply
        .code(201)
        .header('location', `/api/comments/${comment.id}`)
        .send(comment);
    }
  );

  app.delete(
    '/api/comments/:commentId',
    {
      schema: {
        params: z.object({ commentId: z.uuid() }),
        response: { 204: z.null(), ...problemResponse },
      },
    },
    async (req, reply) => {
      comments.delete(req.params.commentId);
      return await reply.code(204).send(null);
    }
  );
};
