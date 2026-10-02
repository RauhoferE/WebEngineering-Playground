import { type ReactElement } from "react";
import { SearchForm } from "../search/SearchForm";
import { NavLink } from "./NavLink";

export function NavBar({ links }: { links: string[] }): ReactElement {
  return (
    <div className="nav">
      <NavLink links={links.map((link) => ({ href: link, name: link }))} />

      <SearchForm />
    </div>
  );
}
