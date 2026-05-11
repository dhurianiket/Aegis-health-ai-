// Immediate error handling before anything else
const handleError = (msg: string, error?: any) => {
  console.error("Critical Startup Error:", msg, error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 40px 20px; font-family: sans-serif; color: white; background: #0d0d0d; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 16px; padding: 24px; max-width: 400px; width: 100%;">
          <h2 style="color: #ef4444; margin: 0 0 12px 0;">Shield Failure</h2>
          <p style="color: #9ca3af; line-height: 1.5; margin-bottom: 20px;">${msg || "A critical error occurred while initializing the neural interface."}</p>
          <button onclick="window.location.reload()" style="cursor: pointer; width: 100%; padding: 12px; background: #3b82f6; border: none; border-radius: 12px; color: white; font-weight: 600; font-size: 14px; transition: opacity 0.2s;">System Reboot</button>
        </div>
        <p style="margin-top: 24px; font-size: 11px; color: #4b5563; font-family: monospace;">ERROR_CODE: IOS_STUCK_RENDER</p>
      </div>
    `;
  }
};

window.addEventListener("error", (e) => handleError(e.message, e.error));
window.addEventListener("unhandledrejection", (e) => handleError(`Async error: ${e.reason}`));

import { StrictMode, Component, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

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
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'white', background: '#0d0d0d', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifySelf: 'center', alignItems: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>System Anomaly</h2>
          <p style={{ color: '#9ca3af', textAlign: 'center' }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Reboot Interface</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Bootstrap function to safely initialize the app
const bootstrap = async () => {
  try {
    // Dynamic imports to wait for the modules to be ready and catch errors
    const [
      { default: App },
      { AuthProvider },
      { ProfileProvider },
      { AlertsProvider },
      { RemindersProvider }
    ] = await Promise.all([
      import("./App.tsx"),
      import("./context/AuthContext.tsx"),
      import("./context/ProfileContext.tsx"),
      import("./context/AlertsContext.tsx"),
      import("./context/RemindersContext.tsx")
    ]);

    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("Root element not found");

    console.log("Rendering React tree...");
    
    // Watchdog for slow render
    const renderTimeout = setTimeout(() => {
      if (rootElement && rootElement.innerHTML.includes("Waking up")) {
        handleError("Initialization is taking longer than expected. This might be due to a slow network or a device compatibility issue.");
      }
    }, 10000);

    createRoot(rootElement).render(
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
      </StrictMode>
    );
    
    clearTimeout(renderTimeout);
    console.log("Bootstrap complete.");
  } catch (error: any) {
    handleError(error.message || "App failed to bootstrap", error);
  }
};

bootstrap();
