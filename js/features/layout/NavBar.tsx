import { type ReactElement } from "react";
import { SearchForm } from "../search/SearchForm";

export function NavBar(): ReactElement {
  return (
    <div className="nav">
      <ul>
        <li>
          <a href="#">Home</a>
        </li>
        <li>
          <a href="#">Our team</a>
        </li>
        <li>
          <a href="#">Projects</a>
        </li>
        <li>
          <a href="#">Blog</a>
        </li>
      </ul>

      <SearchForm />
    </div>
  );
}
