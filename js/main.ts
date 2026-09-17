import { initSearch } from "./search";
import { initComments } from "./comments";
import { loadBearData } from "./bears.api";

document.addEventListener("DOMContentLoaded", function () {
  initSearch();
  initComments();
  loadBearData();
});
