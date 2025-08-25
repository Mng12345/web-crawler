import { isAllowed, parseBasePath, parseDomain, extractLinks, urlToFilePath } from './lib.js';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, test, beforeEach, afterEach } from 'vitest';
describe('isAllowed', () => {
    test('should allow URL with matching domain and basePath', () => {
        const url = new URL('https://example.com/path/to/page');
        expect(isAllowed(url, '/path/to', 'example.com')).toBe(true);
    });
    test('should reject URL with different domain', () => {
        const url = new URL('https://other.com/path/to/page');
        expect(isAllowed(url, '/path/to', 'example.com')).toBe(false);
    });
    test('should reject URL with different basePath', () => {
        const url = new URL('https://example.com/other/path');
        expect(isAllowed(url, '/path/to', 'example.com')).toBe(false);
    });
});
describe('parseBasePath', () => {
    test('should parse base path from URL', () => {
        expect(parseBasePath('https://example.com/path/to/page')).toBe('/path/to/page/');
    });
    test('should return empty string for root URL', () => {
        expect(parseBasePath('https://example.com/')).toBe('/');
    });
    test('should parse base path for file URL', () => {
        expect(parseBasePath('https://example.com/path/to/file.html')).toBe('/path/to/');
    });
});
describe('parseDomain', () => {
    test('should parse domain from URL', () => {
        expect(parseDomain('https://example.com/path/to/page')).toBe('example.com');
    });
    test('should parse domain with subdomain', () => {
        expect(parseDomain('https://sub.example.com/path')).toBe('sub.example.com');
    });
});
describe('extractLinks', () => {
    test('should extract links from HTML', () => {
        const html = `
      <html>
        <body>
          <a href="/page1">Page 1</a>
          <a href="/page2">Page 2</a>
        </body>
      </html>
    `;
        const base = new URL('https://example.com');
        const links = extractLinks(base, html, new Set(), '/', 'example.com');
        expect(links).toEqual([
            'https://example.com/page1',
            'https://example.com/page2'
        ]);
    });
    test('should ignore links with extensions in ignoreSet', () => {
        const html = `
      <html>
        <body>
          <a href="/script.js">JS</a>
          <a href="/style.css">CSS</a>
          <a href="/page.html">Page</a>
        </body>
      </html>
    `;
        const base = new URL('https://example.com');
        const ignoreSet = new Set(['.js', '.css']);
        const links = extractLinks(base, html, ignoreSet, '/', 'example.com');
        expect(links).toEqual(['https://example.com/page.html']);
    });
});
describe('urlToFilePath', () => {
    test('should convert URL to file path', () => {
        const url = new URL('https://example.com/path/to/page');
        const filePath = urlToFilePath('output', url);
        expect(filePath).toBe(path.join('output', 'example.com', 'path/to/page.html'));
    });
    test('should handle root URL', () => {
        const url = new URL('https://example.com/');
        const filePath = urlToFilePath('output', url);
        expect(filePath).toBe(path.join('output', 'example.com', 'index.html'));
    });
});
//# sourceMappingURL=lib.test.js.map