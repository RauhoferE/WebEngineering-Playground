import { type ReactElement } from "react";
import { Comments } from "../comments/Comments";
import { BearList } from "../bears/BearList";
import { Author } from "./Author";
import { BearTable } from "./BearTable";
import { ArticleElement, type ArticleElementProps } from "./ArticleElement";

export function Article(): ReactElement {
  const elements: ArticleElementProps[] = [
    {
      title: "The trouble with Bears",
      textElements: [
        {
          text: "By Evan Wild",
        },
        {
          text: "Tall, lumbering, angry, dangerous. The real live bears of this world are proud, independent creatures, self-serving and always on the hunt for food.",
        },
      ],
    },
    {
      title: "Types of bear",
      textElements: [],
    },
  ];

  const elements2: ArticleElementProps[] = [
    {
      title: "Habitats and Eating habits",
      textElements: [
        {
          text: "Wild bears eat a variety of meat, fish, fruit, nuts, and other natually growing ingredients...",
        },
        {
          text: "Wild bear in forest",
          imgSource: "/media/wild-bear.jpg",
        },
        {
          text: "Urban (gentrified) bears on the other hand have largely abandoned the old ways...",
        },
        {
          text: "Urban bear near buildings",
          imgSource: "/media/urban-bear.jpg",
        },
      ],
    },
    {
      title: "Mating rituals",
      textElements: [
        {
          text: "Bears are romantic creatures by nature...",
        },
      ],
    },
  ];
  return (
    <article>
      {elements.map((el, index) => (
        <ArticleElement
          key={index}
          title={el.title}
          textElements={el.textElements}
        />
      ))}
      <BearTable />
      {elements2.map((el, index) => (
        <ArticleElement
          key={index}
          title={el.title}
          textElements={el.textElements}
        />
      ))}
      <audio controls>
        <source src="/media/bear.mp3" type="audio/mp3" />
        <source src="/media/bear.ogg" type="audio/ogg" />
        <p>
          It looks like your browser doesn&apos;t support HTML5 audio players.
        </p>
      </audio>
      <Author />

      <Comments />
      <BearList />
    </article>
  );
}
