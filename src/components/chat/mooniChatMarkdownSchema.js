import { defaultSchema } from 'rehype-sanitize';

/** MOONi bubble — links only; no raw HTML / images in model replies */
export const mooniChatMarkdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'span',
  ].filter((tag) => tag !== 'img'),
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), 'target', 'rel'],
    span: [
      ...(defaultSchema.attributes?.span || []),
      ['style', /^white-space:\s*nowrap$/i],
      ['dataMooniAccessNumber', /^true$/],
    ],
  },
};
