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
    <span style={{ fontSize: 'x-large' }}>
      <Highlight text={title} />
      {textElements.map((el, index) => (
        <div key={index}>
          <br />
          <br />
          {el.imgSource != null ? (
            <img src={el.imgSource} alt={el.text} />
          ) : (
            <Highlight text={el.text} />
          )}
        </div>
      ))}
    </span>
  );
}
