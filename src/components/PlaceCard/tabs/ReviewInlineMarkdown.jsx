import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';
import rehypeSanitize from 'rehype-sanitize';
import { articleBodyPlaceOrFestivalTo } from '../../../shared/navigation/logbookMarkdownHref.js';
import ContentAffiliateMark from '../../../shared/affiliate/ContentAffiliateMark.jsx';
import {
  CONTENT_AFFILIATE_LINK_REL,
  resolveContentAffiliateLink,
} from '../../../utils/contentAffiliateHref.js';
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

function ReviewAnchor({ href, children, affiliateSubTag = '' }) {
  const navigate = useNavigate();
  const props = reviewInlineLinkProps(href);
  if (!props) return <>{children}</>;
  const inAppTo = articleBodyPlaceOrFestivalTo(
    href,
    typeof window !== 'undefined' ? window.location.href : undefined,
  );
  if (inAppTo) {
    return (
      <a
        href={props.href}
        className={REVIEW_LINK_CLASS}
        onClick={(event) => {
          event.stopPropagation();
          if (
            event.defaultPrevented
            || event.button !== 0
            || event.metaKey
            || event.altKey
            || event.ctrlKey
            || event.shiftKey
          ) {
            return;
          }
          event.preventDefault();
          const nonce = rememberLogbookReaderOrigin();
          navigate(inAppTo, {
            state: nonce ? { [LOGBOOK_READER_ORIGIN_NONCE]: nonce } : undefined,
          });
        }}
      >
        {children}
      </a>
    );
  }
  const resolved = resolveContentAffiliateLink(props.href, { subTag: affiliateSubTag });
  return (
    <a
      {...props}
      href={resolved.href}
      rel={resolved.affiliated ? CONTENT_AFFILIATE_LINK_REL : props.rel}
      className={REVIEW_LINK_CLASS}
      data-content-affiliate={resolved.partner || undefined}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      {children}
      {resolved.affiliated ? <ContentAffiliateMark /> : null}
    </a>
  );
}

export default function ReviewInlineMarkdown({ text, inline = false, affiliateSubTag = '' }) {
  const components = useMemo(
    () => ({
      p: ({ children }) =>
        inline ? (
          <span className="whitespace-pre-wrap">{children}</span>
        ) : (
          <p className="whitespace-pre-wrap">{children}</p>
        ),
      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
      a: ({ href, children }) => (
        <ReviewAnchor href={href} affiliateSubTag={affiliateSubTag}>
          {children}
        </ReviewAnchor>
      ),
      br: () => <br />,
    }),
    [inline, affiliateSubTag],
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
    return (
      <Markdown
        text={this.props.text}
        inline={this.props.inline}
        affiliateSubTag={this.props.affiliateSubTag}
      />
    );
  }
}
