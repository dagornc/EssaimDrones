
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TacticalViewport from './pages/TacticalViewport';
import Configuration from './pages/Configuration';
import Metrics from './pages/Metrics';
import Logs from './pages/Logs';
import './i18n';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="aquaswarm-theme">
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="tactical" element={<TacticalViewport />} />
              <Route path="config" element={<Configuration />} />
              <Route path="metrics" element={<Metrics />} />
              <Route path="logs" element={<Logs />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
