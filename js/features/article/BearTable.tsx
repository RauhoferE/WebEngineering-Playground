import { type ReactElement } from 'react';
import { Highlight } from '../search/Highlight';
import { BearTableRow, type BearTableRowProps } from './BearTableRow';

export function BearTable(): ReactElement {
  const bears: BearTableRowProps[] = [
    {
      type: 'Wild',
      coat: 'Brown or black',
      adult_size: '1.4 to 2.8 meters',
      habitat: 'Woods and forests',
      lifespan: '25 to 28 years',
      diet: 'Fish, meat, plants',
    },
    {
      type: 'Urban',
      coat: 'North Face',
      adult_size: '18 to 22 meters',
      habitat: 'Condos and coffe shops',
      lifespan: '20 to 32 years',
      diet: 'Starbucks, sushi',
    },
  ];
  return (
    <table>
      <caption className="sr-only">Types of bear</caption>
      <thead>
        <tr>
          <th scope="col">
            <Highlight text="Bear Type" />
          </th>
          <th scope="col">
            <Highlight text="Coat" />
          </th>
          <th scope="col">
            <Highlight text="Adult size" />
          </th>
          <th scope="col">
            <Highlight text="Habitat" />
          </th>
          <th scope="col">
            <Highlight text="Lifespan" />
          </th>
          <th scope="col">
            <Highlight text="Diet" />
          </th>
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
