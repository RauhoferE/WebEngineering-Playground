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
