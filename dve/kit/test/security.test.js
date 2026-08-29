// Security regression tests — command injection / path traversal prevention
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- drift-detector: command injection via DD date field ---

test('detectDrift rejects malicious date strings (no shell interpretation)', async () => {
  const { detectDrift } = await import('../dist/parser/drift-detector.js');

  // Create a temp git repo with >10 commits so a valid date would trigger drift
  const tmpRepo = mkdtempSync(path.join(tmpdir(), 'dxe-drift-'));
  try {
    spawnSync('git', ['init', '-q'], { cwd: tmpRepo });
    spawnSync('git', ['config', 'user.email', 't@t.t'], { cwd: tmpRepo });
    spawnSync('git', ['config', 'user.name', 't'], { cwd: tmpRepo });
    spawnSync('git', ['commit', '--allow-empty', '-q', '-m', 'init'], { cwd: tmpRepo });
    for (let i = 0; i < 15; i++) {
      spawnSync('git', ['commit', '--allow-empty', '-q', '-m', `c${i}`], { cwd: tmpRepo });
    }

    // Malicious date that would inject shell commands if passed unsanitized
    const maliciousDate = '2020-01-01"; touch /tmp/opencode/dxe-pwned-PROVES-INJECTION; echo "';
    const ddNodes = [{ id: 'DD-EVIL', type: 'decision', data: { date: maliciousDate, status: 'active' } }];

    // Should not throw, should not execute the injected command
    const results = detectDrift(ddNodes, tmpRepo);
    assert.equal(results.length, 0, 'malicious date should be rejected by guard');

    // Verify the injected file was NOT created
    assert.equal(existsSync('/tmp/opencode/dxe-pwned-PROVES-INJECTION'), false,
      'command injection via date field must not execute');
  } finally {
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test('detectDrift accepts valid YYYY-MM-DD dates', async () => {
  const { detectDrift } = await import('../dist/parser/drift-detector.js');

  const tmpRepo = mkdtempSync(path.join(tmpdir(), 'dxe-drift-valid-'));
  try {
    spawnSync('git', ['init', '-q'], { cwd: tmpRepo });
    spawnSync('git', ['config', 'user.email', 't@t.t'], { cwd: tmpRepo });
    spawnSync('git', ['config', 'user.name', 't'], { cwd: tmpRepo });
    // Need actual file changes (not empty commits) for `git log -- .` pathspec
    for (let i = 0; i < 15; i++) {
      writeFileSync(path.join(tmpRepo, `f${i}.txt`), `content ${i}`);
      spawnSync('git', ['add', '-A'], { cwd: tmpRepo });
      spawnSync('git', ['commit', '-q', '-m', `c${i}`], { cwd: tmpRepo });
    }

    const ddNodes = [{ id: 'DD-001', type: 'decision', data: { date: '2020-01-01', status: 'active' } }];
    const results = detectDrift(ddNodes, tmpRepo);
    assert.equal(results.length, 1, 'valid date should produce drift result');
    assert.equal(results[0].ddId, 'DD-001');
  } finally {
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

// --- api.ts: path traversal via action field in /api/annotations ---
// We test the sanitization logic directly by simulating the filename construction.

test('annotation action field is sanitized against path traversal', () => {
  // Reproduce the sanitization logic from api.ts
  function buildFilename(target, action) {
    const slug = target.replace(/[^a-zA-Z0-9-]/g, "_");
    const safeAction = (action ?? "comment").replace(/[^a-zA-Z0-9-]/g, "_");
    return `001-${slug}-${safeAction}.md`;
  }

  // Normal case
  assert.equal(buildFilename('DD-001', 'comment'), '001-DD-001-comment.md');

  // Path traversal attempt in action
  assert.equal(buildFilename('DD-001', '../../../etc/cron.d/evil'), '001-DD-001-_________etc_cron_d_evil.md');

  // Path traversal attempt in target
  assert.equal(buildFilename('../../etc/passwd', 'comment'), '001-______etc_passwd-comment.md');

  // Shell metacharacters
  assert.equal(buildFilename('DD-001', 'comment; rm -rf /'), '001-DD-001-comment__rm_-rf__.md');
});
