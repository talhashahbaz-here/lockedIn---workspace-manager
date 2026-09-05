/* main.jsx — hydrate state from IndexedDB, boot the store, render.
   also parks the store on window.__STORE__ for the command palette +
   settings export/import to read globally. */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { setupStore } from './store';
import { hydrateState } from './config/persistence';
import ScreenLoader from './components/ScreenLoader';

async function boot() {
  const container = document.getElementById('root');
  const root = ReactDOM.createRoot(container);

  root.render(<ScreenLoader label="warming up the local database" />);

  try {
    const hydrated = await hydrateState();
    const store = setupStore(hydrated);
    window.__STORE__ = store;

    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </React.StrictMode>
    );
  } catch (err) {
    // absolute worst case: boot with a fresh store so the app still works
    const store = setupStore(null);
    window.__STORE__ = store;
    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </React.StrictMode>
    );
  }
}

boot();
