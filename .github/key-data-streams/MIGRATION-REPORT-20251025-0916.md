# Key Data Streams Migration Report

**Date**: 2025-10-25 09:16:21
**Operation**: Move .github/prompts.keys/ → .github/key-data-streams/
**Method**: git mv (history preserved)

## Summary

- **Total Keys Migrated**: 12
- **Source Path**: .github/prompts.keys
- **Target Path**: .github/key-data-streams
- **Checkpoint Commit**: 478f33b7

## Migrated Keys

- _ARCHIVE
- auto-drift-detection
- canvas-receivers
- cohesion
- drift-prompt
- hcp
- invalid-url
- prompt-port
- prompt-system-audit
- signalr-disconnection-fix
- transcript-canvas
- user-landing


## Next Steps

1. Update path references in 17 files (8 prompts + 6 shared + 2 archive + 1 index)
2. Commit migration: `git commit -m "refactor: Move prompts.keys → key-data-streams"`
3. Update and rename index file: prompts.keys → key-data-streams/index.md
4. Run validation: `@workspace /cohesion scope=prompts`

## Rollback

If migration needs to be reverted:
```powershell
git mv .github/key-data-streams .github/prompts.keys
git commit -m "revert: Restore prompts.keys folder structure"
```
