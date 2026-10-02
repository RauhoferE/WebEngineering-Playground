import type { ReactElement } from "react";
import { SearchProvider } from "./features/search/SearchContext";
import { Header } from "./features/layout/Header";
import { NavBar } from "./features/layout/NavBar";
import { SideBar } from "./features/layout/SideBar";
import { Footer } from "./features/layout/Footer";
import { Article } from "./features/article/Article";

export default function App(): ReactElement {
  const links = ["Home", "Our team", "Projects", "Blog"];
  const sideBarLinks = [
    "The trouble with Bees",
    "The trouble with Otters",
    "The trouble with Penguins",
    "The trouble with Octopi",
    "The trouble with Lemurs",
  ];
  return (
    <SearchProvider>
      <Header title="Welcome to our wildlife website" />
      <NavBar links={links} />

      <main>
        <Article />

        <SideBar links={sideBarLinks} />
      </main>

      <Footer text="©Copyright 2050 by Emre. All rights reversed." />
    </SearchProvider>
  );
}
