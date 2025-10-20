# Pending Migrations

This directory contains production migrations waiting to be deployed.

**Status**: Pending execution  
**Execution**: Automatic during `ncdeploy.ps1` deployment  
**Order**: Alphabetical by filename

---

## How Migrations Work

1. **Agents create migrations** when database changes detected
2. **Migrations wait here** until next deployment
3. **ncdeploy.ps1 executes** all pending migrations in order
4. **Successful migrations move** to `../archived/{YYYY-MM-DD}/`

---

## Current Pending Migrations

*No pending migrations*

---

## Adding Migrations Manually (Rare)

If you need to create a migration manually (not recommended - let agents handle it):

1. Generate timestamp: `Get-Date -Format "yyyyMMdd-HHmmss"`
2. Create file: `migration-{timestamp}-{key}-{description}.sql`
3. Use template from `../README.md`
4. Create corresponding rollback in `../rollback/`
5. Test with: `.\Scripts\ncdeploy.ps1 -DryRun`

---

**See**: `../README.md` for complete migration system documentation
