import React from 'react';

/** Eager boundary so a failed lazy markdown chunk still shows the raw review text. */
export class ReviewPlainFallbackBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.text !== this.props.text && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return <div className={this.props.className || 'whitespace-pre-wrap'}>{this.props.text}</div>;
    }
    return this.props.children;
  }
}
