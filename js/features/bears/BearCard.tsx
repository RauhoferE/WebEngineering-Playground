import { useState, type ReactElement } from "react";
import { type Bear } from "./bear-models";
import { Highlight } from "../search/Highlight";
import { placeholderImage } from "./bears.api";

export function BearCard({ bear }: { bear: Bear }): ReactElement {
  // Used for if url exists but image cant be loaded
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="bear">
      <img
        src={imageFailed ? placeholderImage : bear.image}
        alt={`Image of ${bear.name}`}
        style={{ width: "200px", height: "auto" }}
        onError={() => {
          setImageFailed(true);
        }}
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
