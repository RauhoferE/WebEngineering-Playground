import { type Bear, type ParsedBear } from "./types";
import { isImageQueryResponse, isWikitextResponse } from "./validation";

// Fetching bear data
const baseUrl = "https://en.wikipedia.org/w/api.php";

async function fetchImageUrl(fileName: string): Promise<string> {
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
    const res = await fetch(url);
    const data: unknown = await res.json();
    if (!isImageQueryResponse(data)) {
      return "/media/placeholder.svg";
    }
    const pages = data.query.pages;
    const page = Object.values(pages)[0];
    return page?.imageinfo?.[0]?.url ?? "/media/placeholder.svg";
  } catch (error) {
    // Return placeholder image just in case
    return "/media/placeholder.svg";
  }
}

async function extractBears(wikitext: string): Promise<Bear[]> {
  const rows = wikitext.split("{{Species table/row");

  const parsedRows = rows
    .map((row): ParsedBear | null => {
      const nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
      const binomialMatch = row.match(/\|binomial=(.*?)\n/);
      const imageMatch = row.match(/\|image=(.*?)\n/);
      const rangeMatch = row.match(/\|range=(.*?)(?=\||$|\n)/);

      if (nameMatch == null || binomialMatch == null || rangeMatch == null)
        return null;

      if (
        nameMatch[1] == null ||
        nameMatch[1] == null ||
        binomialMatch[1] == null ||
        rangeMatch[1] == null
      ) {
        return null;
      }

      let fileName: string | null = null;

      if (imageMatch?.[1] != null) {
        fileName = imageMatch[1].trim().replace("File:", "");
      }

      return {
        name: nameMatch[1],
        binomial: binomialMatch[1],
        range: rangeMatch[1],
        fileName,
      } satisfies ParsedBear;
    })
    .filter((row) => row !== null);

  const bears: Bear[] = await Promise.all(
    parsedRows.map(async (row) => ({
      name: row.name,
      binomial: row.binomial,
      range: row.range,
      image:
        row.fileName != null
          ? await fetchImageUrl(row.fileName)
          : "/media/placeholder.svg",
    })),
  );

  return bears;
}

async function createBearElements(bears: Bear[]): Promise<void> {
  const moreBears = document.querySelector(".more_bears");
  if (moreBears == null) {
    return;
  }

  const fragment = document.createDocumentFragment();
  bears.forEach((bear) => {
    const bearDiv = document.createElement("div");
    bearDiv.className = "bear";
    const img = document.createElement("img");
    img.src = bear.image;
    img.alt = `Image of ${bear.name}`;
    img.style.width = "200px";
    img.style.height = "auto";

    const namePara = document.createElement("p");
    const nameBold = document.createElement("b");
    nameBold.textContent = bear.name;
    namePara.appendChild(nameBold);
    namePara.append(` (${bear.binomial})`);

    const rangePara = document.createElement("p");
    rangePara.textContent = `Range: ${bear.range}`;

    bearDiv.append(img, namePara, rangePara);
    fragment.appendChild(bearDiv);
  });
  moreBears.appendChild(fragment);
}

export async function loadBearData(): Promise<void> {
  const params: Record<string, string> = {
    action: "parse",
    page: "List_of_ursids",
    prop: "wikitext",
    section: "3",
    format: "json",
    origin: "*",
  };
  try {
    const res = await fetch(
      baseUrl + "?" + new URLSearchParams(params).toString(),
    );
    const data: unknown = await res.json();
    if (!isWikitextResponse(data)) {
      window.alert("Error: Bears could not be fetched");
      return;
    }
    const parsedBears = await extractBears(data.parse.wikitext["*"]);
    console.log(parsedBears);
    await createBearElements(parsedBears);
  } catch (error) {
    window.alert("Error: Bears could not be fetched");
  }
}
