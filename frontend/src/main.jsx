import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unknown runtime error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f172a", color: "#fff", padding: "24px" }}>
          <div style={{ maxWidth: "840px", border: "1px solid rgba(248,113,113,0.5)", background: "rgba(15,23,42,0.8)", padding: "16px", borderRadius: "12px" }}>
            <h2 style={{ marginTop: 0, color: "#fda4af" }}>CPSS runtime error</h2>
            <p style={{ marginBottom: 0 }}>{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
