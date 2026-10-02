import type { ReactElement } from "react";
import { SearchProvider } from "./features/search/SearchContext";
import { Header } from "./features/layout/Header";
import { NavBar } from "./features/layout/NavBar";
import { SideBar } from "./features/layout/SideBar";
import { Footer } from "./features/layout/Footer";
import { Article } from "./features/article/Article";

export default function App(): ReactElement {
  return (
    <SearchProvider>
      <Header />
      <NavBar />

      <main>
        <Article />

        <SideBar />
      </main>

      <Footer />
    </SearchProvider>
  );
}
