import type { Repos } from './repos.js';

// Runs `work` in one transaction; the repos passed in are bound to that transaction
export interface UnitOfWork {
  run: <T>(work: (repos: Repos) => Promise<T>) => Promise<T>;
}
