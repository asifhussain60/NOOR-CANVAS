# Key Management
## Rules
- `keys_index.json` is the authoritative machine-readable index.
- `prompts.keys` and `active.keys.log` are human-readable mirrors.
- Keys are inferred automatically unless explicitly provided.
- Default status = In Progress.
- New only if no prior key can be inferred.
- Status transitions must be logged in all three sources.
- Only lock agent can set Complete.
- Sync reconciles and prunes stale/duplicate keys.
