import { type ReactElement } from 'react';
import { Link } from 'react-router';
import { type NavLinkProps } from './nav-link-models';

export function NavLink({ links }: { links: NavLinkProps[] }): ReactElement {
  return (
    <ul>
      {links.map((link, index) => (
        <li key={index}>
          <Link to={link.href}>{link.name}</Link>
        </li>
      ))}
    </ul>
  );
}
