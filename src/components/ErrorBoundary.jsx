import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <main className="app__main shell-error" id="main-content">
            <header className="page-header">
              <h1>Something went wrong</h1>
              <p>
                FootyCompass hit an unexpected error. Reload the page or return home to keep
                learning.
              </p>
            </header>
            <div className="empty-state__actions">
              <button type="button" className="btn btn--primary" onClick={this.handleReload}>
                Reload
              </button>
              <Link to="/" className="btn btn--secondary" onClick={() => this.setState({ hasError: false })}>
                Home
              </Link>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
