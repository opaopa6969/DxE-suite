#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VERSION = '0.1.0';
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
  save <file> stdin をファイルに保存
  version    バージョン表示
  help       このヘルプを表示

Examples:
  dre-tool status
  dre-tool list
  echo "content" | dre-tool save .claude/rules/my-rule.md`);
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
