import { UpstreamError } from '../schemas/errors.js';
import { parseBears, type ParsedBear, slugify } from './bear-parser.js';
import { fetchBearsWikitext, fetchImageUrls } from '../upstream/wikipedia.js';
import { Bear } from '../schemas/bear.js';
import type { Env } from '../schemas/env.js';
import { z } from 'zod';

interface WarnLogger {
  warn: (obj: object, msg: string) => void;
}

export async function fetchBearsFromWikipedia(
  env: Env,
  log: WarnLogger
): Promise<Bear[]> {
  // the current list() body, unchanged: parse, image lookup, zod validation,
  // "zero bears = UpstreamError"
  const parsed = parseBears(await fetchBearsWikitext(env));
  // Zero bears means the page changed: an upstream problem, never an empty 200
  if (parsed.length === 0) {
    throw new UpstreamError('no bears found in wikitext');
  }

  const images = await imageUrls(parsed, env, log);
  const result = z.array(Bear).safeParse(
    parsed.map((b) => ({
      id: slugify(b.binomial),
      name: b.name,
      binomial: b.binomial,
      range: b.range,
      imageUrl: b.fileName === null ? null : (images.get(b.fileName) ?? null),
    }))
  );
  if (!result.success) {
    throw new UpstreamError('parsed bears are invalid', {
      cause: result.error,
    });
  }
  return result.data;
}

async function imageUrls(
  bears: ParsedBear[],
  env: Env,
  log: WarnLogger
): Promise<Map<string, string>> {
  try {
    return await fetchImageUrls(
      env,
      bears.flatMap((b) => (b.fileName === null ? [] : [b.fileName]))
    );
  } catch (err) {
    log.warn({ err }, 'image lookup failed, continuing without images');
    return new Map();
  }
}
