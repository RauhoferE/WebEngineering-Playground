import { and, asc, eq, inArray, lt, lte, sql } from 'drizzle-orm';
import type { Db, Executor } from '../db/client.js';
import { jobs } from '../db/schema.js';

const MAX_ATTEMPTS = 3;

export class JobQueue {
  constructor(private readonly db: Db) {}

  // FOR UPDATE: two workers can't claim the same job.
  // SKIP LOCKED: a second worker jumps over rows the first one holds instead of waiting
  async claimNext(): Promise<{
    id: number;
    type: string;
    attempts: number;
  } | null> {
    const next = this.db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.status, 'queued'), lte(jobs.runAt, sql`now()`)))
      .orderBy(asc(jobs.runAt))
      .limit(1)
      .for('update', { skipLocked: true });
    const [job] = await this.db
      .update(jobs)
      .set({
        status: 'running',
        lockedAt: sql`now()`,
        attempts: sql`${jobs.attempts} + 1`,
      })
      .where(inArray(jobs.id, next))
      .returning({ id: jobs.id, type: jobs.type, attempts: jobs.attempts });
    return job ?? null;
  }

  // Takes the handler's transaction: the upsert and "done" commit together
  async markDone(tx: Executor, id: number): Promise<void> {
    await tx
      .update(jobs)
      .set({ status: 'done', lockedAt: null })
      .where(eq(jobs.id, id));
  }

  // Backoff 10 s × 2^attempts ±10 % jitter (20 s, 40 s), dead after the 3rd failure
  async markFailed(id: number, error: string): Promise<void> {
    await this.db
      .update(jobs)
      .set({
        status: sql`CASE WHEN ${jobs.attempts} >= ${MAX_ATTEMPTS} THEN 'dead' ELSE 'queued' END`,
        runAt: sql`now() + make_interval(secs => 10 * power(2, ${jobs.attempts}) * (0.9 + random() * 0.2))`,
        lockedAt: null,
        lastError: error,
      })
      .where(eq(jobs.id, id));
  }

  // Visibility timeout: a running job whose lease is too old belongs to a dead worker
  async releaseStale(timeoutSeconds: number): Promise<void> {
    await this.db
      .update(jobs)
      .set({ status: 'queued', lockedAt: null })
      .where(
        and(
          eq(jobs.status, 'running'),
          lt(
            jobs.lockedAt,
            sql`now() - make_interval(secs => ${timeoutSeconds})`
          )
        )
      );
  }

  // Keeps one refresh in the queue: after a run (done or dead) the next one is tomorrow 03:00 UTC
  async ensureNightlyRefresh(): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO jobs (type, payload, run_at)
      SELECT 'refresh-bears', '{}'::jsonb, date_trunc('day', now()) + interval '1 day 3 hours'
      WHERE NOT EXISTS (
        SELECT 1 FROM jobs WHERE type = 'refresh-bears' AND status IN ('queued', 'running')
      )`);
  }
}
