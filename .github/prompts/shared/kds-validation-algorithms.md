# KDS Validation Algorithms
**Purpose:** Pseudocode algorithms for kds.prompt.md governance validation  
**Version:** 1.0.0  
**Last Updated:** 2025-10-31

---

## Algorithm 1: Compatibility Check

**Purpose:** Validate proposed changes against existing KDS rules

```
FUNCTION CompatibilityCheck(proposedChange):
  
  // Load existing governance documents
  existingRules = ReadFile("MANDATORY.md")
  handoffProtocol = ReadFile("kds-handoff-protocol.md")
  activePlan = ReadFile(".github/key-data-streams/kds/kds.plan.md")
  
  // Initialize conflict tracking
  conflicts = []
  
  // Check each rule for violations
  FOR EACH rule IN existingRules:
    IF ProposedChangeViolates(proposedChange, rule) THEN
      conflicts.append({
        "rule": rule.number,
        "description": rule.text,
        "violation": DescribeConflict(proposedChange, rule)
      })
    END IF
  END FOR
  
  // Return conflict analysis
  RETURN {
    "hasConflicts": conflicts.length > 0,
    "conflicts": conflicts,
    "severity": CalculateSeverity(conflicts)
  }
  
END FUNCTION
```

---

## Algorithm 2: Cascading Impact Analysis

**Purpose:** Identify all files affected by a proposed change

```
FUNCTION AnalyzeCascadingImpacts(proposedChange):
  
  affectedFiles = []
  
  // Check if change affects prompts
  IF proposedChange.target == "prompt" THEN
    affectedFiles = FindDependentPrompts(proposedChange.promptName)
  END IF
  
  // Check if change affects MANDATORY.md
  IF proposedChange.target == "MANDATORY.md" THEN
    affectedFiles = GetAllFiles(".github/prompts/*.prompt.md")
  END IF
  
  // Check if change affects handoff protocol
  IF proposedChange.target == "kds-handoff-protocol.md" THEN
    affectedFiles = ["route", "plan", "test-generation", "task", "todo"]
  END IF
  
  RETURN {
    "affectedFiles": affectedFiles,
    "count": affectedFiles.length,
    "estimatedFixTime": EstimateFixTime(affectedFiles)
  }
  
END FUNCTION
```

---

## Algorithm 3: Conflict Report Generation

**Purpose:** Generate formatted conflict report for user

```
FUNCTION GenerateConflictReport(conflicts, affectedFiles):
  
  IF conflicts.length > 0 OR affectedFiles.length > 3 THEN
    
    report = {
      "type": "CONFLICT_DETECTED",
      "conflicts": conflicts,
      "affectedFiles": affectedFiles,
      "cascadingChanges": ListRequiredChanges(affectedFiles),
      "estimatedTime": CalculateTotalTime(conflicts, affectedFiles)
    }
    
    options = [
      "A) Resolve conflicts first (show resolution steps)",
      "B) Modify proposal to avoid conflicts",
      "C) Cancel change",
      "D) Force change (mark as tech debt)"
    ]
    
    RETURN {
      "report": report,
      "options": options,
      "action": "HALT"
    }
    
  ELSE
    
    RETURN {
      "status": "APPROVED",
      "action": "PROCEED"
    }
    
  END IF
  
END FUNCTION
```

---

## Algorithm 4: Review Mode Validation

**Purpose:** Validate all prompt files against KDS Rulebook

```
FUNCTION ValidateAllPrompts():
  
  promptFiles = GetAllFiles(".github/prompts/*.prompt.md")
  violations = []
  
  FOR EACH promptFile IN promptFiles:
    
    // Rule #1: Concise Output Format
    codeBlocks = DetectCodeBlocks(promptFile)
    IF codeBlocks.count > 0 AND NOT IsInSharedFolder(promptFile) THEN
      violations.append({
        "file": promptFile,
        "rule": "Rule #1 - Concise Output Format",
        "violation": "Code blocks in user-facing sections",
        "lines": codeBlocks.lines,
        "severity": "CRITICAL"
      })
    END IF
    
    // Rule #8: No pseudocode in prompts
    pseudocode = DetectPseudocode(promptFile)
    IF pseudocode.count > 0 AND NOT IsInSharedFolder(promptFile) THEN
      violations.append({
        "file": promptFile,
        "rule": "Rule #1 - Concise Output Format",
        "violation": "Pseudocode FUNCTION/FOR EACH blocks",
        "lines": pseudocode.lines,
        "severity": "CRITICAL"
      })
    END IF
    
    // Rule #11: Key display
    hasKeyDisplay = CheckKeyDisplay(promptFile)
    IF NOT hasKeyDisplay THEN
      violations.append({
        "file": promptFile,
        "rule": "Rule #11 - Key Display",
        "violation": "Missing key in output templates",
        "severity": "MEDIUM"
      })
    END IF
    
    // Long bullets check
    longBullets = DetectLongBullets(promptFile, maxLines=3)
    IF longBullets.count > 0 THEN
      violations.append({
        "file": promptFile,
        "rule": "Rule #1 - Concise Output Format",
        "violation": "Bullets exceeding 3 lines",
        "lines": longBullets.lines,
        "severity": "MEDIUM"
      })
    END IF
    
  END FOR
  
  RETURN violations
  
END FUNCTION
```

---

## Algorithm 5: Cleanup Target Identification

**Purpose:** Identify files for archival (backup files, old folders)

```
FUNCTION IdentifyCleanupTargets():
  
  cleanupTargets = []
  preserveList = []
  
  // PHASE 1: Identify patterns to archive
  backupFiles = FindFiles(".github/**/*.backup")
  bakFiles = FindFiles(".github/**/*.bak")
  tmpFiles = FindFiles(".github/**/*.tmp")
  backupFolders = FindFolders(".github/**/*-backup-*")
  oldAudits = FindOldFiles(".github/audits/", olderThan=90)
  
  cleanupTargets = Merge(backupFiles, bakFiles, tmpFiles, backupFolders, oldAudits)
  
  // PHASE 2: Identify files to preserve
  activeKeys = FindActiveKeys(modifiedWithin=90)
  referencedFiles = FindReferencedFiles(".github/")
  testFiles = GetAllFiles(".github/tests/")
  governanceFiles = ["kds-rulebook.json", "kds-rulebook.md", "MANDATORY.md"]
  
  preserveList = Merge(activeKeys, referencedFiles, testFiles, governanceFiles)
  
  // PHASE 3: Filter cleanup targets
  safeToArchive = []
  FOR EACH target IN cleanupTargets:
    IF NOT Contains(preserveList, target) THEN
      safeToArchive.append(target)
    END IF
  END FOR
  
  RETURN {
    "archiveTargets": safeToArchive,
    "preservedFiles": preserveList,
    "archivePath": ".github/_ARCHIVE/cleanup-{timestamp}/"
  }
  
END FUNCTION
```

---

## Algorithm 6: Prompt Consolidation Analysis

**Purpose:** Detect duplicate functionality across prompts

```
FUNCTION AnalyzeConsolidationOpportunities(prompts):
  
  consolidationCandidates = []
  
  FOR i = 0 TO prompts.length - 1:
    FOR j = i + 1 TO prompts.length - 1:
      
      prompt1 = prompts[i]
      prompt2 = prompts[j]
      
      // Calculate content overlap
      overlap = CalculateOverlap(prompt1.content, prompt2.content)
      
      // Check usage patterns
      usage1 = FindReferences(prompt1.name)
      usage2 = FindReferences(prompt2.name)
      
      // Consolidation criteria
      IF overlap > 80% THEN
        consolidationCandidates.append({
          "prompt1": prompt1.name,
          "prompt2": prompt2.name,
          "overlap": overlap,
          "recommendation": "CONSOLIDATE",
          "reason": "High content duplication"
        })
      ELSE IF usage1.count == 0 AND LastModified(prompt1) > 30 THEN
        consolidationCandidates.append({
          "prompt": prompt1.name,
          "recommendation": "ARCHIVE",
          "reason": "No recent usage"
        })
      ELSE
        // Keep separate
        consolidationCandidates.append({
          "prompt1": prompt1.name,
          "prompt2": prompt2.name,
          "overlap": overlap,
          "recommendation": "KEEP_SEPARATE",
          "reason": "Unique responsibilities confirmed"
        })
      END IF
      
    END FOR
  END FOR
  
  RETURN consolidationCandidates
  
END FUNCTION
```

---

## Algorithm 7: Auto-Fix Critical Issues (NEW - Option B Implementation)

**Purpose:** Automatically extract pseudocode and regenerate prompts

```
FUNCTION AutoFixCriticalIssues(violations):
  
  fixedPrompts = []
  errors = []
  
  FOR EACH violation IN violations:
    
    IF violation.severity == "CRITICAL" AND violation.rule == "Rule #1" THEN
      
      TRY:
        
        // Step 1: Read entire prompt file
        promptContent = ReadFile(violation.file)
        promptLines = SplitLines(promptContent)
        
        // Step 2: Extract pseudocode sections
        pseudocodeBlocks = ExtractPseudocodeBlocks(violation.lines)
        
        // Step 3: Create shared algorithm file
        algorithmFileName = GenerateAlgorithmFileName(violation.file)
        algorithmPath = ".github/prompts/shared/" + algorithmFileName
        
        CreateFile(algorithmPath, pseudocodeBlocks)
        
        // Step 4: Delete original prompt
        DeleteFile(violation.file)
        
        // Step 5: Regenerate prompt with algorithm references
        newPromptContent = RegeneratePromptWithReferences(
          promptContent,
          violation.lines,
          algorithmPath
        )
        
        CreateFile(violation.file, newPromptContent)
        
        // Step 6: Verify no duplication
        duplicates = DetectDuplicateSections(violation.file)
        
        IF duplicates.count == 0 THEN
          fixedPrompts.append({
            "file": violation.file,
            "status": "FIXED",
            "algorithmFile": algorithmPath
          })
        ELSE
          errors.append({
            "file": violation.file,
            "error": "Duplication detected after regeneration"
          })
        END IF
        
      CATCH error:
        errors.append({
          "file": violation.file,
          "error": error.message
        })
      END TRY
      
    END IF
    
  END FOR
  
  RETURN {
    "fixed": fixedPrompts,
    "errors": errors,
    "commitMessage": GenerateCommitMessage(fixedPrompts)
  }
  
END FUNCTION

// Helper: Extract pseudocode blocks from file
FUNCTION ExtractPseudocodeBlocks(lines):
  
  blocks = []
  currentBlock = ""
  inBlock = false
  
  FOR EACH line IN lines:
    IF line MATCHES "FUNCTION|FOR EACH|IF.*THEN|WHILE.*DO" THEN
      inBlock = true
      currentBlock = line
    ELSE IF inBlock AND line MATCHES "END FUNCTION|END FOR|END IF|END WHILE" THEN
      currentBlock += line
      blocks.append(currentBlock)
      currentBlock = ""
      inBlock = false
    ELSE IF inBlock THEN
      currentBlock += line
    END IF
  END FOR
  
  RETURN blocks
  
END FUNCTION

// Helper: Regenerate prompt with algorithm references
FUNCTION RegeneratePromptWithReferences(originalContent, violationLines, algorithmPath):
  
  newContent = ""
  
  FOR EACH section IN originalContent.sections:
    
    IF section.lineRange OVERLAPS violationLines THEN
      // Replace pseudocode with reference
      newContent += "**Algorithm:** See `" + algorithmPath + "`\n"
    ELSE
      // Keep original section
      newContent += section.content
    END IF
    
  END FOR
  
  RETURN newContent
  
END FUNCTION
```

---

## Helper Functions

### DetectCodeBlocks
```
FUNCTION DetectCodeBlocks(fileContent):
  
  codeBlocks = []
  lines = SplitLines(fileContent)
  
  FOR i = 0 TO lines.length - 1:
    IF lines[i] MATCHES "```(csharp|typescript|javascript|powershell|bash|sql|json)" THEN
      startLine = i
      FOR j = i + 1 TO lines.length - 1:
        IF lines[j] MATCHES "```" THEN
          codeBlocks.append({
            "start": startLine,
            "end": j,
            "language": ExtractLanguage(lines[i])
          })
          BREAK
        END IF
      END FOR
    END IF
  END FOR
  
  RETURN codeBlocks
  
END FUNCTION
```

### DetectPseudocode
```
FUNCTION DetectPseudocode(fileContent):
  
  pseudocodeLines = []
  lines = SplitLines(fileContent)
  
  FOR i = 0 TO lines.length - 1:
    IF lines[i] MATCHES "FUNCTION|FOR EACH|IF.*THEN|WHILE.*DO|PROCEDURE" THEN
      pseudocodeLines.append(i)
    END IF
  END FOR
  
  RETURN {
    "count": pseudocodeLines.length,
    "lines": pseudocodeLines
  }
  
END FUNCTION
```

### IsInSharedFolder
```
FUNCTION IsInSharedFolder(filePath):
  RETURN filePath.contains(".github/prompts/shared/")
END FUNCTION
```

---

**End of KDS Validation Algorithms**
