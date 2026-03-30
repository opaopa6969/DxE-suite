#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VERSION = '1.0.0';
const command = process.argv[2];
const arg = process.argv[3];

function findFlowsDir() {
  // Look for dge/flows/ from current directory
  const candidates = ['dge/flows', 'flows'];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

function cmdSave() {
  const file = arg;
  if (!file) {
    console.error('ERROR: file path required. Usage: echo "content" | dge-tool save <file>');
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

function cmdPrompt() {
  const flow = arg || 'quick';
  const flowsDir = findFlowsDir();
  const yamlFile = flowsDir ? path.join(flowsDir, `${flow}.yaml`) : null;

  if (yamlFile && fs.existsSync(yamlFile)) {
    const content = fs.readFileSync(yamlFile, 'utf8');
    const lines = content.split('\n');

    // Extract display_name from post_actions section
    let inPostActions = false;
    const actions = [];
    for (const line of lines) {
      if (line.match(/^post_actions:/)) {
        inPostActions = true;
        continue;
      }
      if (inPostActions && line.match(/^\S/) && !line.match(/^\s/)) {
        break; // End of post_actions section
      }
      if (inPostActions) {
        const match = line.match(/display_name:\s*"(.+?)"/);
        if (match) actions.push(match[1]);
      }
    }

    if (actions.length > 0) {
      actions.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a}`);
      });
      return;
    }
  }

  // Default choices
  console.log('  1. DGE を回す');
  console.log('  2. 実装できるまで回す');
  console.log('  3. 実装する');
  console.log('  4. 素の LLM でも回してマージ');
  console.log('  5. 後で');
}

function cmdVersion() {
  console.log(`dge-tool v${VERSION}`);
}

function cmdHelp() {
  console.log(`dge-tool v${VERSION} — DGE MUST enforcement CLI

Commands:
  save <file>       Save stdin to file (ensures MUST: always save)
  prompt [flow]     Show numbered choices from flow YAML (ensures MUST: show choices)
  version           Show version
  help              Show this help

Examples:
  echo "session content" | dge-tool save dge/sessions/auth-api.md
  dge-tool prompt quick
  dge-tool prompt design-review`);
}

// Dispatch
switch (command) {
  case 'save':
    cmdSave();
    break;
  case 'prompt':
    cmdPrompt();
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
    console.error(`ERROR: unknown command "${command}". Run "dge-tool help" for usage.`);
    process.exit(1);
}
