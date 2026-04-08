import { describe, it, expect } from 'vitest';
import { processMarkdown, findUnlinked } from '../lib/markdown.js';

const DICT = [
  { term: 'session management', file: 'docs/glossary/session-management.md', lang: 'en' },
  { term: 'Session Management', file: 'docs/glossary/session-management.md', lang: 'en' },
  { term: 'session',            file: 'docs/glossary/session.md',            lang: 'en' },
  { term: 'JWT',                file: 'docs/glossary/jwt.md',                lang: 'en' },
  { term: 'XSS',                file: 'docs/glossary/xss.md',                lang: 'en' },
  { term: 'port',               file: 'docs/glossary/port.md',               lang: 'en' },
];

describe('processMarkdown', () => {
  it('段落内の用語をリンクに置換する', () => {
    const md = 'JWT is used for authentication.\n';
    const { content, changeCount } = processMarkdown(md, DICT, 'en');
    expect(content).toContain('[JWT](docs/glossary/jwt.md)');
    expect(changeCount).toBeGreaterThan(0);
  });

  it('コードブロック内はリンクされない', () => {
    const md = '```\nJWT token\n```\n';
    const { content, changeCount } = processMarkdown(md, DICT, 'en');
    expect(content).not.toContain('[JWT]');
    expect(changeCount).toBe(0);
  });

  it('インラインコード内はリンクされない', () => {
    const md = 'Use `JWT` for auth.\n';
    const { content, changeCount } = processMarkdown(md, DICT, 'en');
    expect(content).not.toContain('[JWT]');
    expect(changeCount).toBe(0);
  });

  it('見出し内はリンクされない', () => {
    const md = '## JWT Authentication\n\nSome text.\n';
    const { content, changeCount } = processMarkdown(md, DICT, 'en');
    // 見出し内の JWT はリンクされない
    expect(content).not.toMatch(/^## \[JWT\]/m);
  });

  it('既存リンクは二重リンクされない', () => {
    const md = '[JWT](https://example.com) is a token format.\n';
    const { content } = processMarkdown(md, DICT, 'en');
    // [[JWT](...)](...) のような二重リンクにならない
    expect(content).not.toContain('[[JWT]');
  });

  it('段落ごとに 1 用語 1 回だけリンク', () => {
    const md = 'JWT is great. Use JWT for auth.\n';
    const { content } = processMarkdown(md, DICT, 'en');
    // JWT が 2 回出てくるが、リンクは 1 回のみ
    const linkCount = (content.match(/\[JWT\]/g) || []).length;
    expect(linkCount).toBe(1);
  });

  it('最長一致 — "session management" が "session" より優先される', () => {
    const md = 'session management is important.\n';
    const { content } = processMarkdown(md, DICT, 'en');
    expect(content).toContain('[session management]');
    // "session" 単独でのリンクは同段落に作られない
    const sessionLinks = content.match(/\[session\]/g) || [];
    expect(sessionLinks.length).toBe(0);
  });

  it('複合語内の用語はリンクされない（word boundary）', () => {
    // "port" は important/support/export/transport/report にマッチしない
    const md = 'This is important. Please support us. Export data. Transport layer. Report issue. Use port 8080.\n';
    const { content } = processMarkdown(md, DICT, 'en');
    expect(content).not.toContain('im[port]');
    expect(content).not.toContain('sup[port]');
    expect(content).not.toContain('ex[port]');
    expect(content).not.toContain('trans[port]');
    expect(content).not.toContain('re[port]');
    // 単独の "port" はリンクされる
    expect(content).toContain('[port](docs/glossary/port.md)');
  });

  it('辞書が空の場合は変更なし', () => {
    const md = 'JWT is a token.\n';
    const { content, changeCount } = processMarkdown(md, [], 'en');
    expect(content).toBe(md);
    expect(changeCount).toBe(0);
  });

  it('テーブルセル内の用語はリンクされる', () => {
    const md = '| 機能 | 説明 |\n|------|------|\n| JWT | 認証トークン |\n';
    const { content } = processMarkdown(md, DICT, 'en');
    expect(content).toContain('[JWT]');
  });
});

describe('findUnlinked', () => {
  it('未リンクの用語を検出する', () => {
    const md = 'JWT is used here. XSS is dangerous.\n';
    const unlinked = findUnlinked(md, DICT, 'en');
    const terms = unlinked.map(u => u.term);
    expect(terms).toContain('JWT');
    expect(terms).toContain('XSS');
  });

  it('既存リンクは検出しない', () => {
    const md = '[JWT](docs/glossary/jwt.md) is linked.\n';
    const unlinked = findUnlinked(md, DICT, 'en');
    const terms = unlinked.map(u => u.term);
    expect(terms).not.toContain('JWT');
  });
});
