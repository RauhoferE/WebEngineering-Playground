export interface Bear {
  name: string;
  binomial: string;
  image: string;
  range: string;
}

export interface ParsedBear {
  name: string;
  binomial: string;
  fileName: string | null;
  range: string;
}

export interface ImageInfo {
  url: string;
}

export interface WikiPage {
  imageinfo?: ImageInfo[];
}

export interface ImageQueryResponse {
  query: {
    pages: Record<string, WikiPage>;
  };
}

export interface WikitextResponse {
  parse: {
    wikitext: {
      "*": string;
    };
  };
}