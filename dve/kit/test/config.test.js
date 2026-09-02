import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { projectFileStems } from '../dist/config.js';

test('projectFileStems keeps duplicate project outputs separate', () => {
  const stems = projectFileStems([
    { name: 'syslenz', path: '/tmp/a/syslenz' },
    { name: 'syslenz', path: '/tmp/b/syslenz' },
  ]);
  assert.equal(new Set(stems).size, 2);
  assert.match(stems[0], /^syslenz-[a-f0-9]{8}$/);
  assert.match(stems[1], /^syslenz-[a-f0-9]{8}$/);
});

test('scan --register merges existing config and disambiguates new names', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'dve-scan-'));
  try {
    const existing = path.join(root, 'existing');
    const first = path.join(root, 'a', 'syslenz');
    const second = path.join(root, 'b', 'syslenz');
    for (const project of [existing, first, second]) {
      mkdirSync(path.join(project, '.git'), { recursive: true });
      mkdirSync(path.join(project, 'dge', 'sessions'), { recursive: true });
      writeFileSync(path.join(project, 'dge', 'sessions', 'session.md'), '# session\n');
    }
    writeFileSync(path.join(root, 'dve.config.json'), JSON.stringify({
      outputDir: 'custom-output',
      projects: [{ name: 'keep-me', path: 'existing' }],
    }));

    const cli = path.resolve('dist/cli/dve-tool.js');
    const result = spawnSync(process.execPath, [cli, 'scan', '.', '--register'], {
      cwd: root, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const config = JSON.parse(readFileSync(path.join(root, 'dve.config.json'), 'utf8'));
    assert.equal(config.outputDir, 'custom-output');
    assert.equal(config.projects.length, 3);
    assert.equal(config.projects[0].name, 'keep-me');
    assert.equal(new Set(config.projects.map((p) => p.name)).size, 3);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
