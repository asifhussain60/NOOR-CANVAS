# Deprecated Files Archive (2025-10-30)

**Reason:** Consolidation into `.github/MANDATORY.md` as single source of truth

**Date Archived:** 2025-10-30  
**Superseded By:** `.github/MANDATORY.md`

---

## Archived Files

### 1. CONCISE-MANDATE.md

**Original Path:** `.github/prompts/shared/CONCISE-MANDATE.md`  
**Archived To:** `.github/prompts/shared/archive/deprecated-2025-10-30/CONCISE-MANDATE.md`  
**Reason:** Content merged into MANDATORY.md Rule 1 (No Code in Chat)  
**Deprecation Date:** 2025-10-30  

**Migration:**
- All references updated to point to `MANDATORY.md`
- Content consolidated with snippet-handling-policy.md and output-style-mandate.md
- Validation algorithms integrated into MANDATORY.md enforcement gates

---

### 2. snippet-handling-policy.md

**Original Path:** `.github/prompts/shared/snippet-handling-policy.md`  
**Status:** Marked deprecated (not moved yet - contains valuable implementation details)  
**Reason:** Content merged into MANDATORY.md Rule 1 (No Code in Chat)  
**Deprecation Date:** 2025-10-30  

**Migration:**
- Core rules merged into MANDATORY.md
- Implementation examples retained for reference
- All active prompts updated to reference MANDATORY.md

---

### 3. output-style-mandate.md

**Original Path:** `.github/prompts/shared/output-style-mandate.md`  
**Archived To:** `.github/prompts/shared/archive/deprecated-2025-10-30/output-style-mandate.md`  
**Reason:** Content merged into MANDATORY.md Rule 1 (No Code in Chat)  
**Deprecation Date:** 2025-10-30  

**Migration:**
- Output format rules integrated into MANDATORY.md
- 15-bullet limit enforcement moved to MANDATORY.md Rule 1
- Response structure templates consolidated

---

## Replacement Reference

**All deprecated files superseded by:** `.github/MANDATORY.md`

**Mapping:**
- CONCISE-MANDATE.md → MANDATORY.md Rule 1
- snippet-handling-policy.md → MANDATORY.md Rule 1 (detailed implementation)
- output-style-mandate.md → MANDATORY.md Rule 1

**Integration:**
- All 10 prompt files updated with `**LOAD FIRST:** .github/MANDATORY.md`
- Enforcement algorithms consolidated in MANDATORY.md
- Violations logged to `.github/audits/mandate-violations.log`

---

## Restoration (If Needed)

**To restore a file:**
```powershell
Copy-Item -Path ".github/prompts/shared/archive/deprecated-2025-10-30/{filename}" `
          -Destination ".github/prompts/shared/{filename}"
```

**Note:** Restoration NOT recommended - use MANDATORY.md instead

---

## See Also

- `.github/MANDATORY.md` - Ultimate source of truth (3 critical rules)
- `.github/audits/mandate-violations.log` - Violation tracking
- `.github/prompts/cleanup-copilot-mess.prompt.md` - Automated cleanup agent

---

**Archive Maintained By:** User  
**Last Updated:** 2025-10-30
