import { type ReactElement, useState } from 'react';
import { type Bear } from './bear-models';
import { placeholderImage } from './bears.api';

export function BearImage({
  bear,
  width,
}: {
  bear: Bear;
  width: string;
}): ReactElement {
  // Used for if url exists but image cant be loaded
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <img
      src={imageFailed ? placeholderImage : bear.image}
      alt={`Image of ${bear.name}`}
      style={{ width, height: width }}
      onError={() => {
        setImageFailed(true);
      }}
    />
  );
}
