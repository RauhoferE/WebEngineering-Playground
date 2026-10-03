import { type ReactNode, useEffect, useState, type ReactElement } from "react";
import { fetchBears } from "./bears.api";
import { type BearsState } from "./bear-models";
import { BearCard } from "./BearCard";

export function BearList(): ReactElement {
  const [state, setState] = useState<BearsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetchBears(controller.signal)
      .then((bears) => {
        // fetchImageUrl swallows abort errors, so fetchBears can still resolve after abort
        if (controller.signal.aborted) return;
        setState(
          bears.length === 0
            ? { status: "empty" }
            : { status: "success", bears },
        );
      })
      .catch(() => {
        // SHow no error if fetch was aborted
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: "Error: Bears could not be fetched",
        });
      });
    return () => {
      // Reject all pending fetches
      controller.abort();
    };
  }, []);

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
      return state.bears.map((bear) => (
        <BearCard bear={bear} key={`${bear.name}-${bear.binomial}`} />
      ));
  }
}
