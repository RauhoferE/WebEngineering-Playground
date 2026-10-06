import { type ReactElement } from 'react';
import { Highlight } from '../search/Highlight';

export interface BearTableRowProps {
  type: string;
  coat: string;
  adult_size: string;
  habitat: string;
  lifespan: string;
  diet: string;
}

export function BearTableRow({
  row,
}: {
  row: BearTableRowProps;
}): ReactElement {
  return (
    <tr>
      <th scope="row">
        <Highlight text={row.type} />
      </th>
      <td>
        <Highlight text={row.coat} />
      </td>
      <td>
        <Highlight text={row.adult_size} />
      </td>
      <td>
        <Highlight text={row.habitat} />
      </td>
      <td>
        <Highlight text={row.lifespan} />
      </td>
      <td>
        <Highlight text={row.diet} />
      </td>
    </tr>
  );
}
