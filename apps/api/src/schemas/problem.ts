import { z } from 'zod';

// RFC 9457 Problem Details; also used for the OpenAPI document in Task 5
export const Problem = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string(),
    instance: z.string(),
    errors: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional(),
  })
  .meta({ id: 'Problem' });
export type Problem = z.infer<typeof Problem>;

export const problemResponse = {
  400: Problem,
  404: Problem,
  500: Problem,
  502: Problem,
  504: Problem,
};
