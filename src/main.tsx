import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ProfileProvider } from './context/ProfileContext.tsx';
import { AlertsProvider } from './context/AlertsContext.tsx';
import { RemindersProvider } from './context/RemindersContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProfileProvider>
        <AlertsProvider>
          <RemindersProvider>
            <App />
          </RemindersProvider>
        </AlertsProvider>
      </ProfileProvider>
    </AuthProvider>
  </StrictMode>,
);
