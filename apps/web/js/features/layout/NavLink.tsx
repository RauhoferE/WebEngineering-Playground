import { type ReactElement } from 'react';
import { Link, NavLink as RouterNavLink } from 'react-router';
import { type NavLinkProps } from './nav-link-models';

export function NavLink({
  links,
  markCurrent = false,
}: {
  links: NavLinkProps[];
  // Router's NavLink sets aria-current="page" on the active link
  markCurrent?: boolean;
}): ReactElement {
  return (
    <ul>
      {links.map((link) => (
        <li key={link.name}>
          {markCurrent ? (
            <RouterNavLink to={link.href} end>
              {link.name}
            </RouterNavLink>
          ) : (
            <Link to={link.href}>{link.name}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}
