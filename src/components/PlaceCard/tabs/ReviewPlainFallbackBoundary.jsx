import React from 'react';
import { reviewPlainTextForAccessibility } from '../../../utils/reviewPlainTextAccessibility.jsx';

/** Eager boundary so a failed lazy markdown chunk still shows plain review text. */
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
      const plain = reviewPlainTextForAccessibility(this.props.text);
      return <div className={this.props.className || 'whitespace-pre-wrap'}>{plain}</div>;
    }
    return this.props.children;
  }
}
