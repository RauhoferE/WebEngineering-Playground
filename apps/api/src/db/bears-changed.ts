import pg from 'pg';
import type { FastifyBaseLogger } from 'fastify';

export const BEARS_CHANGED = 'bears_changed';

// A dedicated connection, not from the pool: LISTEN must hold it for the whole lifetime.
// A NOTIFY from any process (API refresh, seed script, the Task 4 worker) reaches every API instance.
export function listenForBearChanges(
  url: string,
  onChange: () => void,
  log: FastifyBaseLogger
): pg.Client {
  const client = new pg.Client({ connectionString: url });
  client.on('notification', onChange);
  // No reconnect: if the connection drops, the 60 s TTL is the safety net
  client.on('error', (err) => {
    log.error({ err }, 'bears_changed listener failed');
  });
  void client
    .connect()
    .then(async () => await client.query(`LISTEN ${BEARS_CHANGED}`))
    .catch((err: unknown) => {
      log.error({ err }, 'LISTEN bears_changed failed');
    });
  return client;
}
