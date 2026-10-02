import { type ReactElement } from "react";

interface NavLinkProps {
  href: string;
  name: string;
}
export function NavLink({ links }: { links: NavLinkProps[] }): ReactElement {
  return (
    <ul>
      {links.map((link, index) => (
        <li key={index}>
          <a href={link.href}>{link.name}</a>
        </li>
      ))}
    </ul>
  );
}
