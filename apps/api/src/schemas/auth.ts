import { z } from 'zod';

export const Role = z.enum(['user', 'moderator']);
export type Role = z.infer<typeof Role>;

export const RegisterBody = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    password: z.string().min(12).max(128),
  })
  .strict();
export type RegisterBody = z.infer<typeof RegisterBody>;

export const PublicUser = z
  .object({
    id: z.uuid(),
    email: z.string(),
    role: Role,
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'PublicUser' });
export type PublicUser = z.infer<typeof PublicUser>;
