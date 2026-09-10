import { expect, it } from 'vitest';
import { sanitizeContent, contentPlainText } from './sanitize';
it('removes active content and unsafe links, preserving editorial markup', () => {
  const html = sanitizeContent('<h2 onclick="evil()">Title</h2><script>bad()</script><style>bad</style><iframe>bad</iframe><img src=x onerror=evil()><p><strong>Text</strong><a href="javascript:alert(1)">bad</a><a href="data:text/html,x">data</a><a href="//evil.test">protocol</a><a href="/about">About</a><a href="https://example.com" title="OK">Safe</a></p>');
  expect(html).not.toMatch(/script|style|iframe|img|onclick|javascript:|data:|\/\/evil/);
  expect(html).toContain('<strong>Text</strong>'); expect(html).toContain('href="/about"');
  expect(html).toContain('href="https://example.com"');
  expect(contentPlainText('<p>A &amp; B</p><script>bad</script>')).toBe('A & B');
});
it.each(['jav&#x61;script:alert(1)', 'java\nscript:alert(1)', 'data:text/html,hi'])('rejects obfuscated scheme %s', href => {
  expect(sanitizeContent(`<a href="${href}" onmouseover="bad()">Text</a>`)).toBe('<a>Text</a>');
});
