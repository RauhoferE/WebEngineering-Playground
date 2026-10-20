export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly type: string;
  abstract readonly title: string;
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
}
export class UpstreamTimeoutError extends AppError {
  readonly status = 504;
  readonly type = `${P}/upstream-timeout`;
  readonly title = 'Upstream timeout';
}
