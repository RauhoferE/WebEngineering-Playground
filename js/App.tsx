import { useEffect, useRef, type ReactElement } from 'react';
import { SearchProvider } from './features/search/SearchContext';
import { Header } from './features/layout/Header';
import { NavBar } from './features/layout/NavBar';
import { SideBar } from './features/layout/SideBar';
import { Footer } from './features/layout/Footer';
import { Article } from './features/article/Article';
import { Link, Route, Routes, useLocation } from 'react-router';
import { BearDetail } from './features/bears/BearDetail';

function pageTitle(pathname: string): string {
  if (pathname === '/') return 'The trouble with Bears';
  if (pathname.startsWith('/bear/')) return 'Bear details';
  return 'Page not found';
}

export default function App(): ReactElement {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);

  // A single page app does not reload, so announce navigation to assistive
  // technology by updating the title and moving focus to the new content
  useEffect(() => {
    document.title = `${pageTitle(location.pathname)} | Wildlife Website`;
    if (previousPath.current !== location.pathname) {
      previousPath.current = location.pathname;
      mainRef.current?.focus();
    }
  }, [location.pathname]);

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
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header title="Welcome to our wildlife website" />
      <NavBar links={links} />

      <main id="main" tabIndex={-1} ref={mainRef}>
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
