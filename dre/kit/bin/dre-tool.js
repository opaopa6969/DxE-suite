#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VERSION = '0.2.1';
const command = process.argv[2];
const arg = process.argv[3];

function findClaudeDir() {
  const candidates = ['.claude', path.join(process.cwd(), '.claude')];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

function findKitDir() {
  // Look for kit via node_modules or local
  const candidates = [
    path.join(process.cwd(), 'node_modules', '@unlaxer', 'dre-toolkit'),
    path.dirname(__dirname), // kit/ itself when run locally
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'version.txt'))) return dir;
  }
  return null;
}

function cmdStatus() {
  const claudeDir = findClaudeDir();
  const kitDir = findKitDir();

  const localVersion = claudeDir
    ? (fs.existsSync(path.join(claudeDir, '.dre-version'))
        ? fs.readFileSync(path.join(claudeDir, '.dre-version'), 'utf8').trim()
        : 'unknown')
    : 'not installed';

  const kitVersion = kitDir
    ? fs.readFileSync(path.join(kitDir, 'version.txt'), 'utf8').trim()
    : 'unknown';

  console.log('DRE toolkit status');
  console.log('');
  console.log(`  Installed:  ${localVersion}`);
  console.log(`  Kit:        ${kitVersion}`);

  if (claudeDir) {
    console.log('');
    const dirs = ['rules', 'skills', 'agents', 'commands', 'profiles'];
    for (const dir of dirs) {
      const d = path.join(claudeDir, dir);
      if (fs.existsSync(d)) {
        const files = fs.readdirSync(d).filter(f => f !== '.gitkeep');
        console.log(`  .claude/${dir}/  ${files.length} ファイル`);
      }
    }
  }
}

function cmdList() {
  const kitDir = findKitDir();
  if (!kitDir) {
    console.error('ERROR: DRE toolkit not found in node_modules.');
    process.exit(1);
  }

  const dirs = ['rules', 'skills', 'agents', 'commands', 'profiles'];
  console.log('DRE toolkit — kit の内容');
  console.log('');
  for (const dir of dirs) {
    const d = path.join(kitDir, dir);
    if (fs.existsSync(d)) {
      const files = fs.readdirSync(d).filter(f => f !== '.gitkeep');
      if (files.length > 0) {
        console.log(`  ${dir}/`);
        for (const f of files) {
          console.log(`    ${f}`);
        }
      } else {
        console.log(`  ${dir}/  (空)`);
      }
    }
  }
}

function cmdSave() {
  const file = arg;
  if (!file) {
    console.error('ERROR: file path required. Usage: echo "content" | dre-tool save <file>');
    process.exit(1);
  }

  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });

  let content = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { content += chunk; });
  process.stdin.on('end', () => {
    fs.writeFileSync(file, content);
    const bytes = Buffer.byteLength(content);
    console.log(`SAVED: ${file} (${bytes} bytes)`);
  });
}

function cmdVersion() {
  console.log(`dre-tool v${VERSION}`);
}

function cmdHelp() {
  console.log(`dre-tool v${VERSION} — DRE toolkit CLI

Commands:
  status     インストール状態とバージョンを表示
  list       kit に含まれるファイル一覧
  save <file>           stdin をファイルに保存
  effective-sm          現在の state machine を Mermaid で表示
  install-plugin <yaml> plugin manifest を state-machine.yaml に merge
  version               バージョン表示
  help                  このヘルプを表示

Examples:
  dre-tool status
  dre-tool list
  echo "content" | dre-tool save .claude/rules/my-rule.md`);
}

function findDreDir() {
  const candidates = ['.dre', path.join(process.cwd(), '.dre')];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

function parseStateMachineYaml(content) {
  const phases = [];
  const lines = content.split('\n');
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
    if (nextMatch) current.next = nextMatch[1].trim() === 'null' ? null : nextMatch[1].trim();
    const pbMatch = line.match(/^    plugins_before: \[(.*)]/);
    if (pbMatch && pbMatch[1]) current.plugins_before = pbMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    const paMatch = line.match(/^    plugins_after: \[(.*)]/);
    if (paMatch && paMatch[1]) current.plugins_after = paMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  }
  if (current) phases.push(current);
  return phases;
}

function cmdEffectiveSm() {
  const dreDir = findDreDir() || '.dre';
  const smPath = path.join(dreDir, 'state-machine.yaml');
  if (!fs.existsSync(smPath)) {
    console.error(`ERROR: ${smPath} not found. Run dre-install first.`);
    process.exit(1);
  }

  const phases = parseStateMachineYaml(fs.readFileSync(smPath, 'utf8'));

  const lines = ['```mermaid', 'flowchart LR'];

  // node 定義
  for (const phase of phases) {
    const label = phase.id.replace(/_/g, ' ');
    lines.push(`  ${phase.id}([${label}])`);
  }

  // plugin before/after を intermediate node として展開
  for (const phase of phases) {
    // plugins_before: phase の前に挿入
    let prev = null;
    for (const plugin of phase.plugins_before) {
      const nodeId = `plugin_${plugin}_before_${phase.id}`;
      lines.push(`  ${nodeId}{{${plugin}}}`);
      if (prev) {
        lines.push(`  ${prev} --> ${nodeId}`);
      }
      prev = nodeId;
    }

    if (phase.plugins_before.length > 0) {
      // 前のフェーズから最初の before plugin へ
      const prevPhase = phases.find(p => p.next === phase.id);
      if (prevPhase) {
        const firstBefore = `plugin_${phase.plugins_before[0]}_before_${phase.id}`;
        // prevPhase → firstBefore → phase の順に書き換え
        // (after プラグインと合わせて下で処理)
      }
      const lastBefore = `plugin_${phase.plugins_before[phase.plugins_before.length - 1]}_before_${phase.id}`;
      lines.push(`  ${lastBefore} --> ${phase.id}`);
    }

    // plugins_after: phase の後に挿入
    let afterPrev = phase.id;
    for (const plugin of phase.plugins_after) {
      const nodeId = `plugin_${plugin}_after_${phase.id}`;
      lines.push(`  ${nodeId}{{${plugin}}}`);
      lines.push(`  ${afterPrev} --> ${nodeId}`);
      afterPrev = nodeId;
    }

    // next フェーズへの接続
    if (phase.next) {
      const nextPhase = phases.find(p => p.id === phase.next);
      if (nextPhase && nextPhase.plugins_before.length > 0) {
        // next フェーズに before plugin があれば、まず before plugin へ
        const firstBefore = `plugin_${nextPhase.plugins_before[0]}_before_${nextPhase.id}`;
        lines.push(`  ${afterPrev} --> ${firstBefore}`);
      } else {
        lines.push(`  ${afterPrev} --> ${phase.next}`);
      }
    }
  }

  // loop_until のフェーズには自己ループを追加（state-machine.yaml に loop_until があれば）
  // plugin node にループバックエッジを追加
  const smRaw = fs.readFileSync(smPath, 'utf8');
  if (smRaw.includes('loop_until')) {
    // after plugin は完了したら元のフェーズに戻れることを示す
    for (const phase of phases) {
      for (const plugin of phase.plugins_after) {
        const nodeId = `plugin_${plugin}_after_${phase.id}`;
        lines.push(`  ${nodeId} -->|loop| ${phase.id}`);
      }
    }
  }

  lines.push('```');
  console.log(lines.join('\n'));
}

function cmdInstallPlugin() {
  const manifestPath = arg;
  if (!manifestPath) {
    console.error('ERROR: manifest path required. Usage: dre-tool install-plugin <manifest.yaml>');
    process.exit(1);
  }
  if (!fs.existsSync(manifestPath)) {
    console.error(`ERROR: manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  // Parse YAML manually (simple key:value, no external deps)
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const lines = raw.split('\n');

  // Extract plugin id
  const idLine = lines.find(l => l.trim().startsWith('id:') && !l.includes('phases'));
  if (!idLine) {
    console.error('ERROR: manifest missing required field: plugin.id');
    process.exit(1);
  }
  const pluginId = idLine.split(':')[1].trim();

  // Extract phases
  const phases = [];
  let inPhase = false;
  let currentPhase = {};
  for (const line of lines) {
    if (line.trim() === '- id:' || line.match(/^\s{4}- id:/)) {
      if (Object.keys(currentPhase).length > 0) phases.push(currentPhase);
      currentPhase = { id: line.split('id:')[1].trim() };
      inPhase = true;
    } else if (inPhase) {
      const m = line.match(/^\s+(insert_after|ordering|loop_until):\s*(.+)/);
      if (m) currentPhase[m[1]] = m[2].trim();
    }
  }
  if (Object.keys(currentPhase).length > 0) phases.push(currentPhase);

  // Validate required fields per phase
  const required = ['id', 'insert_after'];
  for (const phase of phases) {
    for (const field of required) {
      if (!phase[field]) {
        console.error(`ERROR: phase missing required field "${field}" in manifest: ${manifestPath}`);
        process.exit(1);
      }
    }
  }

  if (phases.length === 0) {
    console.error('ERROR: manifest has no phases defined');
    process.exit(1);
  }

  // Load .dre/state-machine.yaml
  const dreDir = findDreDir() || '.dre';
  const smPath = path.join(dreDir, 'state-machine.yaml');
  if (!fs.existsSync(smPath)) {
    console.error(`ERROR: ${smPath} not found. Run dre-install first.`);
    process.exit(1);
  }

  let smContent = fs.readFileSync(smPath, 'utf8');

  // Check for ordering duplicates (simple: check if plugin already installed)
  if (smContent.includes(`- ${pluginId}`)) {
    console.log(`  plugin "${pluginId}" already installed — skipping`);
    return;
  }

  // Merge each phase into state-machine.yaml
  for (const phase of phases) {
    const insertAfter = phase.insert_after;
    const position = phase.ordering
      ? (parseInt(phase.ordering) < 100 ? 'plugins_before' : 'plugins_after')
      : 'plugins_before';

    // Find the target phase block and append plugin
    const regex = new RegExp(`(  - id: ${insertAfter}[\\s\\S]*?${position}: \\[\\])`, 'm');
    if (smContent.match(regex)) {
      smContent = smContent.replace(
        new RegExp(`(  - id: ${insertAfter}[\\s\\S]*?${position}: )\\[\\]`),
        `$1[${pluginId}]`
      );
    } else {
      // Already has items, append
      const appendRegex = new RegExp(`(  - id: ${insertAfter}[\\s\\S]*?${position}: \\[)(.*?)(\\])`);
      smContent = smContent.replace(appendRegex, (_, pre, mid, post) => {
        const items = mid ? `${mid}, ${pluginId}` : pluginId;
        return `${pre}${items}${post}`;
      });
    }
  }

  fs.writeFileSync(smPath, smContent);
  console.log(`  plugin "${pluginId}" installed → ${smPath}`);
  console.log(`  phases: ${phases.map(p => p.id).join(', ')}`);
}

// Dispatch
switch (command) {
  case 'status':
    cmdStatus();
    break;
  case 'list':
    cmdList();
    break;
  case 'save':
    cmdSave();
    break;
  case 'version':
  case '-v':
  case '--version':
    cmdVersion();
    break;
  case 'effective-sm':
    cmdEffectiveSm();
    break;
  case 'install-plugin':
    cmdInstallPlugin();
    break;
  case 'help':
  case '-h':
  case '--help':
  case undefined:
    cmdHelp();
    break;
  default:
    console.error(`ERROR: unknown command "${command}". Run "dre-tool help" for usage.`);
    process.exit(1);
}
