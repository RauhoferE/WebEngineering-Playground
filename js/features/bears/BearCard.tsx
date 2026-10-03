import { type ReactElement } from 'react';
import { type Bear } from './bear-models';
import { Highlight } from '../search/Highlight';
import { BearImage } from './BearImage';
import { Link, useLocation } from 'react-router';

export function BearCard({ bear }: { bear: Bear }): ReactElement {
  const location = useLocation();
  return (
    <div className="bear">
      <BearImage bear={bear} width="200px" />
      <p>
        <b>
          <Link to={{ pathname: `/bears/${bear.id}`, search: location.search }}>
            <Highlight text={bear.name} />
          </Link>
        </b>{' '}
        (<Highlight text={bear.binomial} />)
      </p>
      <p>
        Range: <Highlight text={bear.range} />
      </p>
    </div>
  );
}
