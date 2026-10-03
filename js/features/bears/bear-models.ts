export interface Bear {
  id: string;
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

export type BearsState =
  | { status: "loading" }
  | { status: "success"; bears: Bear[] }
  | { status: "empty" }
  | { status: "error"; message: string };
