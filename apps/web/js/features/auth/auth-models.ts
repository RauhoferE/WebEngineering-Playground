export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export type Role = 'moderator' | 'user';
