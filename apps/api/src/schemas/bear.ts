import { z } from 'zod';

export const BearId = z.string().regex(/^[a-z]+(-[a-z]+)*$/);

export const Bear = z.object({
  id: BearId, // stable slug of the binomial, e.g. "ursus-arctos"
  name: z.string().min(1),
  binomial: z.string().min(1),
  imageUrl: z.url().nullable(),
  range: z.string(),
});
export type Bear = z.infer<typeof Bear>;

// Envelope, so paging can be added later without a breaking change (slide 17)
export const BearList = z.object({ items: z.array(Bear) });
