import { type ReactElement } from 'react';

export function Header({ title }: { title: string }): ReactElement {
  return (
    <header className="header">
      <h1 style={{ fontSize: 'xxx-large' }}>{title}</h1>
    </header>
  );
}
