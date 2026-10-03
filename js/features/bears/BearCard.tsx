import { type ReactElement } from "react";
import { type Bear } from "./bear-models";
import { Highlight } from "../search/Highlight";
import { BearImage } from "./BearImage";

export function BearCard({ bear }: { bear: Bear }): ReactElement {
  return (
    <div className="bear">
      <BearImage bear={bear} width="200px" />
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
