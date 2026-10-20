import { z } from 'zod';
import type { Env } from '../schemas/env.js';
import { UpstreamError, UpstreamTimeoutError } from '../schemas/errors.js';

const WikiParse = z.object({ parse: z.object({ wikitext: z.string() }) });

const ImageQuery = z.object({
  query: z.object({
    normalized: z
      .array(z.object({ from: z.string(), to: z.string() }))
      .optional(),
    pages: z.array(
      z.object({
        title: z.string(),
        imageinfo: z.array(z.object({ thumburl: z.url() })).optional(),
      })
    ),
  }),
});

async function getJson(
  env: Env,
  params: Record<string, string>
): Promise<unknown> {
  const url = new URL('/w/api.php', env.WIKIPEDIA_BASE_URL);
  url.search = new URLSearchParams({
    ...params,
    format: 'json',
    formatversion: '2',
  }).toString();

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': env.USER_AGENT },
      signal: AbortSignal.timeout(env.UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new UpstreamTimeoutError('wikipedia timed out', { cause: err });
    }
    throw new UpstreamError('wikipedia unreachable', { cause: err });
  }
  if (!res.ok) throw new UpstreamError(`wikipedia answered ${res.status}`);
  try {
    return await res.json();
  } catch (err) {
    throw new UpstreamError('wikipedia sent invalid JSON', { cause: err });
  }
}

export async function fetchBearsWikitext(env: Env): Promise<string> {
  const body = WikiParse.safeParse(
    await getJson(env, {
      action: 'parse',
      page: 'List_of_ursids',
      prop: 'wikitext',
      section: '3',
    })
  );
  if (!body.success) {
    throw new UpstreamError('unexpected wikitext shape', { cause: body.error });
  }
  return body.data.parse.wikitext;
}

// One request for all images instead of one per bear (aggregation in the BFF)
export async function fetchImageUrls(
  env: Env,
  fileNames: string[]
): Promise<Map<string, string>> {
  if (fileNames.length === 0) return new Map();
  const titles = fileNames.map((name) => `File:${name}`);
  const body = ImageQuery.safeParse(
    await getJson(env, {
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '400',
      titles: titles.join('|'),
    })
  );
  if (!body.success) {
    throw new UpstreamError('unexpected imageinfo shape', {
      cause: body.error,
    });
  }

  // Wikipedia may rename titles (e.g. underscores), "normalized" maps them back
  const { normalized = [], pages } = body.data.query;
  const urls = new Map<string, string>();
  for (const title of titles) {
    const actual = normalized.find((n) => n.from === title)?.to ?? title;
    const url = pages.find((p) => p.title === actual)?.imageinfo?.[0]?.thumburl;
    if (url !== undefined) urls.set(title.slice('File:'.length), url);
  }
  return urls;
}
