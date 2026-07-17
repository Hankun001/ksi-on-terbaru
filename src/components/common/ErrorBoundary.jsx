import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary-container" style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          background: '#fef2f2', 
          borderRadius: '8px',
          margin: '1rem'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Ups! Terjadi kesalahan.</h2>
          <p style={{ marginBottom: '1rem' }}>Tim kami telah diberi tahu tentang masalah ini.</p>
          {this.state.error && (
            <div style={{ 
              background: '#fff', 
              padding: '1rem', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              textAlign: 'left',
              fontSize: '0.875rem',
              border: '1px solid #fecaca'
            }}>
              <strong style={{ color: '#dc2626' }}>Error:</strong> {this.state.error.message}
            </div>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            🔄 Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;