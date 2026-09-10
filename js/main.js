import { initSearch } from './search.js';
import { initComments } from './comments.js';
import { loadBearData } from './bears.api.js';

document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  initComments();
  loadBearData();
});