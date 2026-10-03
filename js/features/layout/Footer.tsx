import { type ReactElement } from 'react';

export function Footer({ text }: { text: string }): ReactElement {
  return (
    <footer>
      <p>{text}</p>
    </footer>
  );
}
