import type { Role } from '../schemas/auth.js';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}
export interface NewUser {
  email: string;
  passwordHash: string;
  role: Role;
}

export interface UserRepository {
  create: (input: NewUser) => Promise<User | null>; // null = e-mail taken
  findByEmail: (email: string) => Promise<User | null>;
  findById: (id: string) => Promise<User | null>;
}
