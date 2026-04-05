// DRE state machine 静的検証テスト
// 依存: Node.js 標準ライブラリのみ（Jest 不要、node で直接実行可）

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

// YAML をシンプルにパースして phases 配列を返す
function parseStateMachine(yamlContent) {
  const phases = [];
  const lines = yamlContent.split('\n');
  let current = null;

  for (const line of lines) {
    const idMatch = line.match(/^  - id: (.+)/);
    if (idMatch) {
      if (current) phases.push(current);
      current = { id: idMatch[1].trim(), next: null, plugins_before: [], plugins_after: [] };
      continue;
    }
    if (!current) continue;

    const nextMatch = line.match(/^    next: (.+)/);
    if (nextMatch) {
      const val = nextMatch[1].trim();
      current.next = val === 'null' ? null : val;
    }

    const pbMatch = line.match(/^    plugins_before: \[(.*)]/);
    if (pbMatch && pbMatch[1]) {
      current.plugins_before = pbMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }

    const paMatch = line.match(/^    plugins_after: \[(.*)]/);
    if (paMatch && paMatch[1]) {
      current.plugins_after = paMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (current) phases.push(current);
  return phases;
}

function validateStateMachine(phases) {
  const phaseIds = new Set(phases.map(p => p.id));

  console.log('\n[1] 全フェーズの到達可能性（dead state 検出）');
  // 開始フェーズ（どのフェーズの next にも含まれない）を探す
  const reachableFromStart = new Set();
  const nexts = phases.map(p => p.next).filter(Boolean);
  const startPhases = phases.filter(p => !nexts.includes(p.id));
  assert(startPhases.length >= 1, `開始フェーズが存在する（${startPhases.map(p => p.id).join(', ')}）`);

  // BFS で到達可能なフェーズを列挙
  const queue = [...startPhases.map(p => p.id)];
  while (queue.length > 0) {
    const id = queue.shift();
    if (reachableFromStart.has(id)) continue;
    reachableFromStart.add(id);
    const phase = phases.find(p => p.id === id);
    if (phase && phase.next) queue.push(phase.next);
  }
  for (const phase of phases) {
    assert(reachableFromStart.has(phase.id), `フェーズ "${phase.id}" は到達可能`);
  }

  console.log('\n[2] next フィールドの参照整合性');
  for (const phase of phases) {
    if (phase.next !== null) {
      assert(phaseIds.has(phase.next), `"${phase.id}".next → "${phase.next}" が存在する`);
    } else {
      assert(true, `"${phase.id}" は終端フェーズ（next: null）`);
    }
  }

  console.log('\n[3] 終端フェーズが1つ以上存在する');
  const terminals = phases.filter(p => p.next === null);
  assert(terminals.length >= 1, `終端フェーズが存在する（${terminals.map(p => p.id).join(', ')}）`);

  console.log('\n[4] plugin 参照の整合性（plugins_before / plugins_after）');
  // plugin id は文字列なので存在確認は省略、重複チェックのみ
  for (const phase of phases) {
    const all = [...phase.plugins_before, ...phase.plugins_after];
    const unique = new Set(all);
    assert(all.length === unique.size, `"${phase.id}" の plugin 定義に重複がない`);
  }
}

// テスト実行
const smPath = path.join(__dirname, '../../.dre/state-machine.yaml');
console.log('DRE State Machine 静的検証');
console.log(`  対象: ${smPath}`);

if (!fs.existsSync(smPath)) {
  console.error(`ERROR: ${smPath} が見つかりません`);
  process.exit(1);
}

const content = fs.readFileSync(smPath, 'utf8');
const phases = parseStateMachine(content);
console.log(`  フェーズ数: ${phases.length}`);

validateStateMachine(phases);

console.log(`\n結果: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
