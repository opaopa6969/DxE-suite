import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('generateBundle follows session contains dialogue discovers gap edges', async () => {
  const { generateBundle } = await import('../dist/context/bundle.js');
  const outputDir = mkdtempSync(path.join(os.tmpdir(), 'dve-context-'));
  try {
    const graph = {
      version: '1.0.0', generated_at: '2026-01-01T00:00:00Z',
      stats: { sessions: 1, gaps: 1, decisions: 1, annotations: 0 }, warnings: [], glossary: [],
      nodes: [
        { id: 'session-1', type: 'session', data: { theme: 'test', date: '2026-01-01', characters: ['A'] } },
        { id: 'session-1#dialogue', type: 'dialogue', data: {} },
        { id: 'session-1#G-1', type: 'gap', data: { summary: 'missing context', status: 'Active' } },
        { id: 'DD-1', type: 'decision', data: { title: 'choose X' } },
      ],
      edges: [
        { source: 'session-1', target: 'session-1#dialogue', type: 'contains' },
        { source: 'session-1#dialogue', target: 'session-1#G-1', type: 'discovers' },
        { source: 'session-1#G-1', target: 'DD-1', type: 'resolves' },
      ],
    };
    const bundle = generateBundle({ graph, originId: 'session-1', outputDir });
    assert.deepEqual(bundle.summary.prior_gaps.map((g) => g.id), ['session-1#G-1']);
    assert.deepEqual(bundle.summary.prior_decisions, ['DD-1: choose X']);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});
