import { StrictMode, Component, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { AlertsProvider } from "./context/AlertsContext";
import { RemindersProvider } from "./context/RemindersContext";
import { ToastProvider } from "./context/ToastContext";

// Error Boundary for the React tree
class GlobalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'white', background: '#0d0d0d', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#9ca3af', textAlign: 'center' }}>We're adjusting your view based on new data. Please stand by.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <GlobalErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <ProfileProvider>
                <AlertsProvider>
                  <RemindersProvider>
                    <ThemeProvider>
                      <App />
                    </ThemeProvider>
                  </RemindersProvider>
                </AlertsProvider>
              </ProfileProvider>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </GlobalErrorBoundary>
    </StrictMode>
  );
}

