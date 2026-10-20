import { type ReactElement } from 'react';
import { Highlight } from '../search/Highlight';

export interface ArticleElementProps {
  title: string;
  textElements: TextElementProps[];
}

export interface TextElementProps {
  text: string;
  imgSource?: string;
}

export function ArticleElement({
  title,
  textElements,
}: ArticleElementProps): ReactElement {
  return (
    <section>
      <h2 style={{ fontSize: 'x-large' }}>
        <Highlight text={title} />
      </h2>
      {textElements.map((el, index) =>
        el.imgSource != null ? (
          <img key={index} src={el.imgSource} alt={el.text} />
        ) : (
          <p key={index}>
            <Highlight text={el.text} />
          </p>
        )
      )}
    </section>
  );
}
