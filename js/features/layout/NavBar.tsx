import { type ReactElement } from 'react';
import { SearchForm } from '../search/SearchForm';
import { NavLink } from './NavLink';
import { type NavLinkProps } from './nav-link-models';

export function NavBar({ links }: { links: NavLinkProps[] }): ReactElement {
  return (
    <div className="nav">
      <NavLink
        links={links.map((link) => ({ href: link.href, name: link.name }))}
      />

      <SearchForm />
    </div>
  );
}
