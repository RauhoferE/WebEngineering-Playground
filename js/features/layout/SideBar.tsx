import { type ReactElement } from 'react';
import { NavLink } from './NavLink';

export function SideBar({ links }: { links: string[] }): ReactElement {
  return (
    <section className="secondary" aria-labelledby="related-heading">
      <h2 id="related-heading" style={{ fontSize: 'xx-large' }}>
        Related
      </h2>
      <NavLink links={links.map((link) => ({ href: '#', name: link }))} />
    </section>
  );
}
