import sanitizeHtml from 'sanitize-html';
/** Server rendering only: never expose unsanitized CMS HTML to a component. */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'h2', 'h3', 'a'],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
    nonTextTags: ['script', 'style', 'textarea', 'option', 'iframe'],
  });
}
export function contentPlainText(html: string): string {
  return sanitizeHtml(sanitizeContent(html), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
