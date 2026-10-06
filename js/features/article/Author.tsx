import { type ReactElement } from 'react';
import { Highlight } from '../search/Highlight';

export function Author(): ReactElement {
  return (
    <aside aria-labelledby="author-heading">
      <h2 id="author-heading" style={{ fontSize: 'x-large' }}>
        <Highlight text="About the author" />
      </h2>
      <p>
        <Highlight text="Evan Wild is an unemployed plumber from Doncaster..." />
      </p>
    </aside>
  );
}
