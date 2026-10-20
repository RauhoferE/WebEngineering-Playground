export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Array<{ path: string; message: string }>;
}

export class ApiError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail ?? problem.title);
  }
}

// Turns a failed response into an ApiError; falls back if it's not a problem (e.g. Vite proxy error)
export async function toApiError(res: Response): Promise<ApiError> {
  const isProblem =
    res.headers.get('content-type')?.includes('application/problem+json') ===
    true;
  const problem: Problem = isProblem
    ? ((await res.json()) as Problem)
    : { type: 'about:blank', title: res.statusText, status: res.status };
  return new ApiError(problem);
}
