import type { ReactElement } from 'react';
import { SearchProvider } from './features/search/SearchContext';
import { Header } from './features/layout/Header';
import { NavBar } from './features/layout/NavBar';
import { SideBar } from './features/layout/SideBar';
import { Footer } from './features/layout/Footer';
import { Article } from './features/article/Article';
import { Link, Route, Routes } from 'react-router';
import { BearDetail } from './features/bears/BearDetail';

export default function App(): ReactElement {
  const links = [
    {
      href: '/',
      name: 'Home',
    },
    {
      href: '/our-team',
      name: 'Our team',
    },
    {
      href: '/projects',
      name: 'Projects',
    },
    {
      href: '/blog',
      name: 'Blog',
    },
  ];
  const sideBarLinks = [
    'The trouble with Bees',
    'The trouble with Otters',
    'The trouble with Penguins',
    'The trouble with Octopi',
    'The trouble with Lemurs',
  ];
  return (
    <SearchProvider>
      <Header title="Welcome to our wildlife website" />
      <NavBar links={links} />

      <main>
        <Routes>
          <Route path="/" element={<Article />} />
          <Route path="/bear/:bearId" element={<BearDetail />} />
          <Route
            path="*"
            element={
              <p>
                Page not found. <Link to="/">Go home</Link>
              </p>
            }
          />
        </Routes>

        <SideBar links={sideBarLinks} />
      </main>

      <Footer text="©Copyright 2050 by Emre. All rights reversed." />
    </SearchProvider>
  );
}
