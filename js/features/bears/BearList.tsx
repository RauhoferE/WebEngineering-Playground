import { useEffect, useState, type ReactElement } from "react";
import { fetchBears } from "./bears.api";
import { type Bear } from "./bear-models";
import { BearCard } from "./BearCard";

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
      {bears.map((bear, index) => (
        <BearCard bear={bear} key={index} />
      ))}
    </section>
  );
}
