import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAdminRoute = path.startsWith('/admin');
      const routeAdminAuth =
        typeof window !== 'undefined' ? localStorage.getItem('stms_route_admin_auth') : null;

      const title = isAdminRoute ? 'Admin dashboard failed to load' : 'Something went wrong';
      const description = isAdminRoute
        ? 'We encountered an error while loading the Route Admin Dashboard.'
        : 'We encountered an error while loading this page.';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 mb-4">{description}</p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>

              {routeAdminAuth ? (
                <button
                  onClick={() => {
                    if (path !== '/admin/dashboard') {
                      window.location.replace('/admin/dashboard');
                      return;
                    }
                    window.location.reload();
                  }}
                  className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Go to Admin Dashboard
                </button>
              ) : null}
            </div>

            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {this.state.error && this.state.error.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
