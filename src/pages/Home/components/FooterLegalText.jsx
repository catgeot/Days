import React from 'react';

const HTTPS_URL_RE = /https:\/\/[^\s)]+/g;

function splitLegalUrls(text) {
  const parts = [];
  let last = 0;
  const str = text ?? '';
  for (const match of str.matchAll(HTTPS_URL_RE)) {
    const start = match.index ?? 0;
    if (start > last) {
      parts.push({ type: 'text', value: str.slice(last, start) });
    }
    parts.push({ type: 'link', value: match[0] });
    last = start + match[0].length;
  }
  if (last < str.length) {
    parts.push({ type: 'text', value: str.slice(last) });
  }
  return parts;
}

export default function FooterLegalText({ text }) {
  const parts = splitLegalUrls(text);
  return (
    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <a
            key={`link-${index}`}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline underline-offset-2 decoration-blue-400/60 hover:text-blue-300 break-all"
          >
            {part.value}
          </a>
        ) : (
          <React.Fragment key={`text-${index}`}>{part.value}</React.Fragment>
        ),
      )}
    </div>
  );
}
