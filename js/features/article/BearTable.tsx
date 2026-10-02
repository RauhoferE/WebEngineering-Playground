import { type ReactElement } from "react";
import { Highlight } from "../search/Highlight";

export function BearTable(): ReactElement {
  return (
    <table>
      <thead>
        <tr>
          <td>
            <Highlight text="Bear Type" />
          </td>
          <td>
            <Highlight text="Coat" />
          </td>
          <td>
            <Highlight text="Adult size" />
          </td>
          <td>
            <Highlight text="Habitat" />
          </td>
          <td>
            <Highlight text="Lifespan" />
          </td>
          <td>
            <Highlight text="Diet" />
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <Highlight text="Wild" />
          </td>
          <td>
            <Highlight text="Brown or black" />
          </td>
          <td>
            <Highlight text="1.4 to 2.8 meters" />
          </td>
          <td>
            <Highlight text="Woods and forests" />
          </td>
          <td>
            <Highlight text="25 to 28 years" />
          </td>
          <td>
            <Highlight text="Fish, meat, plants" />
          </td>
        </tr>
        <tr>
          <td>
            <Highlight text="Urban" />
          </td>
          <td>
            <Highlight text="North Face" />
          </td>
          <td>
            <Highlight text="18 to 22" />
          </td>
          <td>
            <Highlight text="Condos and coffee shops" />
          </td>
          <td>
            <Highlight text="20 to 32 years" />
          </td>
          <td>
            <Highlight text="Starbucks, sushi" />
          </td>
        </tr>
      </tbody>
    </table>
  );
}
