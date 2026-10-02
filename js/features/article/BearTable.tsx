import { type ReactElement } from "react";
import { Highlight } from "../search/Highlight";
import { BearTableRow, type BearTableRowProps } from "./BearTableRow";

export function BearTable(): ReactElement {
  const bears: BearTableRowProps[] = [
    {
      type: "Wild",
      coat: "Brown or black",
      adult_size: "1.4 to 2.8 meters",
      habitat: "Woods and forests",
      lifespan: "25 to 28 years",
      diet: "Fish, meat, plants",
    },
    {
      type: "Urban",
      coat: "North Face",
      adult_size: "18 to 22 meters",
      habitat: "Condos and coffe shops",
      lifespan: "20 to 32 years",
      diet: "Starbucks, sushi",
    },
  ];
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
        {bears.map((bear: BearTableRowProps, index: number) => (
          <BearTableRow row={bear} key={index} />
        ))}
      </tbody>
    </table>
  );
}
