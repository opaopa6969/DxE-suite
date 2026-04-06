#!/usr/bin/env node
// dxe — DxE Suite CLI (monorepo)
// Usage:
//   npx dxe install          DGE + DRE をインストール
//   npx dxe install dge      DGE のみ
//   npx dxe update           全toolkit をアップデート
//   npx dxe status           バージョン確認

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// --- Monorepo root detection ---
const SCRIPT_DIR = path.resolve(__dirname, '..');
function isMonorepo() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(SCRIPT_DIR, 'package.json'), 'utf8'));
    return pkg.private === true && Array.isArray(pkg.workspaces);
  } catch { return false; }
}
const MONO = isMonorepo();

// --- i18n ---
function detectLang(argv) {
  const flag = argv.find(a => a.startsWith('--lang='));
  if (flag) return flag.split('=')[1];
  const env = process.env.LANG || '';
  return (env.startsWith('en') || env === 'C' || env === 'POSIX') ? 'en' : 'ja';
}

const MESSAGES = {
  ja: {
    installing:  name => `\n[${name}] installing...`,
    updating:    name => `\n[${name}] updating...`,
    notInstalled:      'not installed',
    unknownToolkit:    name => `Unknown toolkit: ${name}`,
    agentHint:   (desc, phrase) => `  ${desc} → コーディングエージェントで ${phrase}`,
    help: `
  DxE Suite — DGE / DRE toolkit manager (monorepo)

  Usage:
    npx dxe install           DGE + DRE をインストール
    npx dxe install dge       DGE のみ
    npx dxe install dre       DRE のみ
    npx dxe install dde       DDE (別リポジトリ)
    npx dxe update            全toolkit をアップデート
    npx dxe update --yes      確認なしでアップデート
    npx dxe status            インストール済みバージョンを表示
    `,
  },
  en: {
    installing:  name => `\n[${name}] installing...`,
    updating:    name => `\n[${name}] updating...`,
    notInstalled:      'not installed',
    unknownToolkit:    name => `Unknown toolkit: ${name}`,
    agentHint:   (desc, phrase) => `  ${desc} → tell your coding agent ${phrase}`,
    help: `
  DxE Suite — DGE / DRE toolkit manager (monorepo)

  Usage:
    npx dxe install           install DGE + DRE
    npx dxe install dge       DGE only
    npx dxe install dre       DRE only
    npx dxe install dde       DDE (separate repo)
    npx dxe update            update all toolkits
    npx dxe update --yes      update without confirmation
    npx dxe status            show installed versions
    `,
  },
};

// --- Toolkit definitions ---
// localKit: monorepo path relative to SCRIPT_DIR
const TOOLKITS = {
  dge: {
    pkg: '@unlaxer/dge-toolkit',
    localKit: 'dge/kit',
    install: 'install.sh', update: 'update.sh',
    desc: { ja: '会話劇で設計の gap を抽出', en: 'extract design gaps via dialogue' },
    phrase: { ja: '「DGE して」', en: '"run DGE"' },
  },
  dde: {
    pkg: '@unlaxer/dde-toolkit',
    localKit: null,  // not in monorepo
    install: 'dde-install', update: 'dde-update',
    desc: { ja: 'ドキュメントの穴を補完',    en: 'fill documentation deficits' },
    phrase: { ja: '「DDE して」', en: '"run DDE"' },
  },
  dre: {
    pkg: '@unlaxer/dre-toolkit',
    localKit: 'dre/kit',
    install: 'install.sh', update: 'update.sh',
    desc: { ja: 'rules/skills を配布・管理', en: 'distribute & manage rules/skills' },
    phrase: { ja: '「DRE して」', en: '"run DRE"' },
  },
  dve: {
    pkg: '@unlaxer/dve-toolkit',
    localKit: 'dve/kit',
    install: null, update: null,  // DVE uses its own CLI
    desc: { ja: '決定の可視化', en: 'decision visualization' },
    phrase: { ja: '「DVE で見せて」', en: '"show me in DVE"' },
  },
};

const rawArgs = process.argv.slice(2);
const lang = detectLang(rawArgs);
const M = MESSAGES[lang] || MESSAGES.ja;

// Strip flags from args
const hasYes = rawArgs.includes('--yes') || rawArgs.includes('-y');
const cleanArgs = rawArgs.filter(a => !a.startsWith('--lang=') && a !== '--yes' && a !== '-y');
const [command, ...targets_] = cleanArgs;
const DEFAULT_TOOLKITS = ['dge', 'dre', 'dve'];
const targets = targets_.length > 0 ? targets_ : DEFAULT_TOOLKITS;

function run(cmd, extraEnv) {
  console.log(`\n  → ${cmd}`);
  const env = extraEnv ? { ...process.env, ...extraEnv } : undefined;
  execSync(cmd, { stdio: 'inherit', ...(env && { env }) });
}

function kitDir(tk) {
  if (MONO && tk.localKit) {
    return path.join(SCRIPT_DIR, tk.localKit);
  }
  // Fallback: npm installed
  const npmPath = path.join(process.cwd(), 'node_modules', ...tk.pkg.split('/'));
  if (fs.existsSync(npmPath)) return npmPath;
  return null;
}

function runScript(tk, scriptName, extraEnv) {
  const dir = kitDir(tk);
  if (!dir) {
    console.error(`  Error: ${tk.pkg} not found`);
    process.exit(1);
  }
  const script = path.join(dir, scriptName);
  const cmd = hasYes ? `echo y | bash "${script}"` : `bash "${script}"`;
  run(cmd, { ...extraEnv, DXE_LANG: lang });
}

function readVersion(tk) {
  const dir = kitDir(tk);
  if (!dir) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return pkg.version;
  } catch {
    try { return fs.readFileSync(path.join(dir, 'version.txt'), 'utf8').trim(); }
    catch { return null; }
  }
}

if (command === 'install') {
  const installed = [];
  for (const name of targets) {
    const tk = TOOLKITS[name];
    if (!tk) { console.error(M.unknownToolkit(name)); process.exit(1); }
    console.log(M.installing(name.toUpperCase()));

    if (!tk.install) {
      // No install script (e.g. DVE — uses its own CLI)
      console.log(`  ${name.toUpperCase()}: no install script (use its own CLI)`);
      installed.push(tk);
      continue;
    } else if (MONO && tk.localKit) {
      // Monorepo: run install.sh directly from local kit
      runScript(tk, tk.install);
    } else {
      // npm mode (DDE or non-monorepo)
      run(`npm install ${tk.pkg}@latest`);
      run(`npx ${tk.install}`, { DXE_LANG: lang });
    }
    installed.push(tk);
  }
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const tk of installed) {
    console.log(M.agentHint(tk.desc[lang], tk.phrase[lang]));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

} else if (command === 'update') {
  for (const name of targets) {
    const tk = TOOLKITS[name];
    if (!tk) { console.error(M.unknownToolkit(name)); process.exit(1); }
    console.log(M.updating(name.toUpperCase()));

    if (!tk.update) {
      console.log(`  ${name.toUpperCase()}: no update script (use its own CLI)`);
      continue;
    } else if (MONO && tk.localKit) {
      // Monorepo: run update.sh directly from local kit
      runScript(tk, tk.update);
    } else {
      // npm mode
      run(`npm install ${tk.pkg}@latest`);
      const cmd = hasYes ? `echo y | npx ${tk.update}` : `npx ${tk.update}`;
      run(cmd, { DXE_LANG: lang });
    }
  }

} else if (command === 'status') {
  console.log(MONO ? '\n  Mode: monorepo\n' : '\n  Mode: npm\n');
  for (const [name, tk] of Object.entries(TOOLKITS)) {
    const v = readVersion(tk);
    if (v) {
      console.log(`  ${name.toUpperCase()}: ${v}`);
    } else {
      console.log(`  ${name.toUpperCase()}: ${M.notInstalled}`);
    }
  }
  console.log('');

} else {
  console.log(M.help);
}
