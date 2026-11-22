import { apiBase } from '../../common/config';
import { toApiError } from '../../common/problem';

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  if (!res.ok) throw await toApiError(res);
}
