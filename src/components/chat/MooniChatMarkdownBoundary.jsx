import React from 'react';
import MooniChatMarkdown from './MooniChatMarkdown.jsx';
import { mooniChatMarkdownPlainFallback } from './mooniChatMarkdownPlainFallback.js';

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
    if (this.state.failed) {
      const plain = mooniChatMarkdownPlainFallback(text);
      return (
        <div
          className={`mooni-chat-markdown mooni-chat-markdown--plain-fallback${
            variant === 'dark' ? ' mooni-chat-markdown--dark' : ''
          }`}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {plain}
        </div>
      );
    }
    return <MooniChatMarkdown text={text} variant={variant} />;
  }
}
