import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';

import { AuthProvider } from './context/AuthContext';

console.log("Running project:", import.meta.env.BASE_URL);
console.log("Current URL:", window.location.href);

createRoot(document.getElementById('root')).render(

  <StrictMode>

    <BrowserRouter>

      <AuthProvider>

        <App />

      </AuthProvider>

    </BrowserRouter>

  </StrictMode>

);