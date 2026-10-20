export interface ParsedBear {
  name: string;
  binomial: string;
  fileName: string | null;
  range: string;
}

// "U. arctos" -> "u-arctos" (must match the BearId regex)
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseBears(wikitext: string): ParsedBear[] {
  const rows = wikitext.split('{{Species table/row');

  return rows
    .map((row): ParsedBear | null => {
      const nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
      const binomialMatch = row.match(/\|binomial=(.*?)\n/);
      // Stop before the next "|field=" on the same line
      const imageMatch = row.match(/\|image=(.*?)(?=\s*\||\n)/);
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
          ? imageMatch[1].trim().replace('File:', '')
          : null;

      return {
        name: nameMatch[1],
        binomial: binomialMatch[1],
        range: rangeMatch[1],
        fileName,
      };
    })
    .filter((row) => row !== null);
}
