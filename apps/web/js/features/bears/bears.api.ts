import { toApiError } from '../../common/problem';
import { type Bear } from './bear-models';

export const placeholderImage = '/media/placeholder.svg';

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) throw await toApiError(res);
  if (!res.ok) throw await toApiError(res);
  return await res.json();
}

// Our own BFF validated and shaped the data; the contract is checked in Task 5
export async function fetchBears(signal: AbortSignal): Promise<Bear[]> {
  const body = (await getJson('/api/bears', signal)) as { items: Bear[] };
  return body.items;
}

export async function fetchBear(
  id: string,
  signal: AbortSignal
): Promise<Bear> {
  return (await getJson(
    `/api/bears/${encodeURIComponent(id)}`,
    signal
  )) as Bear;
}
