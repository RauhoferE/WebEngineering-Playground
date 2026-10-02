import { type ReactElement } from "react";
import { Highlight } from "../search/Highlight";
import { Comments } from "../comments/Comments";
import { BearList } from "../bears/BearList";
import { Author } from "./Author";
import { BearTable } from "./BearTable";

export function Article(): ReactElement {
  return (
    <article>
      <span style={{ fontSize: "xx-large" }}>
        <Highlight text="The trouble with Bears" />
      </span>
      <br />
      <br />
      <Highlight text="By Evan Wild" />
      <br />
      <br />
      <Highlight text="Tall, lumbering, angry, dangerous. The real live bears of this world are proud, independent creatures, self-serving and always on the hunt for food." />
      <br />
      <br />
      <span style={{ fontSize: "x-large" }}>
        <Highlight text="Types of bear" />
      </span>
      <br />
      <br />
      <BearTable />

      <span style={{ fontSize: "x-large" }}>
        <Highlight text="Habitats and Eating habits" />
      </span>
      <br />
      <br />
      <Highlight text="Wild bears eat a variety of meat, fish, fruit, nuts, and other natually growing ingredients..." />
      <br />
      <br />
      <img src="/media/wild-bear.jpg" alt="Wild bear in forest" />
      <br />
      <br />
      <Highlight text="Urban (gentrified) bears on the other hand have largely abandoned the old ways..." />
      <br />
      <br />
      <img src="/media/urban-bear.jpg" alt="Urban bear near buildings" />
      <br />
      <br />
      <span style={{ fontSize: "x-large" }}>
        <Highlight text="Mating rituals" />
      </span>
      <br />
      <br />
      <Highlight text="Bears are romantic creatures by nature..." />
      <br />
      <br />
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
