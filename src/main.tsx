import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Error Caught:", {message, source, lineno, colno, error});
  if (error && error.stack) {
    console.error("Stack Trace:", error.stack);
  }
};

window.onunhandledrejection = function(event) {
  console.error("Unhandled Rejection:", event.reason);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
