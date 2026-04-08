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
    return Array.isArray(pkg.workspaces) && pkg.workspaces.length > 0;
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
    npx dxe activate all      全スキル有効化
    npx dxe activate dge      DGE スキルのみ有効化
    npx dxe deactivate dve    DVE スキルを無効化
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
    npmInstall: 'dge-install', npmUpdate: 'dge-update',
    desc: { ja: '会話劇で設計の gap を抽出', en: 'extract design gaps via dialogue' },
    phrase: { ja: '「DGE して」', en: '"run DGE"' },
  },
  dde: {
    pkg: '@unlaxer/dde-toolkit',
    localKit: 'dde/kit',
    install: 'bin/dde-install.js', update: null,
    npmInstall: 'dde-install', npmUpdate: 'dde-update',
    runWith: 'node',  // not bash
    desc: { ja: 'ドキュメントの穴を補完',    en: 'fill documentation deficits' },
    phrase: { ja: '「DDE して」', en: '"run DDE"' },
  },
  dre: {
    pkg: '@unlaxer/dre-toolkit',
    localKit: 'dre/kit',
    install: 'install.sh', update: 'update.sh',
    npmInstall: 'dre-install', npmUpdate: 'dre-update',
    desc: { ja: 'rules/skills を配布・管理', en: 'distribute & manage rules/skills' },
    phrase: { ja: '「DRE して」', en: '"run DRE"' },
  },
  dve: {
    pkg: '@unlaxer/dve-toolkit',
    localKit: 'dve/kit',
    install: 'install.sh', update: 'update.sh',
    npmInstall: 'dve-install', npmUpdate: 'dve-update',
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
  if (!scriptName) {
    console.log(`  ${tk.pkg}: no ${extraEnv ? 'update' : 'install'} script`);
    return;
  }
  const dir = kitDir(tk);
  if (!dir) {
    console.error(`  Error: ${tk.pkg} not found`);
    process.exit(1);
  }
  const script = path.join(dir, scriptName);
  const runner = tk.runWith || 'bash';
  const cmd = hasYes ? `echo y | ${runner} "${script}"` : `${runner} "${script}"`;
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

    if (MONO && tk.localKit) {
      // Monorepo: run install.sh directly from local kit
      runScript(tk, tk.install);
    } else {
      // npm mode
      run(`npm install ${tk.pkg}@latest`);
      const npmCmd = tk.npmInstall || tk.install;
      run(`npx ${npmCmd}`, { DXE_LANG: lang });
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

    if (MONO && tk.localKit) {
      // Monorepo: run update.sh directly from local kit
      runScript(tk, tk.update);
    } else {
      // npm mode
      run(`npm install ${tk.pkg}@latest`);
      const npmCmd = tk.npmUpdate || tk.update;
      const cmd = hasYes ? `echo y | npx ${npmCmd}` : `npx ${npmCmd}`;
      run(cmd, { DXE_LANG: lang });
    }

    // Show changelog for new features
    const dir = kitDir(tk);
    if (dir) {
      const clPath = path.join(dir, 'CHANGELOG.md');
      if (fs.existsSync(clPath)) {
        const cl = fs.readFileSync(clPath, 'utf8');
        // Show latest version section (first ## block)
        const match = cl.match(/## v[\d.]+[^\n]*\n([\s\S]*?)(?=\n## |\n*$)/);
        if (match) {
          const features = match[1].trim().split('\n').filter(l => l.startsWith('- 🆕'));
          if (features.length > 0) {
            console.log(`\n  📋 New in ${name.toUpperCase()}:`);
            for (const f of features) {
              console.log(`    ${f}`);
            }
          }
        }
      }
    }
  }

  // Slack notification for updates
  if (process.env.DRE_NOTIFY_URL) {
    const names = targets.map(n => n.toUpperCase()).join(', ');
    try {
      const { execSync } = require('child_process');
      execSync(`curl -sf -X POST "${process.env.DRE_NOTIFY_URL}" -H 'Content-Type: application/json' -d '{"text": "[DxE update] ${names} updated in ${path.basename(process.cwd())}"}'`, { timeout: 5000 });
    } catch {}
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

} else if (command === 'activate') {
  const skillsDir = path.join(process.cwd(), '.claude', 'skills');
  const disabledDir = path.join(skillsDir, 'disabled');

  if (!fs.existsSync(disabledDir)) {
    console.log('\n  No disabled skills found.');
    process.exit(0);
  }

  // Skill prefixes per toolkit
  const SKILL_PREFIXES = {
    dge: ['dge-'],
    dde: ['dde-'],
    dre: ['dre-', 'dxe-', 'architect-', 'backlog-', 'doc-to-', 'phase', 'release', 'spec-', 'story-', 'test'],
    dve: ['dve-'],
    all: null, // all skills
  };

  const target = (targets_[0] || 'all').toLowerCase();
  const prefixes = SKILL_PREFIXES[target];

  if (target !== 'all' && !SKILL_PREFIXES[target]) {
    console.error(`Unknown toolkit: ${target}. Use: dge / dde / dre / dve / all`);
    process.exit(1);
  }

  const disabled = fs.readdirSync(disabledDir).filter(f => f.endsWith('.md'));
  let activated = 0;

  for (const file of disabled) {
    const match = prefixes === null || prefixes.some(p => file.startsWith(p));
    if (!match) continue;

    const src = path.join(disabledDir, file);
    const dst = path.join(skillsDir, file);
    if (!fs.existsSync(dst)) {
      fs.renameSync(src, dst);
      console.log(`  ✅ ${file}`);
      activated++;
    }
  }

  if (activated === 0) {
    console.log(`\n  No disabled ${target === 'all' ? '' : target.toUpperCase() + ' '}skills to activate.`);
  } else {
    console.log(`\n  ${activated} skill(s) activated.`);
  }

} else if (command === 'deactivate') {
  const skillsDir = path.join(process.cwd(), '.claude', 'skills');
  const disabledDir = path.join(skillsDir, 'disabled');

  const SKILL_PREFIXES = {
    dge: ['dge-'],
    dde: ['dde-'],
    dre: ['dre-', 'architect-', 'backlog-', 'doc-to-', 'phase', 'release', 'spec-', 'story-', 'test'],
    dve: ['dve-'],
  };

  const target = (targets_[0] || '').toLowerCase();
  if (!SKILL_PREFIXES[target]) {
    console.error('Usage: dxe deactivate <dge|dde|dre|dve>');
    process.exit(1);
  }

  const PROTECTED = ['dxe-command.md', 'dre-activate.md'];
  const prefixes = SKILL_PREFIXES[target];
  const skills = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir).filter(f => f.endsWith('.md')) : [];
  let deactivated = 0;

  fs.mkdirSync(disabledDir, { recursive: true });

  for (const file of skills) {
    if (PROTECTED.includes(file)) continue;
    const match = prefixes.some(p => file.startsWith(p));
    if (!match) continue;

    const src = path.join(skillsDir, file);
    const dst = path.join(disabledDir, file);
    fs.renameSync(src, dst);
    console.log(`  ⏸️  ${file}`);
    deactivated++;
  }

  console.log(`\n  ${deactivated} skill(s) deactivated.`);

} else {
  console.log(M.help);
}
