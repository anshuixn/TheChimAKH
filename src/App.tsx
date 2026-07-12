import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
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
              <Route path="/brick" element={<Navigate to="/#brick" replace />} />
              <Route path="/manufacturing" element={<Navigate to="/#manufacturing" replace />} />
              <Route path="/quality" element={<Navigate to="/#quality" replace />} />
              <Route path="/infrastructure" element={<Navigate to="/#infrastructure" replace />} />
              <Route path="/about" element={<Navigate to="/#about" replace />} />
              <Route path="/contact" element={<Navigate to="/#contact" replace />} />
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
