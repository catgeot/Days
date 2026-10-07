import React from 'react';
import MooniChatMarkdown from './MooniChatMarkdown.jsx';

export class MooniChatMarkdownBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Partial stream / odd tokens — fall back to plain text
  }

  componentDidUpdate(prevProps) {
    if (prevProps.text !== this.props.text && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    const { text, variant } = this.props;
    return <MooniChatMarkdown text={text} variant={variant} />;
  }
}
