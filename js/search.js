function clearHighlights() {
  document.querySelectorAll(".highlight").forEach(el => {
    var parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    parent.normalize();
  });
}


function highlightText(searchKey) {
  clearHighlights();
  var query = searchKey.trim();
  // If nothing is input then the user clearly wants to clear the hightlights
  if (!query)return;

  var regex = new RegExp(
    "(" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
    "gi",
  );

  function walk(node) {
    if (node.nodeType === 3) {
      // Text node
      var match = node.nodeValue.match(regex);
      if (match) {
        var span = document.createElement("span");
        span.innerHTML = node.nodeValue.replace(
          regex,
          '<mark class="highlight">$1</mark>',
        );
        node.replaceWith.apply(node, span.childNodes);
      }
    } else if (
      node.nodeType === 1 &&
      node.tagName !== "SCRIPT" &&
      node.tagName !== "STYLE" &&
      node.tagName !== "FORM"
    ) {
      node.childNodes.forEach(walk);
    }
  }

  var articles = document.querySelectorAll("article");
  articles.forEach(article =>{
    walk(article)
  });
  
}

export function initSearch() {
  var searchForm = document.querySelector(".search");
  if (!searchForm) return;

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    highlightText(this.q.value);
  });
}
