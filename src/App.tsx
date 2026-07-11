import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Brick from './pages/Brick';
import Manufacturing from './pages/Manufacturing';
import Quality from './pages/Quality';
import Infrastructure from './pages/Infrastructure';
import About from './pages/About';
import Contact from './pages/Contact';
import RequestQuote from './pages/RequestQuote';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import SiteHeader from './components/layout/SiteHeader';
import SiteFooter from './components/layout/SiteFooter';
import GlobalErrorBoundary from './components/ui/GlobalErrorBoundary';
import OfflineBanner from './components/ui/OfflineBanner';

export const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-kiln-black)' }}>
          <OfflineBanner />
          <SiteHeader />
          <main style={{ flex: 1 }} id="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/brick" element={<Brick />} />
              <Route path="/manufacturing" element={<Manufacturing />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/infrastructure" element={<Infrastructure />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/request-quote" element={<RequestQuote />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <SiteFooter />
        </div>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
};

export default App;
