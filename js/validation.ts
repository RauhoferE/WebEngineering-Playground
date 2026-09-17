import { ImageInfo, ImageQueryResponse, WikiPage, WikitextResponse } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isImageInfo(value: unknown): value is ImageInfo {
  return isRecord(value) && typeof value.url === "string";
}

function isWikiPage(value: unknown): value is WikiPage {
  if (!isRecord(value)) return false;
  if (value.imageinfo === undefined) return true;
  return Array.isArray(value.imageinfo) && value.imageinfo.every(isImageInfo);
}

export function isImageQueryResponse(value: unknown): value is ImageQueryResponse {
  if (!isRecord(value) || !isRecord(value.query) || !isRecord(value.query.pages)) {
    return false;
  }
  return Object.values(value.query.pages).every(isWikiPage);
}

export function isWikitextResponse(value: unknown): value is WikitextResponse {
  if (!isRecord(value) || !isRecord(value.parse) || !isRecord(value.parse.wikitext)) {
    return false;
  }
  return typeof value.parse.wikitext["*"] === "string";
}