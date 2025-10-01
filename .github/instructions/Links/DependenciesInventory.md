# DependenciesInventory.md

> Flattened inventory of dependencies per package manager.
> `sync` should parse lockfiles and module manifests.

## Expected Format
- **scope**: workspace/package path
- **language**
- **package_manager**
- **dependencies**: name, version, resolved, license (if trivial), vuln flags
