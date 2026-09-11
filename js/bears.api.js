// Fetching bear data
var baseUrl = "https://en.wikipedia.org/w/api.php";

async function fetchImageUrl(fileName) {
  var imageParams = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  };

  var url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
  try {
    var res = await fetch(url);
    var data = await res.json();
    var pages = data.query.pages;
    var page = Object.values(pages)[0];
    return page.imageinfo[0].url;
  } catch (error) {
    return "./media/placeholder.svg";
  }
}

async function extractBears(wikitext) {
    var rows = wikitext.split("{{Species table/row");
    var bears = [];

    for (const row of rows) {
              var nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
      var binomialMatch = row.match(/\|binomial=(.*?)\n/);
      var imageMatch = row.match(/\|image=(.*?)\n/) ?? "";
      var rangeMatch = row.match(/\|range=(.*?)(?=\||$|\n)/);
      

      if (nameMatch && binomialMatch && rangeMatch) {
        console.log(nameMatch)

        var fileName = imageMatch[1].trim().replace("File:", "");
        var imageUrl = await fetchImageUrl(fileName);
        let bear = {
          name: nameMatch[1],
          binomial: binomialMatch[1],
          image: imageUrl,
          range: rangeMatch[1],
        };
        console.log(bear)
        bears.push(bear);
      }
    }

    console.log("Adding bears")
            var moreBears = document.querySelector(".more_bears");
        bears.forEach((bear)=>{
            var html =
              '<div class="bear">' +
              '<img src="' +
              bear.image +
              '" alt="Image of ' +
              bear.name +
              '" style="width:200px; height:auto;">' +
              "<p><b>" +
              bear.name +
              "</b> (" +
              bear.binomial +
              ")</p>" +
              "<p>Range: " +
              bear.range +
              "</p>" +
              "</div>";
            moreBears.innerHTML += html;
        })
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
        var res = await fetch(baseUrl + "?" + new URLSearchParams(params).toString());
    var data = await res.json();
    await extractBears(data.parse.wikitext["*"]);
  } catch (error) {
    window.alert("Error: Bears could not be fetched");
  }

}
