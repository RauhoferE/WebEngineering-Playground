import { apiBase } from '../../common/config';
import { toApiError } from '../../common/problem';
import type { PublicUser } from './auth-models';

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email,
      password,
    }),
  });
  if (!res.ok) throw await toApiError(res);
}

export async function login(
  email: string,
  password: string
): Promise<PublicUser> {
  const res = await fetch(`${apiBase}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email,
      password,
    }),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as PublicUser;
}

export async function logout(): Promise<void> {
  const res = await fetch(`${apiBase}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
    body: undefined,
  });
  if (!res.ok) throw await toApiError(res);
}

export async function fetchMe(signal: AbortSignal): Promise<PublicUser | null> {
  const res = await fetch(`${apiBase}/api/auth/logout`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
    credentials: 'include',
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as PublicUser;
}
