function clearHighlights() {
  document.querySelectorAll(".highlight").forEach(el => {
    const parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    parent.normalize();
  });
}


function highlightText(searchKey) {
  const query = searchKey.trim();
  // If nothing is input then the user clearly wants to clear the hightlights
  if (!query)return;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");

  function walk(node) {
    if (node.nodeType === 3 && node.nodeValue.match(regex)) {
      // Text node
      const span = document.createElement("span");
      const parts = node.nodeValue.split(regex);
      parts.forEach((part) => {
        if (part.toLowerCase() === query.toLowerCase()) {
            // Replace found query with a <mark> element
            const mark = document.createElement("mark");
            mark.className = "highlight";
            mark.textContent = part;
            span.appendChild(mark);
        } else if (part.length > 0) {
          // Replace remaining text with a text node
          span.appendChild(document.createTextNode(part));
          }
        });
      node.replaceWith(span);

    } else if (
      node.nodeType === 1 &&
      node.tagName !== "SCRIPT" &&
      node.tagName !== "STYLE" &&
      node.tagName !== "FORM"
    ) {
      node.childNodes.forEach(walk);
    }
  }

  const articles = document.querySelectorAll("article");
  articles.forEach(article =>{
    walk(article)
  });

}

export function initSearch() {
  const searchForm = document.querySelector(".search");
  if (!searchForm) return;

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearHighlights();
    highlightText(this.q.value);
  });
}
