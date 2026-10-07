import { Children } from 'react';

/** @param {import('react').ReactNode} children */
export function mooniMarkdownLinkLabelText(children) {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (child && typeof child === 'object' && 'props' in child && child.props?.children) {
        return mooniMarkdownLinkLabelText(child.props.children);
      }
      return '';
    })
    .join('')
    .trim();
}
