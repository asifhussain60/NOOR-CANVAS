# /collapse-keys

Scan the `#file:KeyDataStreams` directory for all folders whose names match `<key-pattern>`.

## Syntax

```
/collapse-keys Key:<key-pattern> [--dry-run] [--verbose] [--name <new-name>]
```

## Behaviour

1. Collect and analyse the content of all matching key folders.
2. Create a new consolidated key folder named using the provided pattern:
   - The final folder must follow: `KeyDataStreams/<base-key>-<new-name>`
   - Example: search `Key:prompt-*`, with `--name merged` → `KeyDataStreams/prompt-merged`
3. Merge the contents of all found key folders into this new key folder.
   - If files share the same name, preserve all versions by appending a numeric or source-based suffix (e.g., `fileA_1.json`, `fileA_2.json`).
4. After the merge completes successfully:
   - Delete all original key folders that matched the search.
   - Verify that **only the single new key folder** exists.
5. Ignore reference updates.
6. Output a summary report including:
   - List of merged folders
   - Total number of files processed
   - Any conflicts handled
   - Confirmation that exactly one resulting folder exists (with expected name)
   - Path to the new merged key folder

## Flags

- **--dry-run**: Simulate the collapse without making changes. Display what would be merged, created or deleted.
- **--verbose**: Provide detailed logging during execution.
- **--name \<new-name\>**: Specify the suffix for the new merged key folder name (required for final naming).

## Examples

### Example 1: Merge all prompt-related keys
```
/collapse-keys Key:prompt-* --name merged
```
Result: All folders matching `prompt-*` are merged into `KeyDataStreams/prompt-merged`

### Example 2: Dry-run to preview merge
```
/collapse-keys Key:api-* --name consolidated --dry-run --verbose
```
Result: Shows what would happen without making changes, with detailed output

### Example 3: Merge session-related keys
```
/collapse-keys Key:session-* --name unified --verbose
```
Result: Merges all `session-*` folders into `KeyDataStreams/session-unified` with detailed logging
