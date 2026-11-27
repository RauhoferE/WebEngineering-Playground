import pg from 'pg';
import { setTimeout as sleep } from 'node:timers/promises';
import { createDb } from './db/client.js';
import { loadEnv } from './schemas/env.js';
import { JobQueue } from './jobs/queue.js';
import { fetchBearsFromWikipedia } from './services/bear-source.js';
import { DrizzleBearRepository } from './repositories/drizlle/bear-repository.js';

const env = loadEnv();
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 2 });
// Without a listener, an idle client dying (e.g. db restart) crashes the process
pool.on('error', (err) => {
  console.error('idle database client failed', err);
});
const db = createDb(pool);
const queue = new JobQueue(db);

// SIGTERM / Ctrl+C: finish the current job, then exit. kill -9 is the crash case
const stop = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    stop.abort();
  });
}

let lastMaintenance = 0;
console.log('worker started');
while (!stop.signal.aborted) {
  // Every minute, and right after a start: release stale jobs, keep the next refresh queued
  if (Date.now() - lastMaintenance >= 60_000) {
    await queue.releaseStale(env.JOB_VISIBILITY_TIMEOUT_SECONDS);
    await queue.ensureNightlyRefresh();
    lastMaintenance = Date.now();
  }

  const job = await queue.claimNext();
  if (job === null) {
    await sleep(1000);
    continue;
  }
  console.log(`job ${job.id} ${job.type} attempt ${job.attempts}`);

  try {
    if (job.type !== 'refresh-bears') {
      throw new Error(`no handler for job type "${job.type}"`);
    }
    await sleep(env.WORKER_DEMO_DELAY_MS); // 0 unless you demo the crash
    // Outside the transaction: no connection is held during the HTTP call
    const bears = await fetchBearsFromWikipedia(env, console);
    await db.transaction(async (tx) => {
      // Upsert: running it twice changes nothing. Its NOTIFY drops the API caches on COMMIT
      await new DrizzleBearRepository(tx).upsertMany(bears);
      await queue.markDone(tx, job.id);
    });
    console.log(`job ${job.id} done (${bears.length} bears)`);
  } catch (err) {
    await queue.markFailed(
      job.id,
      err instanceof Error ? err.message : String(err)
    );
    console.error(`job ${job.id} failed`, err);
  }
}

await pool.end();
console.log('worker stopped');
