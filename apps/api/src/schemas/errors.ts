import type { FastifyError, FastifyRequest } from 'fastify';
import { STATUS_CODES } from 'node:http';
import type { Problem } from './problem.js';
import { hasZodFastifySchemaValidationErrors } from '@fastify/type-provider-zod';

export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly type: string;
  abstract readonly title: string;
  readonly detail: string = this.message;
}
const P = 'https://bears.example/problems';

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly type = `${P}/not-found`;
  readonly title = 'Resource not found';
}
export class UpstreamError extends AppError {
  readonly status = 502;
  readonly type = `${P}/upstream`;
  readonly title = 'Upstream unavailable';
  readonly detail = 'The bear data source could not be reached.';
}
export class UpstreamTimeoutError extends AppError {
  readonly status = 504;
  readonly type = `${P}/upstream-timeout`;
  readonly title = 'Upstream timeout';
  readonly detail = 'The bear data source did not answer in time.';
}

export function problem(
  status: number,
  detail: string,
  req: FastifyRequest,
  type = 'about:blank',
  title = STATUS_CODES[status] ?? 'Error'
): Problem {
  return { type, title, status, detail, instance: `urn:uuid:${req.id}` };
}

export function toProblem(err: FastifyError, req: FastifyRequest): Problem {
  // Our own errors: status comes from the class, never from the message text
  if (err instanceof AppError) {
    return problem(err.status, err.detail, req, err.type, err.title);
  }
  // params/body failed the zod schema
  if (hasZodFastifySchemaValidationErrors(err)) {
    return {
      ...problem(
        400,
        'The request could not be accepted.',
        req,
        `${P}/validation`,
        'Invalid request'
      ),
      errors: err.validation.map((v) => ({
        path: v.instancePath.slice(1), // "/text" -> "text"
        message: v.message ?? '',
      })),
    };
  }
  // Other Fastify client errors: malformed JSON (400), wrong Content-Type (415), ...
  if (err.statusCode !== undefined && err.statusCode < 500) {
    return problem(err.statusCode, err.message, req);
  }
  // Anything else: generic detail, no stack trace, the details go to the log
  return problem(
    500,
    'An unexpected error occurred.',
    req,
    `${P}/internal`,
    'Internal server error'
  );
}
