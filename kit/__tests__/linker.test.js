import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { link, detectLang } from '../lib/linker.js';

const TMP = '/tmp/dde-linker-test';
const GLOSSARY = join(TMP, 'docs', 'glossary');

function setup() {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
  mkdirSync(GLOSSARY, { recursive: true });
  writeFileSync(join(GLOSSARY, 'jwt.md'), '# JWT\n');
  writeFileSync(join(GLOSSARY, 'xss.md'), '# XSS\n');
  writeFileSync(join(GLOSSARY, 'session-management.md'), '# Session Management\n');
}

afterEach(() => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
});

describe('detectLang', () => {
  it('.ja.md は ja', () => {
    expect(detectLang('README.ja.md', 'auto')).toBe('ja');
  });
  it('.md は en', () => {
    expect(detectLang('README.md', 'auto')).toBe('en');
  });
  it('force lang', () => {
    expect(detectLang('README.md', 'ja')).toBe('ja');
  });
});

describe('link', () => {
  beforeEach(setup);

  it('--fix でファイルを更新する', () => {
    const file = join(TMP, 'README.md');
    writeFileSync(file, 'JWT is a token format.\n');

    const result = link(file, { glossaryDir: GLOSSARY });
    expect(result.changeCount).toBeGreaterThan(0);

    const updated = readFileSync(file, 'utf8');
    expect(updated).toContain('[JWT]');
  });

  it('変更なしの場合 changeCount は 0', () => {
    const file = join(TMP, 'README.md');
    // 既にリンク済みの文書
    writeFileSync(file, `[JWT](${GLOSSARY}/jwt.md) is a token.\n`);

    const result = link(file, { glossaryDir: GLOSSARY });
    expect(result.changeCount).toBe(0);
  });

  it('--check でリンク漏れを検出する', () => {
    const file = join(TMP, 'README.md');
    writeFileSync(file, 'JWT and XSS are security topics.\n');

    const result = link(file, { glossaryDir: GLOSSARY, check: true });
    expect(result.unlinked).toBeDefined();
    const terms = result.unlinked.map(u => u.term);
    expect(terms).toContain('JWT');
  });

  it('--check でリンク漏れなしの場合 unlinked は空', () => {
    const file = join(TMP, 'README.md');
    writeFileSync(file, `[JWT](${GLOSSARY}/jwt.md) is linked.\n`);

    const result = link(file, { glossaryDir: GLOSSARY, check: true });
    expect(result.unlinked.length).toBe(0);
  });

  it('--dry-run はファイルを変更しない', () => {
    const file = join(TMP, 'README.md');
    const original = 'JWT is a token format.\n';
    writeFileSync(file, original);

    const result = link(file, { glossaryDir: GLOSSARY, dryRun: true });
    expect(result.diff).toBeDefined();
    expect(result.changeCount).toBeGreaterThan(0);

    // ファイルは変更されていない
    const content = readFileSync(file, 'utf8');
    expect(content).toBe(original);
  });

  it('存在しないファイルはエラーをスロー', () => {
    expect(() => link('/tmp/nonexistent.md', { glossaryDir: GLOSSARY })).toThrow();
  });

  it('ja ファイルは ja 用語でリンクする', () => {
    // dictionary.yaml に日本語用語を定義
    writeFileSync(join(GLOSSARY, 'dictionary.yaml'),
      `jwt.md:\n  en: ["JWT"]\n  ja: ["JWT"]\n`
    );
    const file = join(TMP, 'README.ja.md');
    writeFileSync(file, 'JWTを使った認証について説明します。\n');

    const result = link(file, { glossaryDir: GLOSSARY });
    expect(result.changeCount).toBeGreaterThan(0);
    const updated = readFileSync(file, 'utf8');
    expect(updated).toContain('[JWT]');
  });
});
