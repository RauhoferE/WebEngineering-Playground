import { type ReactElement } from "react";
import { NavLink } from "./NavLink";

export function SideBar({ links }: { links: string[] }): ReactElement {
  return (
    <div className="secondary">
      <span style={{ fontSize: "xx-large" }}>Related</span>
      <NavLink links={links.map((link) => ({ href: "#", name: link }))} />
    </div>
  );
}
