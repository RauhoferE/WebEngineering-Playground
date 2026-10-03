import { type ReactNode, type ReactElement } from "react";
import { type BearsState } from "./bear-models";
import { BearCard } from "./BearCard";
import { useBears } from "./useBears";

export function BearList(): ReactElement {
  const state = useBears();

  return (
    <section className="more_bears">
      <span style={{ fontSize: "x-large" }}>More Bears</span>
      {renderContent(state)}
    </section>
  );
}

function renderContent(state: BearsState): ReactNode {
  switch (state.status) {
    case "loading":
      return <p>Loading bears…</p>;
    case "error":
      return <p role="alert">{state.message}</p>;
    case "empty":
      return <p>No bears found.</p>;
    case "success":
      return state.bears.map((bear) => <BearCard bear={bear} key={bear.id} />);
  }
}
