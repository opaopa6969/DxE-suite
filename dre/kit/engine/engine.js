#!/usr/bin/env node
// DRE Workflow Engine — state machine management
// Usage:
//   dre-engine init              Initialize .dre/ with base state machine
//   dre-engine install-plugin <manifest.yaml>  Merge plugin into SM
//   dre-engine status            Show current state
//   dre-engine transition <phase>  Move to phase
//   dre-engine push <phase>      Push phase onto stack (drill down)
//   dre-engine pop               Pop stack (return to previous)

const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const DRE_DIR = path.join(CWD, '.dre');
const SM_FILE = path.join(DRE_DIR, 'state-machine.yaml');
const CTX_FILE = path.join(DRE_DIR, 'context.json');

// ─── Simple YAML parser (no deps) ───

function parseYaml(text) {
  const result = { version: 1, phases: [] };
  let currentPhase = null;
  let inPlugins = null; // 'before' | 'after'

  for (const line of text.split('\n')) {
    const vMatch = line.match(/^version:\s*(\d+)/);
    if (vMatch) { result.version = parseInt(vMatch[1]); continue; }

    const phaseMatch = line.match(/^\s+-\s+id:\s*(\S+)/);
    if (phaseMatch) {
      currentPhase = { id: phaseMatch[1], next: null, description: '', plugins_before: [], plugins_after: [] };
      result.phases.push(currentPhase);
      inPlugins = null;
      continue;
    }

    if (currentPhase) {
      const nextMatch = line.match(/^\s+next:\s*(\S+)/);
      if (nextMatch) { currentPhase.next = nextMatch[1] === 'null' ? null : nextMatch[1]; continue; }

      const descMatch = line.match(/^\s+description:\s*"(.+)"/);
      if (descMatch) { currentPhase.description = descMatch[1]; continue; }

      if (/plugins_before:/.test(line)) { inPlugins = 'before'; continue; }
      if (/plugins_after:/.test(line)) { inPlugins = 'after'; continue; }

      const pluginMatch = line.match(/^\s+-\s+(\S+)/);
      if (pluginMatch && inPlugins) {
        const list = inPlugins === 'before' ? currentPhase.plugins_before : currentPhase.plugins_after;
        list.push(pluginMatch[1].replace(/#.*/, '').trim());
        continue;
      }
    }
  }
  return result;
}

function serializeYaml(sm) {
  let out = `version: ${sm.version}\nphases:\n`;
  for (const p of sm.phases) {
    out += `  - id: ${p.id}\n`;
    out += `    next: ${p.next ?? 'null'}\n`;
    if (p.description) out += `    description: "${p.description}"\n`;
    if (p.plugins_before?.length) {
      out += `    plugins_before:\n`;
      for (const pl of p.plugins_before) out += `      - ${pl}\n`;
    }
    if (p.plugins_after?.length) {
      out += `    plugins_after:\n`;
      for (const pl of p.plugins_after) out += `      - ${pl}\n`;
    }
  }
  return out;
}

function parsePluginManifest(text) {
  const manifest = { id: '', name: '', version: '', type: 'phase', phases: [], states: [] };
  let section = null;  // 'phases' | 'states' | 'phase-states'
  let currentPluginPhase = null;
  let currentState = null;

  for (const line of text.split('\n')) {
    // Top-level plugin fields (2-space indent)
    const topId = line.match(/^  id:\s*(\S+)/);
    if (topId && !manifest.id) { manifest.id = topId[1]; continue; }
    const topName = line.match(/^  name:\s*"(.+)"/);
    if (topName) { manifest.name = topName[1]; continue; }
    const topVer = line.match(/^  version:\s*"(.+)"/);
    if (topVer) { manifest.version = topVer[1]; continue; }
    const topType = line.match(/^  type:\s*(\S+)/);
    if (topType) { manifest.type = topType[1]; continue; }

    // Section detection
    if (/^  phases:/.test(line)) { section = 'phases'; continue; }
    if (/^  states:/.test(line)) { section = 'top-states'; continue; }

    // Sub-states within a phase
    if (/^\s{6}states:/.test(line)) { section = 'phase-states'; continue; }

    if (section === 'phases') {
      const phaseId = line.match(/^\s{4}-\s+id:\s*(\S+)/);
      if (phaseId) {
        currentPluginPhase = { id: phaseId[1], insert_after: '', ordering: 999, description: '', states: [] };
        manifest.phases.push(currentPluginPhase);
        currentState = null;
        continue;
      }
      if (currentPluginPhase) {
        const ia = line.match(/insert_after:\s*(\S+)/);
        if (ia) { currentPluginPhase.insert_after = ia[1]; continue; }
        const ord = line.match(/ordering:\s*(\d+)/);
        if (ord) { currentPluginPhase.ordering = parseInt(ord[1]); continue; }
        const desc = line.match(/description:\s*"(.+)"/);
        if (desc && !currentState) { currentPluginPhase.description = desc[1]; continue; }
      }
    }

    // Parse state entries (either phase sub-states or top-level states)
    if (section === 'phase-states' || section === 'top-states') {
      const stateId = line.match(/^\s+-\s+id:\s*(\S+)/);
      if (stateId) {
        currentState = { id: stateId[1], next: null, description: '' };
        if (section === 'phase-states' && currentPluginPhase) {
          currentPluginPhase.states.push(currentState);
        } else {
          manifest.states.push(currentState);
        }
        continue;
      }
      if (currentState) {
        const next = line.match(/next:\s*(\S+)/);
        if (next) { currentState.next = next[1] === 'null' ? null : next[1]; continue; }
        const desc = line.match(/description:\s*"(.+)"/);
        if (desc) { currentState.description = desc[1]; continue; }
      }
    }
  }
  return manifest;
}

// ─── Context management ───

function loadContext() {
  if (!fs.existsSync(CTX_FILE)) {
    return { current_phase: null, sub_state: null, stack: [], frames: {}, plugins_sm: {}, history: [] };
  }
  const ctx = JSON.parse(fs.readFileSync(CTX_FILE, 'utf-8'));
  if (!ctx.plugins_sm) ctx.plugins_sm = {};
  if (!ctx.sub_state) ctx.sub_state = null;
  return ctx;
}

function saveContext(ctx) {
  fs.mkdirSync(DRE_DIR, { recursive: true });
  fs.writeFileSync(CTX_FILE, JSON.stringify(ctx, null, 2) + '\n');
}

function loadSM() {
  if (!fs.existsSync(SM_FILE)) return null;
  return parseYaml(fs.readFileSync(SM_FILE, 'utf-8'));
}

// ─── Commands ───

function init() {
  fs.mkdirSync(DRE_DIR, { recursive: true });

  // Copy base state machine
  const baseSM = path.join(__dirname, 'state-machine.yaml');
  if (fs.existsSync(baseSM)) {
    fs.copyFileSync(baseSM, SM_FILE);
  } else {
    // Generate default
    const defaultSM = {
      version: 1,
      phases: [
        { id: 'backlog', next: 'spec', description: 'Requirements gathering' },
        { id: 'spec', next: 'impl', description: 'Design and architecture' },
        { id: 'impl', next: 'review', description: 'Build features' },
        { id: 'review', next: 'release', description: 'Review and stabilization' },
        { id: 'release', next: null, description: 'Release and maintenance' },
      ],
    };
    fs.writeFileSync(SM_FILE, serializeYaml(defaultSM));
  }

  // Initialize context
  const ctx = {
    current_phase: 'backlog',
    stack: ['backlog'],
    frames: {},
    history: [{ phase: 'backlog', timestamp: new Date().toISOString(), action: 'init' }],
  };
  saveContext(ctx);

  // Auto-detect and install plugins
  const pluginsDir = path.join(__dirname, '..', 'plugins');
  if (fs.existsSync(pluginsDir)) {
    for (const file of fs.readdirSync(pluginsDir).filter(f => f.endsWith('.yaml'))) {
      const manifest = parsePluginManifest(fs.readFileSync(path.join(pluginsDir, file), 'utf-8'));
      // Check if plugin is installed in project
      const pluginDir = path.join(CWD, manifest.id);
      if (fs.existsSync(pluginDir) && manifest.phases.length > 0) {
        installPlugin(path.join(pluginsDir, file), true);
      }
    }
  }

  console.log(`\nDRE workflow engine initialized.`);
  console.log(`  ${SM_FILE}`);
  console.log(`  ${CTX_FILE}`);
  status();
}

function installPlugin(manifestPath, quiet = false) {
  const manifest = parsePluginManifest(fs.readFileSync(manifestPath, 'utf-8'));
  if (!manifest.id || manifest.phases.length === 0) {
    if (!quiet) console.error('Invalid plugin manifest or no phases to add.');
    return;
  }

  const sm = loadSM();
  if (!sm) { console.error('.dre/state-machine.yaml not found. Run dre-engine init first.'); return; }

  for (const phase of manifest.phases) {
    // Check if already inserted
    if (sm.phases.some(p => p.id === phase.id)) {
      if (!quiet) console.log(`  Phase "${phase.id}" already exists. Skipping.`);
      continue;
    }

    const insertIdx = sm.phases.findIndex(p => p.id === phase.insert_after);
    if (insertIdx < 0) {
      if (!quiet) console.error(`  Phase "${phase.insert_after}" not found. Cannot insert "${phase.id}".`);
      continue;
    }

    // Insert after
    const newPhase = {
      id: phase.id,
      next: sm.phases[insertIdx].next,
      description: phase.description || `${manifest.name} phase`,
      plugins_before: [],
      plugins_after: [],
    };
    sm.phases[insertIdx].next = phase.id;
    sm.phases.splice(insertIdx + 1, 0, newPhase);

    if (!quiet) console.log(`  Inserted phase "${phase.id}" after "${phase.insert_after}"`);
  }

  fs.writeFileSync(SM_FILE, serializeYaml(sm));

  // Save plugin sub-states to context
  const ctx = loadContext();
  for (const phase of manifest.phases) {
    if (phase.states && phase.states.length > 0) {
      ctx.plugins_sm[phase.id] = {
        plugin: manifest.id,
        states: phase.states,
        current: null,
      };
    }
  }
  // Also save top-level tool states
  if (manifest.states && manifest.states.length > 0) {
    ctx.plugins_sm[manifest.id] = {
      plugin: manifest.id,
      type: manifest.type,
      states: manifest.states,
      current: null,
    };
  }
  saveContext(ctx);

  if (!quiet) console.log(`\nState machine updated: ${SM_FILE}`);
}

function status() {
  const sm = loadSM();
  const ctx = loadContext();

  if (!sm) {
    console.log('\n  .dre/ not initialized. Run: dre-engine init');
    return;
  }

  const current = ctx.current_phase || 'unknown';
  const BASE = ['backlog', 'spec', 'impl', 'review', 'release'];
  const flow = sm.phases.map(p => {
    const isActive = p.id === current;
    const isPlugin = !BASE.includes(p.id);
    const label = p.id;
    if (isActive) return `[\u25B6 ${label}]`;
    return isPlugin ? `{${label}}` : label;
  });

  console.log(`\n  Workflow: ${flow.join(' \u2192 ')}`);
  console.log(`  Current:  ${current}`);

  // Sub-state display
  const pluginSM = ctx.plugins_sm?.[current];
  if (pluginSM && pluginSM.states?.length > 0) {
    const subCurrent = pluginSM.current || pluginSM.states[0]?.id;
    const subFlow = pluginSM.states.map(s => {
      if (s.id === subCurrent) return `[\u25B6 ${s.id}]`;
      return s.id;
    });
    console.log(`  Sub-state: ${subFlow.join(' \u2192 ')}`);
  }

  if (ctx.stack.length > 1) {
    console.log(`  Stack:    ${ctx.stack.join(' > ')}`);
  }

  // Plugins with sub-states
  const plugins = Object.entries(ctx.plugins_sm || {});
  if (plugins.length > 0) {
    console.log(`  Plugins:`);
    for (const [phaseId, psm] of plugins) {
      const stateCount = psm.states?.length ?? 0;
      const subLabel = psm.current ? ` → ${psm.current}` : '';
      console.log(`    ${psm.plugin}: ${phaseId} (${stateCount} sub-states${subLabel})`);
    }
  }

  // Recent history
  if (ctx.history?.length > 0) {
    console.log(`  History:`);
    for (const h of ctx.history.slice(-5)) {
      console.log(`    ${h.timestamp.split('T')[0]} ${h.action}: ${h.phase}`);
    }
  }
}

function transition(targetPhase) {
  const sm = loadSM();
  const ctx = loadContext();

  if (!sm) { console.error('.dre/ not initialized.'); process.exit(1); }

  const phaseExists = sm.phases.some(p => p.id === targetPhase);
  if (!phaseExists) {
    console.error(`Phase "${targetPhase}" not in state machine.`);
    console.error(`Available: ${sm.phases.map(p => p.id).join(', ')}`);
    process.exit(1);
  }

  const prev = ctx.current_phase;
  ctx.current_phase = targetPhase;
  ctx.stack = [targetPhase];
  ctx.history = ctx.history || [];
  ctx.history.push({
    phase: targetPhase,
    timestamp: new Date().toISOString(),
    action: `transition from ${prev}`,
  });

  saveContext(ctx);
  console.log(`\n  ${prev} \u2192 ${targetPhase}`);
  status();
}

function subTransition(subState) {
  const ctx = loadContext();
  const current = ctx.current_phase;
  const pluginSM = ctx.plugins_sm?.[current];

  if (!pluginSM || !pluginSM.states?.length) {
    console.error(`No sub-states defined for phase "${current}".`);
    process.exit(1);
  }

  const stateExists = pluginSM.states.some(s => s.id === subState);
  if (!stateExists) {
    console.error(`Sub-state "${subState}" not found in ${current}.`);
    console.error(`Available: ${pluginSM.states.map(s => s.id).join(', ')}`);
    process.exit(1);
  }

  const prev = pluginSM.current;
  pluginSM.current = subState;
  ctx.sub_state = subState;
  ctx.history = ctx.history || [];
  ctx.history.push({
    phase: `${current}/${subState}`,
    timestamp: new Date().toISOString(),
    action: prev ? `sub-transition from ${prev}` : 'sub-transition (enter)',
  });

  saveContext(ctx);
  console.log(`\n  ${current}: ${prev || '(start)'} \u2192 ${subState}`);
  status();
}

function push(phase) {
  const ctx = loadContext();
  ctx.stack.push(phase);
  ctx.current_phase = phase;
  ctx.history = ctx.history || [];
  ctx.history.push({
    phase,
    timestamp: new Date().toISOString(),
    action: 'push (drill down)',
  });
  saveContext(ctx);
  console.log(`\n  Pushed: ${phase} (stack: ${ctx.stack.join(' > ')})`);
}

function pop() {
  const ctx = loadContext();
  if (ctx.stack.length <= 1) {
    console.log('  Stack is at root. Nothing to pop.');
    return;
  }
  const popped = ctx.stack.pop();
  ctx.current_phase = ctx.stack[ctx.stack.length - 1];
  ctx.history = ctx.history || [];
  ctx.history.push({
    phase: ctx.current_phase,
    timestamp: new Date().toISOString(),
    action: `pop (returned from ${popped})`,
  });
  saveContext(ctx);
  console.log(`\n  Popped: ${popped} \u2192 back to ${ctx.current_phase}`);
  status();
}

// ─── Main ───

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case 'init': init(); break;
  case 'install-plugin':
    if (!args[0]) { console.error('Usage: dre-engine install-plugin <manifest.yaml>'); process.exit(1); }
    installPlugin(args[0]); break;
  case 'status': status(); break;
  case 'transition':
    if (!args[0]) { console.error('Usage: dre-engine transition <phase>'); process.exit(1); }
    transition(args[0]); break;
  case 'sub-transition': {
    if (!args[0]) { console.error('Usage: dre-engine sub-transition <sub-state>'); process.exit(1); }
    subTransition(args[0]); break;
  }
  case 'push':
    if (!args[0]) { console.error('Usage: dre-engine push <phase>'); process.exit(1); }
    push(args[0]); break;
  case 'pop': pop(); break;
  default:
    console.log(`
  DRE Workflow Engine

  Commands:
    init                          Initialize .dre/ with state machine
    install-plugin <manifest>     Merge plugin phases into SM
    status                        Show current workflow state + sub-state
    transition <phase>            Move to top-level phase
    sub-transition <sub-state>    Move to sub-state within current phase
    push <phase>                  Push phase onto stack (drill down)
    pop                           Pop stack (return to previous)
    `);
}
