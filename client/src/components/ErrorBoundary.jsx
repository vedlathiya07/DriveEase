import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-shell">
          <h3>Something went wrong ⚠️</h3>
        </div>
      );
    }

    return this.props.children;
  }
}
