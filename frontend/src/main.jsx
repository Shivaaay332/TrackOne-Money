import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

// Contexts
import { ThemeProvider } from './context/ThemeContext';
import { NetworkProvider } from './context/NetworkContext';

// Store (Ye automatically store/index.js se default export utha lega)
import store from './store';

import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <NetworkProvider>
            <App />
          </NetworkProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);