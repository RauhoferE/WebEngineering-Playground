import type { ReactElement } from "react";
import { BearList } from "./features/bears/BearList";
import { Comments } from "./features/comments/Comments";
import { Highlight } from "./features/search/Highlight";
import { SearchProvider } from "./features/search/SearchContext";
import { Header } from "./features/layout/Header";
import { NavBar } from "./features/layout/NavBar";
import { SideBar } from "./features/layout/SideBar";
import { Footer } from "./features/layout/Footer";

export default function App(): ReactElement {
  return (
    <SearchProvider>
      <Header />
      <NavBar />

      <main>
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
              <tr>
                <td>
                  <Highlight text="Wild" />
                </td>
                <td>
                  <Highlight text="Brown or black" />
                </td>
                <td>
                  <Highlight text="1.4 to 2.8 meters" />
                </td>
                <td>
                  <Highlight text="Woods and forests" />
                </td>
                <td>
                  <Highlight text="25 to 28 years" />
                </td>
                <td>
                  <Highlight text="Fish, meat, plants" />
                </td>
              </tr>
              <tr>
                <td>
                  <Highlight text="Urban" />
                </td>
                <td>
                  <Highlight text="North Face" />
                </td>
                <td>
                  <Highlight text="18 to 22" />
                </td>
                <td>
                  <Highlight text="Condos and coffee shops" />
                </td>
                <td>
                  <Highlight text="20 to 32 years" />
                </td>
                <td>
                  <Highlight text="Starbucks, sushi" />
                </td>
              </tr>
            </tbody>
          </table>
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
              It looks like your browser doesn&apos;t support HTML5 audio
              players.
            </p>
          </audio>
          <aside>
            <span style={{ fontSize: "x-large" }}>
              <Highlight text="About the author" />
            </span>
            <br />
            <br />
            <Highlight text="Evan Wild is an unemployed plumber from Doncaster..." />
          </aside>
          <Comments />
          <BearList />
        </article>
        <SideBar />
      </main>

      <Footer />
    </SearchProvider>
  );
}
