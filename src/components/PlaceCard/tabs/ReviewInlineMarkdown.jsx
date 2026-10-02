import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';
import rehypeSanitize from 'rehype-sanitize';
import {
  prepareReviewInlineMarkdown,
  remarkReviewInlineOnly,
  reviewInlineLinkProps,
  reviewInlineSanitizeSchema,
  reviewInlineUrlTransform,
} from '../../../utils/reviewInlineMarkdown.js';

const REVIEW_LINK_CLASS =
  'text-blue-600 hover:text-blue-700 underline underline-offset-2 break-words';

function ReviewAnchor({ href, children }) {
  const props = reviewInlineLinkProps(href);
  if (!props) return <>{children}</>;
  return (
    <a
      {...props}
      className={REVIEW_LINK_CLASS}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      {children}
    </a>
  );
}

export default function ReviewInlineMarkdown({ text, inline = false }) {
  const components = useMemo(
    () => ({
      p: ({ children }) =>
        inline ? (
          <span className="whitespace-pre-wrap">{children}</span>
        ) : (
          <p className="whitespace-pre-wrap">{children}</p>
        ),
      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
      a: ReviewAnchor,
      br: () => <br />,
    }),
    [inline],
  );
  const markdown = prepareReviewInlineMarkdown(text);
  if (!markdown) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkReviewInlineOnly, remarkCjkFriendly]}
      rehypePlugins={[[rehypeSanitize, reviewInlineSanitizeSchema]]}
      urlTransform={reviewInlineUrlTransform}
      allowedElements={reviewInlineSanitizeSchema.tagNames}
      unwrapDisallowed
      skipHtml
      components={components}
    >
      {markdown}
    </ReactMarkdown>
  );
}

export class ReviewInlineMarkdownBoundary extends React.Component {
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
      return <span className="whitespace-pre-wrap">{this.props.text}</span>;
    }
    const Markdown = this.props.MarkdownComponent || ReviewInlineMarkdown;
    return <Markdown text={this.props.text} inline={this.props.inline} />;
  }
}
