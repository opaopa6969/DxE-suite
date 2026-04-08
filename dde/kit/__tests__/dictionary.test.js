import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { inferTerms, buildDictionary } from '../lib/dictionary.js';

// --- inferTerms ---

describe('inferTerms', () => {
  it('3文字以下は大文字バリエーションを含む', () => {
    const terms = inferTerms('jwt');
    expect(terms).toContain('JWT');
    expect(terms).toContain('jwt');
  });

  it('xss も大文字バリエーション', () => {
    const terms = inferTerms('xss');
    expect(terms).toContain('XSS');
  });

  it('ハイフンをスペースに変換', () => {
    const terms = inferTerms('session-management');
    expect(terms).toContain('session management');
    expect(terms).toContain('Session management');
    expect(terms).toContain('Session Management');
  });

  it('ハイフン版も含む', () => {
    const terms = inferTerms('multi-tenant');
    expect(terms).toContain('multi-tenant');
    expect(terms).toContain('Multi-tenant');
  });

  it('単語一つはスペース変換なし', () => {
    const terms = inferTerms('saas');
    expect(terms).toContain('saas');
    expect(terms).toContain('Saas');
  });
});

// --- buildDictionary ---

const TMP = '/tmp/dde-test-glossary';

function setup(files, dictYaml) {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(TMP, name), content || '');
  }
  if (dictYaml) {
    writeFileSync(join(TMP, 'dictionary.yaml'), dictYaml);
  }
}

afterEach(() => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
});

describe('buildDictionary', () => {
  it('ファイル名から用語を自動推定', () => {
    setup({ 'jwt.md': '', 'session-management.md': '' });
    const dict = buildDictionary(TMP, null, 'en');
    const terms = dict.map(e => e.term);
    expect(terms).toContain('JWT');
    expect(terms).toContain('session management');
    expect(terms).toContain('Session management');
  });

  it('.ja.md は除外される', () => {
    setup({ 'jwt.md': '', 'jwt.ja.md': '' });
    const dict = buildDictionary(TMP, null, 'en');
    // jwt.ja.md 由来のエントリはない（自動推定は jwt.md のみ）
    const files = dict.map(e => e.file);
    const hasJaFile = files.some(f => f.endsWith('.ja.md') && !f.includes('dictionary'));
    expect(hasJaFile).toBe(false);
  });

  it('dictionary.yaml で上書き', () => {
    setup(
      { 'multi-tenant.md': '' },
      `multi-tenant.md:\n  en: ["multi-tenant", "multi-tenancy", "Multi-tenant"]\n`
    );
    const dict = buildDictionary(TMP, null, 'en');
    const terms = dict.map(e => e.term);
    expect(terms).toContain('multi-tenancy');
    expect(terms).toContain('multi-tenant');
  });

  it('dictionary.yaml の ja キーで日本語用語追加（lang=ja）', () => {
    setup(
      { 'jwt.md': '' },
      `jwt.md:\n  en: ["JWT"]\n  ja: ["JWT", "JSON Web Token"]\n`
    );
    const dict = buildDictionary(TMP, null, 'ja');
    const jaEntries = dict.filter(e => e.lang === 'ja');
    const jaTerms = jaEntries.map(e => e.term);
    expect(jaTerms).toContain('JWT');
    expect(jaTerms).toContain('JSON Web Token');
  });

  it('dictionary.yaml の ja キーは lang=en では追加されない', () => {
    setup(
      { 'jwt.md': '' },
      `jwt.md:\n  en: ["JWT"]\n  ja: ["JSON Web Token"]\n`
    );
    const dict = buildDictionary(TMP, null, 'en');
    const terms = dict.map(e => e.term);
    expect(terms).not.toContain('JSON Web Token');
  });

  it('最長一致ソート（文字数降順）', () => {
    setup({ 'session-management.md': '', 'session.md': '' });
    const dict = buildDictionary(TMP, null, 'en');
    // "session management" (18文字) は "session" (7文字) より前
    const smIdx = dict.findIndex(e => e.term === 'session management');
    const sIdx = dict.findIndex(e => e.term === 'session');
    if (smIdx !== -1 && sIdx !== -1) {
      expect(smIdx).toBeLessThan(sIdx);
    }
  });

  it('glossaryDir が存在しなくても空配列を返す', () => {
    const dict = buildDictionary('/tmp/nonexistent-dir', null, 'en');
    expect(dict).toEqual([]);
  });

  it('.ja.md の H1 から日本語用語を自動補完（dictionary.yaml に ja: がない場合）', () => {
    setup({
      'stack-trace.md': '',
      'stack-trace.ja.md': '# スタックトレース\n\nこれはスタックトレースの説明です。\n',
    });
    const dict = buildDictionary(TMP, null, 'ja');
    const jaTerms = dict.filter(e => e.lang === 'ja').map(e => e.term);
    expect(jaTerms).toContain('スタックトレース');
  });

  it('.ja.md の H1 括弧注釈は除去される', () => {
    setup({
      'garbage-collection.md': '',
      'garbage-collection.ja.md': '# ガベージコレクション（GC）\n\n説明\n',
    });
    const dict = buildDictionary(TMP, null, 'ja');
    const jaTerms = dict.filter(e => e.lang === 'ja').map(e => e.term);
    expect(jaTerms).toContain('ガベージコレクション');
    expect(jaTerms).not.toContain('ガベージコレクション（GC）');
  });

  it('dictionary.yaml に ja: がある場合は H1 自動補完しない（上書きを優先）', () => {
    setup(
      {
        'jwt.md': '',
        'jwt.ja.md': '# JWT とは\n\n説明\n',
      },
      `jwt.md:\n  en: ["JWT"]\n  ja: ["JWT", "JSON Web Token"]\n`
    );
    const dict = buildDictionary(TMP, null, 'ja');
    const jaTerms = dict.filter(e => e.lang === 'ja').map(e => e.term);
    // dictionary.yaml の値が使われる
    expect(jaTerms).toContain('JSON Web Token');
    // H1 の "JWT とは" は追加されない
    expect(jaTerms).not.toContain('JWT とは');
  });
});
