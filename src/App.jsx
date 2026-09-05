/* App.jsx — providers + router + the offline banner. */

import { useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './App.scss';
import AppRoutes from './pages/Routes';
import { AuthProvider } from './context/Auth';
import { AppProvider } from './context/AppProvider';
import { WifiOff } from 'lucide-react';

function OfflineBanner() {
  const online = useSelector((s) => s.ui.online);
  if (online) return null;
  return (
    <div className="offline-banner">
      <WifiOff size={14} strokeWidth={2.5} />
      <span>you are offline — changes save locally and will sync when you are back</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <OfflineBanner />
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
