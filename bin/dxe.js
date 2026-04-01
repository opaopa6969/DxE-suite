#!/usr/bin/env node
// dxe — DxE Suite CLI
// Usage:
//   npx dxe install          全toolkit をインストール
//   npx dxe install dge      DGE のみ
//   npx dxe install dde dre  DDE + DRE
//   npx dxe update           全toolkit をアップデート
//   npx dxe status           インストール済みバージョンを表示

const { execSync } = require('child_process');
const path = require('path');

const TOOLKITS = {
  dge: { pkg: '@unlaxer/dge-toolkit', install: 'dge-install', update: 'dge-update', phrase: '「DGE して」' },
  dde: { pkg: '@unlaxer/dde-toolkit', install: 'dde-install', update: 'dde-update', phrase: '「DDE して」' },
  dre: { pkg: '@unlaxer/dre-toolkit', install: 'dre-install', update: 'dre-update', phrase: '「DRE して」' },
};

const [,, command, ...args] = process.argv;
const targets = args.length > 0 ? args : Object.keys(TOOLKITS);

function run(cmd) {
  console.log(`\n  → ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

if (command === 'install') {
  const installed = [];
  for (const name of targets) {
    const tk = TOOLKITS[name];
    if (!tk) { console.error(`Unknown toolkit: ${name}`); process.exit(1); }
    console.log(`\n[${name.toUpperCase()}] installing...`);
    run(`npm install ${tk.pkg}`);
    run(`npx ${tk.install}`);
    installed.push(tk);
  }
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const tk of installed) {
    console.log(`  Claude Code で ${tk.phrase} と言えば起動します。`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
} else if (command === 'update') {
  for (const name of targets) {
    const tk = TOOLKITS[name];
    if (!tk) { console.error(`Unknown toolkit: ${name}`); process.exit(1); }
    console.log(`\n[${name.toUpperCase()}] updating...`);
    run(`npm install ${tk.pkg}@latest`);
    run(`npx ${tk.update}`);
  }
} else if (command === 'status') {
  for (const [name, tk] of Object.entries(TOOLKITS)) {
    try {
      const pkg = require(path.join(process.cwd(), 'node_modules', tk.pkg, 'package.json'));
      console.log(`  ${name.toUpperCase()}: ${pkg.version}`);
    } catch {
      console.log(`  ${name.toUpperCase()}: not installed`);
    }
  }
} else {
  console.log(`
  DxE Suite — DGE / DDE / DRE toolkit manager

  Usage:
    npx dxe install           全toolkit をインストール
    npx dxe install dge       DGE のみ
    npx dxe install dde dre   DDE + DRE
    npx dxe update            全toolkit をアップデート
    npx dxe status            インストール済みバージョンを表示
  `);
}
