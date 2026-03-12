import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  state = { hasError: false, error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("React Error Boundary:", error, info);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ minHeight: "100vh", padding: 24, background: "#0f0f12", color: "#e4e4e7", fontFamily: "system-ui" }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>App Error</h1>
          <pre style={{ background: "#1a1a1f", padding: 16, borderRadius: 8, overflow: "auto", fontSize: 13 }}>
            {this.state.error.message}
          </pre>
          <p style={{ marginTop: 12, fontSize: 14, color: "#a1a1aa" }}>
            Check the browser console for more details.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
