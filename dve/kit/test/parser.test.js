// DVE parser unit tests — Node.js built-in test runner
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDecision } from '../dist/parser/decision-parser.js';
import { parseSession } from '../dist/parser/session-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, 'fixtures');

// --- parseDecision ---

test('parseDecision extracts id from filename', () => {
  const result = parseDecision(path.join(fixtures, 'DD-001-test.md'));
  assert.equal(result.node.id, 'DD-001');
});

test('parseDecision extracts title from H1', () => {
  const result = parseDecision(path.join(fixtures, 'DD-001-test.md'));
  assert.equal(result.node.title, 'Use TypeScript for all new modules');
});

test('parseDecision extracts date from frontmatter', () => {
  const result = parseDecision(path.join(fixtures, 'DD-001-test.md'));
  assert.equal(result.node.date, '2024-01-15');
});

test('parseDecision extracts session references from links', () => {
  const result = parseDecision(path.join(fixtures, 'DD-001-test.md'));
  assert.ok(result.node.session_refs.includes('2024-01-15-typescript-adoption'));
});

test('parseDecision extracts gap refs from frontmatter', () => {
  const result = parseDecision(path.join(fixtures, 'DD-001-test.md'));
  assert.deepEqual(result.node.gap_refs, ['#3']);
});

test('parseDecision extracts rationale text', () => {
  const result = parseDecision(path.join(fixtures, 'DD-001-test.md'));
  assert.ok(result.node.rationale.includes('TypeScript'));
});

test('parseDecision defaults status to active', () => {
  const result = parseDecision(path.join(fixtures, 'DD-001-test.md'));
  assert.equal(result.node.status, 'active');
});

test('parseDecision sets status overturned from frontmatter', () => {
  const result = parseDecision(path.join(fixtures, 'DD-002-overturned.md'));
  assert.equal(result.node.status, 'overturned');
});

test('parseDecision extracts supersedes list', () => {
  const result = parseDecision(path.join(fixtures, 'DD-002-overturned.md'));
  assert.deepEqual(result.node.supersedes, ['DD-001']);
});

test('parseDecision returns confidence 1.0 when date and title present', () => {
  const result = parseDecision(path.join(fixtures, 'DD-001-test.md'));
  assert.equal(result.confidence, 1.0);
});

test('parseDecision returns lower confidence without date', () => {
  const result = parseDecision(path.join(fixtures, 'DD-002-overturned.md'));
  assert.ok(result.confidence < 1.0);
});

test('parseDecision warns when no session references', () => {
  const result = parseDecision(path.join(fixtures, 'DD-002-overturned.md'));
  assert.ok(result.warnings.some(w => w.includes('session')));
});

test('parseDecision warns when date is missing', () => {
  const result = parseDecision(path.join(fixtures, 'DD-002-overturned.md'));
  assert.ok(result.warnings.some(w => w.includes('date')));
});

test('parseDecision includes file_path in node', () => {
  const fp = path.join(fixtures, 'DD-001-test.md');
  const result = parseDecision(fp);
  assert.equal(result.node.file_path, fp);
});

// --- parseSession ---

test('parseSession extracts id from filename', () => {
  const { session } = parseSession(path.join(fixtures, '2024-03-01-architecture-review.md'));
  assert.equal(session.node.id, '2024-03-01-architecture-review');
});

test('parseSession extracts date from filename', () => {
  const { session } = parseSession(path.join(fixtures, '2024-03-01-architecture-review.md'));
  assert.equal(session.node.date, '2024-03-01');
});

test('parseSession extracts theme from frontmatter', () => {
  const { session } = parseSession(path.join(fixtures, '2024-03-01-architecture-review.md'));
  assert.ok(session.node.theme.toLowerCase().includes('architecture'));
});

test('parseSession extracts characters list', () => {
  const { session } = parseSession(path.join(fixtures, '2024-03-01-architecture-review.md'));
  assert.deepEqual(session.node.characters, ['Alice', 'Bob', 'Charlie']);
});

test('parseSession extracts flow from frontmatter', () => {
  const { session } = parseSession(path.join(fixtures, '2024-03-01-architecture-review.md'));
  assert.equal(session.node.flow, 'deep-dive');
});

test('parseSession defaults flow to quick when not specified', () => {
  const { session } = parseSession(path.join(fixtures, 'minimal-session.md'));
  assert.equal(session.node.flow, 'quick');
});

test('parseSession returns gap edges from gap markers', () => {
  const { gaps } = parseSession(path.join(fixtures, '2024-03-01-architecture-review.md'));
  assert.ok(Array.isArray(gaps));
  assert.ok(gaps.length > 0);
});

test('parseSession includes file_path in session node', () => {
  const fp = path.join(fixtures, '2024-03-01-architecture-review.md');
  const { session } = parseSession(fp);
  assert.equal(session.node.file_path, fp);
});

test('parseSession warns when filename lacks date/theme pattern', () => {
  const { session } = parseSession(path.join(fixtures, 'DD-001-test.md'));
  assert.ok(session.warnings.length > 0);
});
