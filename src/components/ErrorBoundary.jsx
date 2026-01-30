import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('React render error:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, color: '#c53030', background: '#fff5f5', borderRadius: 8 }}>
          <h3>Something went wrong rendering this question.</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', marginTop: 10 }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
