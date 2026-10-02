import { type ReactElement } from "react";

export function Header({ title }: { title: string }): ReactElement {
  return (
    <div className="header">
      <span style={{ fontSize: "xxx-large" }}>{title}</span>
    </div>
  );
}
