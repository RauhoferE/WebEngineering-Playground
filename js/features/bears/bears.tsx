import { useEffect, useState, type ReactElement } from "react";
import { fetchBears } from "./bears.api";
import { Highlight } from "../search/search";
import { type Bear } from "../../types";

export function BearList(): ReactElement {
  const [bears, setBears] = useState<Bear[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // StrictMode runs effects twice in dev, and the component can unmount
    // mid-request, so results from a stale run must be ignored
    let ignore = false;
    fetchBears()
      .then((result) => {
        if (!ignore) setBears(result);
      })
      .catch(() => {
        if (!ignore) setError("Error: Bears could not be fetched");
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="more_bears">
      <span style={{ fontSize: "x-large" }}>More Bears</span>
      {error !== null && <p>{error}</p>}
      {bears.map((bear) => (
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
      ))}
    </section>
  );
}
