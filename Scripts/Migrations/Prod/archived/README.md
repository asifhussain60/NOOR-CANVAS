# Archived Migrations

This directory contains successfully deployed production migrations.

**Status**: Completed  
**Purpose**: Historical record  
**Organization**: By deployment date (`YYYY-MM-DD/`)

---

## How Archival Works

After successful deployment, `ncdeploy.ps1` automatically:

1. **Moves migration** from `../pending/` to `archived/{YYYY-MM-DD}/`
2. **Preserves filename** for traceability
3. **Records in database** (`canvas.MigrationHistory` table)

---

## Viewing Migration History

**File System** (this directory):
```
archived/
├── 2025-10-20/
│   ├── migration-20251020-120000-participant-guid-column.sql
│   └── migration-20251020-143000-user-landing-add-canvastype.sql
└── 2025-10-21/
    └── migration-20251021-090000-session-tracking-indexes.sql
```

**Database** (MigrationHistory table):
```sql
SELECT 
    MigrationId,
    Description,
    AppliedAt,
    AppliedBy,
    CASE WHEN RolledBackAt IS NOT NULL THEN 'ROLLED BACK' ELSE 'ACTIVE' END AS Status
FROM canvas.MigrationHistory
ORDER BY AppliedAt DESC;
```

---

## ⚠️ Important Rules

- **Never edit archived migrations** - They're historical records
- **Never delete archived migrations** - Needed for audit trail
- **Never move migrations back to pending** - Create new migration instead

---

**See**: `../README.md` for complete migration system documentation
