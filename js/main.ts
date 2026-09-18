import { initSearch } from "./search";
import { initComments } from "./comments";
import { loadBearData } from "./bears.api";

initSearch();
initComments();
await loadBearData();
