// Fetching bear data
const baseUrl = "https://en.wikipedia.org/w/api.php";

async function fetchImageUrl(fileName) {
  const imageParams = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  };

  const url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
  try {
    let res = await fetch(url);
    let data = await res.json();
    let pages = data.query.pages;
    let page = Object.values(pages)[0];
    return page.imageinfo[0].url;
  } catch (error) {
    // Return placeholder image just in case
    return "./media/placeholder.svg";
  }
}

async function extractBears(wikitext) {
    let rows = wikitext.split("{{Species table/row");

  const parsedRows = rows
    .map((row) => {
      const nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
      const binomialMatch = row.match(/\|binomial=(.*?)\n/);
      const imageMatch = row.match(/\|image=(.*?)\n/);
      const rangeMatch = row.match(/\|range=(.*?)(?=\||$|\n)/);

      if (!nameMatch || !binomialMatch || !rangeMatch) return null;

      return {
        name: nameMatch[1],
        binomial: binomialMatch[1],
        range: rangeMatch[1],
        fileName: imageMatch ? imageMatch[1].trim().replace("File:", "") : null,
      };
    })
    .filter((row) => row !== null);

  const bears = await Promise.all(parsedRows.map(async (row) => ({
    name: row.name,
    binomial: row.binomial,
    range: row.range,
    image: row.fileName
      ? await fetchImageUrl(row.fileName)
      : "./media/placeholder.svg",
  })));

  return bears;
}

async function createBearElements(bears) {
  let moreBears = document.querySelector(".more_bears");
  const fragment = document.createDocumentFragment();
  bears.forEach((bear) => {
    const bearDiv = document.createElement("div");
    bearDiv.className = "bear";
    const img = document.createElement("img")
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
        })
  moreBears.appendChild(fragment);
}

export async function loadBearData() {
  var params = {
  action: "parse",
  page: "List_of_ursids",
  prop: "wikitext",
  section: 3,
  format: "json",
  origin: "*",
};
  try {
        let res = await fetch(baseUrl + "?" + new URLSearchParams(params).toString());
    let data = await res.json();
    let parsedBears = await extractBears(data.parse.wikitext["*"]);
    console.log(parsedBears);
    await createBearElements(parsedBears);
  } catch (error) {
    window.alert("Error: Bears could not be fetched");
  }

}
