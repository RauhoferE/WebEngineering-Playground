export interface Bear {
  id: string;
  name: string;
  binomial: string;
  imageUrl: string | null;
  range: string;
}

export type BearsState =
  | { status: 'loading' }
  | { status: 'success'; bears: Bear[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export type BearState =
  | { status: 'loading' }
  | { status: 'success'; bear: Bear }
  | { status: 'notFound' }
  | { status: 'error'; message: string };
