import { Component } from "react";

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected page error",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Booking page render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <div className="mx-auto max-w-3xl px-6 py-14">
            <h1 className="text-2xl font-bold">Booking page failed to render</h1>
            <p className="mt-3 text-sm text-slate-600">
              The page hit a runtime error. Use the details below to identify the issue.
            </p>
            <div className="mt-6 rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
              {this.state.message}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
