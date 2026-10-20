import { type ReactElement } from 'react';
import { Highlight } from '../search/Highlight';

// Text alternative for bear.mp3 / bear.ogg (WCAG 1.2.1). Keep it in sync
// with the recording.
const audioDescription =
  'A recording of bear vocalisations, such as growls and calls. There is no speech in the recording.';

export function AudioWithTranscript(): ReactElement {
  return (
    <figure className="audio-figure">
      <audio
        controls
        aria-label="Recording of bear sounds"
        aria-describedby="bear-audio-description"
      >
        <source src="/media/bear.mp3" type="audio/mp3" />
        <source src="/media/bear.ogg" type="audio/ogg" />
        <p>
          It looks like your browser doesn&apos;t support HTML5 audio players.
        </p>
      </audio>
      <figcaption>
        <details>
          <summary>Text alternative for the bear recording</summary>
          <p id="bear-audio-description">
            <Highlight text={audioDescription} />
          </p>
        </details>
      </figcaption>
    </figure>
  );
}
