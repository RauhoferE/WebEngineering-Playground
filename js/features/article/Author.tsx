import { type ReactElement } from "react";
import { Highlight } from "../search/Highlight";

export function Author(): ReactElement {
  return (
    <aside>
      <span style={{ fontSize: "x-large" }}>
        <Highlight text="About the author" />
      </span>
      <br />
      <br />
      <Highlight text="Evan Wild is an unemployed plumber from Doncaster..." />
    </aside>
  );
}
