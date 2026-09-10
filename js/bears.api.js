// Fetching bear data
var baseUrl = "https://en.wikipedia.org/w/api.php";
var title = "List_of_ursids";

var params = {
  action: "parse",
  page: title,
  prop: "wikitext",
  section: 3,
  format: "json",
  origin: "*",
};

export function fetchImageUrl(fileName) {
  var imageParams = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  };

  var url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
  return fetch(url)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      var pages = data.query.pages;
      var page = Object.values(pages)[0];
      return page.imageinfo[0].url;
    });
}

export function extractBears(wikitext) {
    var rows = wikitext.split("{{Species table/row");
    var bears = [];
    var imagePromises = [];
    rows.forEach(function (row) {
      var nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
      var binomialMatch = row.match(/\|binomial=(.*?)\n/);
      var imageMatch = row.match(/\|image=(.*?)\n/);
      var rangeMatch = row.match(/\|range=(.*?)(?=\||$|\n)/);
      

      if (nameMatch && binomialMatch && imageMatch && rangeMatch) {
        console.log(nameMatch)
        let bear = {
          name: nameMatch[1],
          binomial: binomialMatch[1],
          image: "./media/placeholder.svg",
          range: rangeMatch[1],
        };
        bears.push(bear);
        var fileName = imageMatch[1].trim().replace("File:", "");
        var imagePromise = fetchImageUrl(fileName).then(function (imageUrl) {
        bear.image = imageUrl;
        });
        imagePromises.push(imagePromise)
      }
    });

    Promise.all(imagePromises).then(function(){
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
            

    })
}

export function loadBearData() {
  fetch(baseUrl + "?" + new URLSearchParams(params).toString())
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      extractBears(data.parse.wikitext["*"]);
    });
}
