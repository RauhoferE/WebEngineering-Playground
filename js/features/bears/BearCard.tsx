import { type ReactElement } from "react";
import { type Bear } from "../../types";
import { Highlight } from "../search/search";

export function BearCard({ bear }: { bear: Bear }): ReactElement {
  return (
    <div className="bear" key={`${bear.name}-${bear.binomial}`}>
      <img
        src={bear.image}
        alt={`Image of ${bear.name}`}
        style={{ width: "200px", height: "auto" }}
      />
      <p>
        <b>
          <Highlight text={bear.name} />
        </b>{" "}
        (<Highlight text={bear.binomial} />)
      </p>
      <p>
        Range: <Highlight text={bear.range} />
      </p>
    </div>
  );
}
