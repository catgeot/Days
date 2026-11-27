import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';
import rehypeSanitize from 'rehype-sanitize';
import { articleBodyPlaceOrFestivalTo } from '../../../shared/navigation/logbookMarkdownHref.js';
import {
  LOGBOOK_READER_ORIGIN_NONCE,
  rememberLogbookReaderOrigin,
} from '../../../shared/navigation/logbookDetailBack.js';
import {
  prepareReviewInlineMarkdown,
  remarkReviewInlineOnly,
  reviewInlineLinkProps,
  reviewInlineSanitizeSchema,
  reviewInlineUrlTransform,
  stripReviewInlineMarkdown,
} from '../../../utils/reviewInlineMarkdown.js';

const REVIEW_LINK_CLASS =
  'text-blue-600 hover:text-blue-700 underline underline-offset-2 break-words';

function isPlainPrimaryPointer(event) {
  if (!event || event.button !== 0) return false;
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return false;
  return true;
}

function ReviewAnchor({ href, children }) {
  const navigate = useNavigate();
  const props = reviewInlineLinkProps(href);
  const pressRef = useRef(null);
  const followedRef = useRef(false);
  if (!props) return <>{children}</>;
  const inAppTo = articleBodyPlaceOrFestivalTo(
    href,
    typeof window !== 'undefined' ? window.location.href : undefined,
  );
  if (inAppTo) {
    const followInApp = (event) => {
      event.stopPropagation();
      if (followedRef.current) {
        event.preventDefault();
        return;
      }
      if (event.defaultPrevented || !isPlainPrimaryPointer(event)) return;
      event.preventDefault();
      followedRef.current = true;
      const nonce = rememberLogbookReaderOrigin();
      navigate(inAppTo, {
        state: nonce ? { [LOGBOOK_READER_ORIGIN_NONCE]: nonce } : undefined,
      });
    };
    return (
      <a
        href={props.href}
        className={REVIEW_LINK_CLASS}
        onPointerDown={(event) => {
          if (!isPlainPrimaryPointer(event)) return;
          pressRef.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
        }}
        onPointerUp={(event) => {
          const press = pressRef.current;
          pressRef.current = null;
          if (!press || press.id !== event.pointerId) return;
          const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
          if (moved > 8) return;
          // WebKit drops click after the review deep-link scroll. pointerup still
          // lands on this anchor; click alone never calls navigate.
          followInApp(event);
        }}
        onClick={followInApp}
      >
        {children}
      </a>
    );
  }
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
      return (
        <span className="whitespace-pre-wrap">{stripReviewInlineMarkdown(this.props.text)}</span>
      );
    }
    const Markdown = this.props.MarkdownComponent || ReviewInlineMarkdown;
    return <Markdown text={this.props.text} inline={this.props.inline} />;
  }
}
