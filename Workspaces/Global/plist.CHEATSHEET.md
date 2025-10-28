# plist - Quick Reference Cheatsheet

## Installation
```powershell
# One-time setup (if not already done)
cd "d:\PROJECTS\NOOR CANVAS\Workspaces\Global"
.\setup-global-commands.ps1
# Then restart terminal
```

## Basic Syntax
```powershell
plist -<command> [-n <count>] [-c <category>] [-f <filter>] [-oldest]
```

---

## Commands

### 🔑 Keys - List Work Items
```powershell
plist -keys              # Last 10 keys
plist -keys -n 20        # Last 20 keys
```

**Output:**
```
1. table-asset-enhancement  [2025-10-27]
2. prompts  [2025-10-27]
3. fab-share-button-redesign  [2025-10-27]
```

---

### 📖 Dictionary - Lookup Shortcuts
```powershell
plist -dic -c V          # All view shortcuts
plist -dic -c V -f hcp   # Views matching "hcp"
plist -dic -c X          # All categories
plist -dic -c A          # API controllers
plist -dic -c S          # Services
```

**Categories:**
- `U` = User terms (nc, hp, ac, db)
- `V` = Views/Razor (hcp, sc, tc, ul, hl)
- `A` = API Controllers (hctrl, pctrl, qctrl)
- `S` = Services (hss, hsss, sstate)
- `T` = Testing/Config (pwcfg, eslint)
- `D` = Database (sdb, kdb)
- `I` = Infrastructure (cftunnel, cfconfig)
- `X` = **All categories**

**Output:**
```
Views/Razor Components (V):
• hcp  → Host Control Panel
• sc   → Session Canvas
• tc   → Transcript Canvas
```

---

### 📜 Git - Commit History
```powershell
plist -git -n 10         # Last 10 commits (newest first)
plist -git -n 20 -oldest # Last 20 commits (oldest first)
```

**Output:**
```
[2025-10-27] f3a3ed1e - docs: Add share-button redesign
[2025-10-27] c1f8375f - chore(docs): Organize .github folder
```

---

### 🔍 Files - Fuzzy Search
```powershell
plist -files -f hcpraz   # Finds HostControlPanel.razor
plist -files -f sccs     # Finds SessionCanvas.cs, session.css
plist -files -f pattern  # Any fuzzy pattern
```

**Output:**
```
1. HostControlPanel.razor  (SPA\NoorCanvas\Pages\HostControlPanel.razor)
2. HostControlPanelContent.razor  (SPA\NoorCanvas\Components\Host\...)
```

---

## Common Patterns

### Quick Lookup
```powershell
plist -dic -c V -f hcp   # What's "hcp"? → HostControlPanel.razor
plist -dic -c S -f sst   # What's "sst"? → SecureSessionTokenService
plist -files -f hcpraz   # Where's HostControlPanel.razor?
```

### Recent Work
```powershell
plist -keys -n 5         # What did I work on recently?
plist -git -n 10         # What commits did I make?
```

### Full Dictionary
```powershell
plist -dic -c X          # Show everything
plist -dic -c V          # Just views
plist -dic -c A          # Just APIs
```

---

## Parameters Reference

| Parameter | Description | Example |
|-----------|-------------|---------|
| `-keys` | List work keys | `plist -keys` |
| `-dic` | Dictionary lookup | `plist -dic -c V` |
| `-git` | Git history | `plist -git -n 20` |
| `-files` | File search | `plist -files -f hcp` |
| `-n <int>` | Number of results | `-n 20` |
| `-c <char>` | Category filter | `-c V` (Views) |
| `-f <str>` | Filter/pattern | `-f hcp` |
| `-oldest` | Oldest first (git) | `plist -git -oldest` |
| `-help` | Show full help | `plist -help` |

---

## Pro Tips

**💡 Combine filters:**
```powershell
plist -dic -c V -f canvas   # Views with "canvas" in name
plist -keys -n 50           # Dig deeper into history
```

**💡 Case doesn't matter:**
```powershell
plist -files -f HCP         # Same as -f hcp
plist -files -f SESSIONCANVAS  # Same as -f sessioncanvas
```

**💡 Fuzzy matching works like VS Code:**
```powershell
plist -files -f hcpraz      # h...c...p...raz → HostControlPanel.razor
plist -files -f sccs        # s...c...c...s → SessionCanvas.cs, session.css
```

**💡 Works in ANY git project:**
```powershell
cd "C:\AnyProject"
plist -git -n 10            # Git history works everywhere
plist -files -f component   # File search works everywhere
```

---

## Most Common Commands

```powershell
# Day-to-day usage (memorize these 4)
plist -keys                 # What am I working on?
plist -dic -c V             # View shortcuts
plist -git -n 10            # Recent commits
plist -files -f <pattern>   # Find a file

# Deep dives
plist -keys -n 50           # Full work history
plist -dic -c X             # Everything in dictionary
plist -git -n 100 -oldest   # Complete git timeline
```

---

## Keyboard Shortcuts (Aliases)

Create PowerShell aliases for even faster access:

```powershell
# Add to $PROFILE
Set-Alias -Name pk -Value plist    # pk -keys
```

Then use:
```powershell
pk -keys              # Instead of plist -keys
pk -dic -c V          # Instead of plist -dic -c V
```

---

## Troubleshooting

**"Command not found"?**
```powershell
# Restart terminal OR use full path:
d:\'PROJECTS'\'NOOR CANVAS'\Workspaces\Global\plist.ps1 -keys
```

**"No keys found"?**
```powershell
# Make sure you're in a git repo with work tracking
cd "d:\PROJECTS\NOOR CANVAS"
plist -keys
```

**"Dictionary file not found"?**
```powershell
# Tool looks for these files:
# - .github/prompts/shared/UserDictionary.md
# - .dictionary.md
# - DICTIONARY.md
```

---

## Category Quick Reference

| Code | Category | Examples |
|------|----------|----------|
| **U** | User terms | nc, hp, ac, db |
| **V** | Views/Razor | hcp, sc, tc, ul, hl |
| **A** | APIs | hctrl, pctrl, qctrl, sctrl |
| **S** | Services | hss, hsss, sstate, ahps |
| **T** | Testing | pwcfg, eslint, tsconfig |
| **D** | Database | sdb, kdb |
| **I** | Infrastructure | cftunnel, cfconfig, cfhealth |
| **X** | **ALL** | Everything combined |

---

## Version
**1.0.0** | Updated: 2025-10-28 | Location: `Workspaces/Global/plist.ps1`
