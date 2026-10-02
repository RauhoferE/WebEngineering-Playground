import { type ReactElement } from "react";

export function SideBar(): ReactElement {
  return (
    <div className="secondary">
      <span style={{ fontSize: "xx-large" }}>Related</span>
      <ul>
        <li>
          <a href="#">The trouble with Bees</a>
        </li>
        <li>
          <a href="#">The trouble with Otters</a>
        </li>
        <li>
          <a href="#">The trouble with Penguins</a>
        </li>
        <li>
          <a href="#">The trouble with Octopi</a>
        </li>
        <li>
          <a href="#">The trouble with Lemurs</a>
        </li>
      </ul>
    </div>
  );
}
