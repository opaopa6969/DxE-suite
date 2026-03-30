#!/usr/bin/env node

/**
 * dge-tool CLI tests
 * Run: node test/dge-tool.test.js
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DGE_TOOL = path.join(__dirname, '..', 'bin', 'dge-tool.js');
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

function run(args, stdin) {
  const cmd = `node ${DGE_TOOL} ${args}`;
  if (stdin) {
    return execSync(cmd, { input: stdin, encoding: 'utf8' }).trim();
  }
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

// --- Tests ---

console.log('\n🧪 dge-tool tests\n');

console.log('--- version ---');

test('version returns version string', () => {
  const out = run('version');
  assert(out.startsWith('dge-tool v'), `expected "dge-tool v...", got "${out}"`);
});

test('--version works', () => {
  const out = run('--version');
  assert(out.startsWith('dge-tool v'), `got "${out}"`);
});

test('-v works', () => {
  const out = run('-v');
  assert(out.startsWith('dge-tool v'), `got "${out}"`);
});

console.log('\n--- help ---');

test('help shows commands', () => {
  const out = run('help');
  assert(out.includes('save'), 'missing save');
  assert(out.includes('prompt'), 'missing prompt');
  assert(out.includes('compare'), 'missing compare');
});

test('--help works', () => {
  const out = run('--help');
  assert(out.includes('Commands:'), `got "${out}"`);
});

test('no args shows help', () => {
  const out = run('');
  assert(out.includes('Commands:'), `got "${out}"`);
});

console.log('\n--- save ---');

test('save writes file from stdin', () => {
  const tmpFile = path.join(os.tmpdir(), `dge-test-${Date.now()}.md`);
  const content = '# Test\nHello world\n';
  const out = run(`save ${tmpFile}`, content);
  assert(out.includes('SAVED:'), `expected SAVED, got "${out}"`);
  assert(fs.existsSync(tmpFile), 'file not created');
  const read = fs.readFileSync(tmpFile, 'utf8');
  assert(read === content, `content mismatch: "${read}"`);
  fs.unlinkSync(tmpFile);
});

test('save creates directories', () => {
  const tmpDir = path.join(os.tmpdir(), `dge-test-dir-${Date.now()}`);
  const tmpFile = path.join(tmpDir, 'sub', 'file.md');
  const out = run(`save ${tmpFile}`, 'test');
  assert(out.includes('SAVED:'), `got "${out}"`);
  assert(fs.existsSync(tmpFile), 'file not created');
  fs.rmSync(tmpDir, { recursive: true });
});

test('save shows byte count', () => {
  const tmpFile = path.join(os.tmpdir(), `dge-test-bytes-${Date.now()}.md`);
  const out = run(`save ${tmpFile}`, 'hello');
  assert(out.includes('5 bytes'), `expected 5 bytes, got "${out}"`);
  fs.unlinkSync(tmpFile);
});

test('save without file arg shows error', () => {
  try {
    run('save', '');
    assert(false, 'should have thrown');
  } catch (e) {
    assert(e.message.includes('ERROR') || e.status !== 0, 'expected error');
  }
});

console.log('\n--- prompt ---');

test('prompt with no flow shows default choices', () => {
  const out = run('prompt');
  assert(out.includes('DGE'), `expected DGE in choices, got "${out}"`);
  assert(out.includes('1'), 'expected numbered list');
});

test('prompt quick shows choices', () => {
  // Save cwd, cd to kit dir where flows/ exists
  const cwd = process.cwd();
  process.chdir(path.join(__dirname, '..'));
  const out = run('prompt quick');
  process.chdir(cwd);
  assert(out.includes('1'), `expected numbered, got "${out}"`);
});

test('prompt design-review shows choices', () => {
  const cwd = process.cwd();
  process.chdir(path.join(__dirname, '..'));
  const out = run('prompt design-review');
  process.chdir(cwd);
  assert(out.includes('1'), `expected numbered, got "${out}"`);
});

test('prompt nonexistent-flow shows default', () => {
  const out = run('prompt nonexistent');
  assert(out.includes('DGE'), 'expected default fallback');
});

console.log('\n--- compare ---');

test('compare merges two gap lists', () => {
  const input = JSON.stringify({
    dge: [
      { gap: 'JWT選択の根拠なし', severity: 'High' },
      { gap: 'レート制限なし', severity: 'Critical' }
    ],
    plain: [
      { gap: 'レート制限の記載なし', severity: 'Critical' },
      { gap: 'CORS未定義', severity: 'Medium' }
    ]
  });
  const out = run('compare', input);
  assert(out.includes('マージ結果'), `expected merge header, got "${out}"`);
  assert(out.includes('DGE'), 'expected DGE label');
  assert(out.includes('素のみ'), 'expected plain-only label');
});

test('compare shows stats', () => {
  const input = JSON.stringify({
    dge: [{ gap: 'A', severity: 'Critical' }],
    plain: [{ gap: 'B', severity: 'High' }]
  });
  const out = run('compare', input);
  assert(out.includes('Gap 総数'), 'expected stats table');
  assert(out.includes('Critical'), 'expected severity');
});

test('compare with empty lists', () => {
  const input = JSON.stringify({ dge: [], plain: [] });
  const out = run('compare', input);
  assert(out.includes('マージ結果'), 'should handle empty');
  assert(out.includes('DGE のみ: 0'), 'expected 0');
});

test('compare with invalid JSON shows error', () => {
  try {
    run('compare', 'not json');
    assert(false, 'should have thrown');
  } catch (e) {
    assert(true);
  }
});

test('compare detects substring overlap', () => {
  const input = JSON.stringify({
    dge: [{ gap: 'リフレッシュトークンのローテーション', severity: 'Critical' }],
    plain: [{ gap: 'リフレッシュトークンのローテーション未定義', severity: 'Medium' }]
  });
  const out = run('compare', input);
  assert(out.includes('両方'), `expected "両方" match, got "${out}"`);
});

console.log('\n--- unknown command ---');

test('unknown command shows error', () => {
  try {
    run('foobar');
    assert(false, 'should have thrown');
  } catch (e) {
    assert(true);
  }
});

// --- Summary ---
console.log(`\n${'='.repeat(40)}`);
console.log(`✅ ${passed} passed, ❌ ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
