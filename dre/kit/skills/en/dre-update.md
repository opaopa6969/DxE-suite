<!-- DRE-toolkit (MIT License) -->

# Skill: DRE toolkit Update

## Trigger
When the user says any of the following:
- "update DRE"
- "dre update"
- "update rules" (in a DRE-installed project)

## Steps

### Step 1: Check current version
Read `.claude/.dre-version` and display the local version.
If the file doesn't exist: "No version info found (pre-v0.1.0 install)."

### Step 2: Find update source
Look for update source in priority order:
1. `node_modules/@unlaxer/dre-toolkit/version.txt` — if npm installed
2. Ask the user for the source path — if not using npm

If npm, compare `node_modules/@unlaxer/dre-toolkit/version.txt` with `.claude/.dre-version`:
```
Installed: v0.1.0
Available: v0.2.0
```

### Step 3: Explain what will be updated
Show the following and ask for confirmation:

```
The following files will be updated (customized files will be skipped):
- .claude/rules/*.md
- .claude/skills/*.md
- .claude/agents/*.md
- .claude/commands/*.md
- .claude/profiles/*.md

Customized files will NOT be overwritten.
Only new files will be added.

Proceed with update?
```

**Wait for user confirmation.**

### Step 4: Perform update
If user confirms:

With npm:
```bash
npm update @unlaxer/dre-toolkit
npx dre-update
```

Without npm:
Guide the user through manual copy of kit files to `.claude/`.

### Step 5: Report result
```
DRE toolkit updated to v[new version].
Customized files were not modified.
```

## MUST Rules
1. **Always get user confirmation before updating.** Never overwrite without asking.
2. **Do not touch customized files.** Skip them, only add new files.
3. **If source not found, guide the user to run `npm update @unlaxer/dre-toolkit`.**
