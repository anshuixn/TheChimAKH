import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { validateClientEnv } from './lib/clientEnv';
import './styles/global.css';

// Perform client environment safety checks
validateClientEnv();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element to mount React application');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
