import { StrictMode, Component, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ProfileProvider } from "./context/ProfileContext.tsx";
import { AlertsProvider } from "./context/AlertsContext.tsx";
import { RemindersProvider } from "./context/RemindersContext.tsx";
import "./index.css";

// Basic global error handler for startup crashes
window.addEventListener("error", (e) => {
  console.error("Global Startup Error:", e.message, e.error);
  const rootElement = document.getElementById("root");
  if (rootElement && !rootElement.hasChildNodes()) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: white; background: #111; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h2 style="color: #ef4444;">App failed to load</h2>
        <p style="color: #9ca3af; text-align: center;">${e.message || "Unknown error"}</p>
        <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; border: none; border-radius: 8px; color: white;">Reload</button>
      </div>
    `;
  }
});

class GlobalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'white', background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Application Error</h2>
          <p style={{ color: '#9ca3af', textAlign: 'center' }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <AuthProvider>
        <ProfileProvider>
          <AlertsProvider>
            <RemindersProvider>
              <App />
            </RemindersProvider>
          </AlertsProvider>
        </ProfileProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
);
