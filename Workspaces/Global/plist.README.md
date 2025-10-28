# plist - Project Intelligence Tool

Portable project search utility that works in any git-based project.

## Installation (Global Access)

Run the setup script once to add to your PATH:

```powershell
cd "d:\PROJECTS\NOOR CANVAS\Workspaces\Global"
.\setup-global-commands.ps1
```

Then restart your terminal. After that, you can run `plist` from anywhere.

## Quick Start

```powershell
# List work keys
plist -keys -n 10

# Show dictionary shortcuts for views
plist -dic -c V

# Show git history
plist -git -n 20

# Search for files
plist -files -f hcpraz
```

## Commands

### `-keys` - List Work Item Keys

Shows work item keys from files and git history.

```powershell
plist -keys              # Last 10 keys (default)
plist -keys -n 20        # Last 20 keys
```

**Sources:**
- Key files in `Workspaces/Copilot/keys/` or similar
- Summary files in `Workspaces/Copilot/_DOCS/summaries/` or similar
- Git commit messages with key patterns: `(key):`, `key:`, `[key]`

### `-dic` - Dictionary Lookup

Shows abbreviation definitions from project dictionary.

```powershell
plist -dic -c V          # Views/Razor components
plist -dic -c V -f hcp   # Views matching "hcp"
plist -dic -c X          # All categories
```

**Categories:**
- `U` = User-defined terms (nc, hp, ac, db)
- `V` = Views/Razor components (hcp, sc, tc, ul, hl)
- `A` = API Controllers (hctrl, pctrl, qctrl)
- `S` = Services (hss, hsss, sstate)
- `T` = Testing/Config (pwcfg, eslint)
- `D` = Database (sdb, kdb)
- `I` = Infrastructure (cftunnel, cfconfig)
- `X` = All categories

**Auto-discovers dictionary files:**
- `.github/prompts/shared/UserDictionary.md`
- `.dictionary.md`
- `DICTIONARY.md`
- `docs/dictionary.md`

### `-git` - Git Commit History

Shows recent git commits.

```powershell
plist -git -n 15         # Last 15 commits (newest first)
plist -git -n 20 -oldest # Last 20 commits (oldest first)
```

Works in any git repository.

### `-files` - Fuzzy File Search

Searches for files using fuzzy matching (like VS Code `#file` search).

```powershell
plist -files -f hcpraz   # Finds HostControlPanel.razor
plist -files -f sccs     # Finds SessionCanvas.cs, session.css, etc.
```

**Pattern matching:**
- Extracts characters from pattern: `hcpraz` → `h.*?c.*?p.*?r.*?a.*?z`
- Case-insensitive
- Excludes: `node_modules`, `bin`, `obj`, `.git`, `.vs`, `packages`, `test-results`

## Common Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-n <int>` | Number of results | 10 |
| `-c <char>` | Category for `-dic` | - |
| `-f <string>` | Filter/pattern | - |
| `-oldest` | Reverse chronological (git) | false |
| `-help` | Show help | - |

## Portability Features

**Application-Agnostic:**
- Auto-discovers project structure via git root
- Works in any git repository
- Searches conventional paths for keys/summaries/dictionaries
- No hardcoded paths (except in NOOR Canvas when found)

**Zero Configuration:**
- No setup files required
- Uses sensible defaults
- Gracefully handles missing components

**Copy-Paste Ready:**
- Single file (`plist.ps1`)
- No dependencies
- Drop into any project's scripts folder

## Examples

### NOOR Canvas Project

```powershell
cd "d:\PROJECTS\NOOR CANVAS"
plist -keys -n 5                     # table-asset-enhancement, prompts, etc.
plist -dic -c V -f hcp               # hcp → HostControlPanel.razor
plist -git -n 10                     # Recent commits
plist -files -f hcpraz               # Find HostControlPanel.razor
```

### Other Projects

```powershell
cd "d:\PROJECTS\MyAngularApp"
plist -git -n 20                     # Git history (always works)
plist -files -f component            # Find components
plist -dic -c U                      # If dictionary exists
plist -keys                          # If keys tracked
```

## Auto-Discovery Paths

The tool searches these conventional locations:

**Keys:**
- `Workspaces/Copilot/keys`
- `.copilot/keys`
- `docs/work-items`
- `workspace/keys`
- `.github/work`

**Summaries:**
- `Workspaces/Copilot/_DOCS/summaries`
- `.copilot/summaries`
- `docs/summaries`

**Dictionary:**
- `.github/prompts/shared/UserDictionary.md`
- `.dictionary.md`
- `DICTIONARY.md`
- `docs/dictionary.md`

## Output Examples

### Keys

```
Latest Keys (5):

  1. table-asset-enhancement  [2025-10-27]
  2. prompts  [2025-10-27]
  3. prompt-cohesion  [2025-10-27]
  4. ncw-rename  [2025-10-27]
  5. fab-share-button-redesign  [2025-10-27]
```

### Dictionary

```
Views/Razor Components (V):
  • hcp        → Host Control Panel
  • sc         → Session Canvas
  • tc         → Transcript Canvas
  • ul         → User Landing (registration)
  • hl         → Host Landing
```

### Git History

```
Git History (5, newest first):

  [2025-10-27] f3a3ed1e - docs: Add share-button redesign documentation
  [2025-10-27] c1f8375f - chore(docs): Organize .github folder structure
  [2025-10-27] 0c8275ae - feat(prompts): Integrate output-validator
  [2025-10-27] 1902f6ad - docs(prompts): Add enforcement implementation
  [2025-10-27] 60b76d2a - feat(prompts): Add loop prevention
```

### File Search

```
Files matching 'hcpraz':

  1. HostControlPanelContent.razor  (SPA\NoorCanvas\Components\Host\HostControlPanelContent.razor)
  2. HostControlPanelHeader.razor  (SPA\NoorCanvas\Components\Host\HostControlPanelHeader.razor)
  3. HostControlPanel.razor  (SPA\NoorCanvas\Pages\HostControlPanel.razor)
```

## Technical Details

**Language:** PowerShell 5.1+  
**Dependencies:** Git (for git commands)  
**Size:** ~500 lines  
**Performance:** Fast (<1s for most operations)

## Version

**Version:** 1.0.0  
**Last Updated:** 2025-10-28  
**Author:** Asif Hussain  
**License:** MIT
