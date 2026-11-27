import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import type { Bear } from '../schemas/bear.js';
import { MemoryBearRepository } from '../repositories/memory/bear-repository.js';
import { cacheLoads } from '../plugins/metrics.js';
import { BearService } from './bear-service.js';

const brownBear = (): Bear => ({
  id: 'u-arctos',
  name: 'Brown bear',
  binomial: 'U. arctos',
  imageUrl: null,
  range: 'Eurasia',
});

// Slow on purpose: all 50 calls must arrive while the first load is still running
class CountingRepo extends MemoryBearRepository {
  listCalls = 0;

  override async list(filter: { q?: string }): Promise<Bear[]> {
    this.listCalls++;
    await sleep(20);
    return await super.list(filter);
  }
}

interface Setup {
  repo: CountingRepo;
  wiki: { calls: number };
  service: BearService;
}

// The fake Wikipedia returns the brown bear with a changed range,
// so a test can see whether a list comes from the old or the refreshed data
function setup(): Setup {
  const repo = new CountingRepo([brownBear()]);
  const wiki = { calls: 0 };
  const service = new BearService(repo, async () => {
    wiki.calls++;
    await sleep(20);
    return [{ ...brownBear(), range: 'Eurasia and North America' }];
  });
  return { repo, wiki, service };
}

const fifty = async <T>(fn: () => Promise<T>): Promise<T[]> =>
  await Promise.all(Array.from({ length: 50 }, fn));

// prom-client counters are global per process, so tests compare deltas
async function loadsOf(cache: string): Promise<number> {
  const metric = await cacheLoads.get();
  return metric.values.find((v) => v.labels.cache === cache)?.value ?? 0;
}

await test('50 parallel cold list calls cause exactly one query', async () => {
  const { repo, service } = setup();
  const loadsBefore = await loadsOf('bears_list');

  const results = await fifty(async () => await service.list({ q: undefined }));

  assert.equal(results.length, 50);
  assert.ok(results.every((r) => r.length === 1));
  assert.equal(repo.listCalls, 1);
  // The same proof as /metrics shows it
  assert.equal((await loadsOf('bears_list')) - loadsBefore, 1);
});

await test('a repeated call is a hit; q is part of the key, case-insensitive', async () => {
  const { repo, service } = setup();

  await service.list({ q: 'Brown' });
  await service.list({ q: 'brown' });
  assert.equal(repo.listCalls, 1);

  await service.list({ q: 'polar' });
  assert.equal(repo.listCalls, 2);
});

await test('refresh invalidates the cached lists and the next list is fresh', async () => {
  const { repo, service } = setup();

  const before = await service.list({ q: undefined });
  assert.equal(before[0]?.range, 'Eurasia');

  assert.equal(await service.refresh(), 1);

  const after = await service.list({ q: undefined });
  assert.equal(repo.listCalls, 2);
  assert.equal(after[0]?.range, 'Eurasia and North America');
});

await test('invalidate() alone (what NOTIFY triggers) makes the next list a miss', async () => {
  const { repo, service } = setup();

  await service.list({ q: undefined });
  service.invalidate();
  await service.list({ q: undefined });

  assert.equal(repo.listCalls, 2);
});

await test('50 parallel refreshes cause exactly one Wikipedia call', async () => {
  const { wiki, service } = setup();
  const loadsBefore = await loadsOf('wikipedia');

  await fifty(async () => await service.refresh());

  assert.equal(wiki.calls, 1);
  assert.equal((await loadsOf('wikipedia')) - loadsBefore, 1);
});

await test('a second refresh within the TTL reuses the Wikipedia copy', async () => {
  const { wiki, service } = setup();

  await service.refresh();
  await service.refresh();

  assert.equal(wiki.calls, 1);
});

await test('a failed load caches nothing; every waiter gets the error', async () => {
  let calls = 0;
  const service = new BearService(new MemoryBearRepository([]), async () => {
    calls++;
    await sleep(20);
    throw new Error('wikipedia down');
  });

  // 10 parallel waiters share the one failing load
  const results = await Promise.allSettled(
    Array.from({ length: 10 }, async () => await service.refresh())
  );
  assert.ok(results.every((r) => r.status === 'rejected'));
  assert.equal(calls, 1);

  // Nothing was stored, so the next refresh tries again
  await assert.rejects(service.refresh(), /wikipedia down/);
  assert.equal(calls, 2);
});
