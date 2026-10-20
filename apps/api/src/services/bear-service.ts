import type { FastifyBaseLogger } from 'fastify';
import { z } from 'zod';
import type { Env } from '../schemas/env.js';
import { Bear } from '../schemas/bear.js';
import { NotFoundError, UpstreamError } from '../errors.js';
import { fetchBearsWikitext, fetchImageUrls } from '../upstream/wikipedia.js';
import { type ParsedBear, parseBears, slugify } from './bear-parser.js';

export class BearService {
  constructor(
    private readonly env: Env,
    private readonly log: FastifyBaseLogger
  ) {}

  async list(): Promise<Bear[]> {
    const parsed = parseBears(await fetchBearsWikitext(this.env));
    // Zero bears means the page changed: an upstream problem, never an empty 200
    if (parsed.length === 0) {
      throw new UpstreamError('no bears found in wikitext');
    }

    const images = await this.imageUrls(parsed);
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

  async get(id: string): Promise<Bear> {
    const bear = (await this.list()).find((b) => b.id === id);
    if (bear === undefined) throw new NotFoundError(`No bear with id "${id}"`);
    return bear;
  }

  // Images are optional: if they fail, the bears are still shown with a placeholder
  private async imageUrls(bears: ParsedBear[]): Promise<Map<string, string>> {
    try {
      return await fetchImageUrls(
        this.env,
        bears.flatMap((b) => (b.fileName === null ? [] : [b.fileName]))
      );
    } catch (err) {
      this.log.warn({ err }, 'image lookup failed, continuing without images');
      return new Map();
    }
  }
}
