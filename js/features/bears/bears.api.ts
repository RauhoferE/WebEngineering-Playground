import { type Bear, type ParsedBear } from "./bear-models";
import { isImageQueryResponse, isWikitextResponse } from "./validation";

const baseUrl = "https://en.wikipedia.org/w/api.php";
export const placeholderImage = "/media/placeholder.svg";

async function fetchImageUrl(
  fileName: string,
  signal: AbortSignal,
): Promise<string> {
  const imageParams: Record<string, string> = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  };

  const url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
  try {
    // Abort signal ensuring that slow, outdated API responses don't accidentally overwrite newer data
    const res = await fetch(url, { signal });
    if (!res.ok) {
      return placeholderImage;
    }
    const data: unknown = await res.json();
    if (!isImageQueryResponse(data)) {
      return placeholderImage;
    }
    const page = Object.values(data.query.pages)[0];
    return page?.imageinfo?.[0]?.url ?? placeholderImage;
  } catch (error) {
    return placeholderImage;
  }
}

async function extractBears(
  wikitext: string,
  signal: AbortSignal,
): Promise<Bear[]> {
  const rows = wikitext.split("{{Species table/row");

  const parsedRows = rows
    .map((row): ParsedBear | null => {
      const nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
      const binomialMatch = row.match(/\|binomial=(.*?)\n/);
      const imageMatch = row.match(/\|image=(.*?)\n/);
      const rangeMatch = row.match(/\|range=(.*?)(?=\||$|\n)/);

      if (
        nameMatch?.[1] == null ||
        binomialMatch?.[1] == null ||
        rangeMatch?.[1] == null
      ) {
        return null;
      }

      const fileName =
        imageMatch?.[1] != null
          ? imageMatch[1].trim().replace("File:", "")
          : null;

      return {
        name: nameMatch[1],
        binomial: binomialMatch[1],
        range: rangeMatch[1],
        fileName,
      };
    })
    .filter((row) => row !== null);

  // Promise.all keeps the order of parsedRows, whichever image resolves first
  return await Promise.all(
    parsedRows.map(async (row) => ({
      name: row.name,
      binomial: row.binomial,
      range: row.range,
      image:
        row.fileName != null
          ? await fetchImageUrl(row.fileName, signal)
          : placeholderImage,
    })),
  );
}

// Throws if the request fails or the response has an unexpected shape
export async function fetchBears(signal: AbortSignal): Promise<Bear[]> {
  const params: Record<string, string> = {
    action: "parse",
    page: "List_of_ursids",
    prop: "wikitext",
    section: "3",
    format: "json",
    origin: "*",
  };
  const res = await fetch(
    baseUrl + "?" + new URLSearchParams(params).toString(),
    { signal },
  );
  if (!res.ok) {
    throw new Error(`Wikipedia request failed with status ${res.status}`);
  }
  const data: unknown = await res.json();
  if (!isWikitextResponse(data)) {
    throw new Error("Unexpected response shape from the Wikipedia API");
  }
  return await extractBears(data.parse.wikitext["*"], signal);
}
