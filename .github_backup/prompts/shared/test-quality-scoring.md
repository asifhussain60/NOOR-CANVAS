# Test Quality Scoring Algorithm
**Purpose:** Comprehensive test quality validation for Playwright tests  
**Version:** 1.0.0  
**Used By:** test-generation.prompt.md Step 7.5  
**Last Updated:** 2025-10-31

---

## Algorithm 9: Calculate Test Quality Score

**Purpose:** Evaluate test file quality on 0-100 scale with detailed breakdown

```
FUNCTION CalculateTestQualityScore(testFilePath, acceptanceCriteria):
  
  // Load test file
  testContent = ReadFile(testFilePath)
  testLines = SplitLines(testContent)
  
  // Initialize scoring
  totalScore = 0
  breakdown = {}
  
  // ===================================================================
  // CATEGORY 1: Acceptance Criteria Coverage (30 points max)
  // ===================================================================
  
  acceptanceCriteriaScore = 0
  criteriaAssertions = []
  
  FOR EACH criteria IN acceptanceCriteria:
    
    // Search for assertions related to this criteria
    criteriaKeywords = ExtractKeywords(criteria)
    foundAssertions = FindAssertions(testContent, criteriaKeywords)
    
    IF foundAssertions.count > 0 THEN
      acceptanceCriteriaScore += (30 / acceptanceCriteria.count)
      criteriaAssertions.append({
        "criteria": criteria,
        "assertions": foundAssertions,
        "status": "COVERED"
      })
    ELSE
      criteriaAssertions.append({
        "criteria": criteria,
        "assertions": [],
        "status": "MISSING"
      })
    END IF
    
  END FOR
  
  breakdown["acceptanceCriteriaCoverage"] = {
    "score": acceptanceCriteriaScore,
    "max": 30,
    "details": criteriaAssertions
  }
  totalScore += acceptanceCriteriaScore
  
  // ===================================================================
  // CATEGORY 2: Assertion Completeness (20 points max)
  // ===================================================================
  
  assertionCompletenessScore = 0
  assertionTypes = {
    "ui": 0,      // expect(locator).toBeVisible(), toHaveText(), etc.
    "api": 0,     // expect(response.status()).toBe(200), etc.
    "database": 0 // page refresh + state validation
  }
  
  // UI Assertions (8 points)
  uiAssertions = FindAssertions(testContent, ["toBeVisible", "toHaveText", "toHaveValue", "toBeChecked", "toBeDisabled"])
  IF uiAssertions.count >= 3 THEN
    assertionCompletenessScore += 8
    assertionTypes["ui"] = 8
  ELSE IF uiAssertions.count >= 1 THEN
    assertionCompletenessScore += 4
    assertionTypes["ui"] = 4
  END IF
  
  // API Assertions (8 points)
  apiAssertions = FindAssertions(testContent, ["response.status", "response.json", "waitForResponse"])
  IF apiAssertions.count >= 2 THEN
    assertionCompletenessScore += 8
    assertionTypes["api"] = 8
  ELSE IF apiAssertions.count >= 1 THEN
    assertionCompletenessScore += 4
    assertionTypes["api"] = 4
  END IF
  
  // Database Persistence (4 points)
  hasDatabaseValidation = testContent.Contains("page.reload") OR testContent.Contains("page.goto") AFTER mutation
  IF hasDatabaseValidation THEN
    assertionCompletenessScore += 4
    assertionTypes["database"] = 4
  END IF
  
  breakdown["assertionCompleteness"] = {
    "score": assertionCompletenessScore,
    "max": 20,
    "details": assertionTypes
  }
  totalScore += assertionCompletenessScore
  
  // ===================================================================
  // CATEGORY 3: Error Handling (15 points max)
  // ===================================================================
  
  errorHandlingScore = 0
  errorHandlingDetails = {
    "tryCatch": false,
    "timeouts": false,
    "retryLogic": false
  }
  
  // Try/Catch Blocks (6 points)
  IF testContent.Contains("try {") AND testContent.Contains("catch") THEN
    errorHandlingScore += 6
    errorHandlingDetails["tryCatch"] = true
  END IF
  
  // Timeout Handling (6 points)
  timeouts = FindPatterns(testContent, ["waitForSelector", "waitForResponse", "waitForLoadState", "setTimeout"])
  IF timeouts.count >= 3 THEN
    errorHandlingScore += 6
    errorHandlingDetails["timeouts"] = true
  ELSE IF timeouts.count >= 1 THEN
    errorHandlingScore += 3
    errorHandlingDetails["timeouts"] = "partial"
  END IF
  
  // Retry Logic (3 points)
  IF testContent.Contains("retries:") OR testContent.Contains("test.retry") THEN
    errorHandlingScore += 3
    errorHandlingDetails["retryLogic"] = true
  END IF
  
  breakdown["errorHandling"] = {
    "score": errorHandlingScore,
    "max": 15,
    "details": errorHandlingDetails
  }
  totalScore += errorHandlingScore
  
  // ===================================================================
  // CATEGORY 4: Test Isolation (15 points max)
  // ===================================================================
  
  testIsolationScore = 0
  isolationDetails = {
    "independentData": false,
    "cleanupHooks": false,
    "noSharedState": false
  }
  
  // Independent Test Data (6 points)
  hasUniqueData = testContent.Contains("Math.random") OR testContent.Contains("Date.now") OR testContent.Contains("uuid")
  IF hasUniqueData THEN
    testIsolationScore += 6
    isolationDetails["independentData"] = true
  END IF
  
  // Cleanup Hooks (6 points)
  hasCleanup = testContent.Contains("afterEach") OR testContent.Contains("afterAll")
  IF hasCleanup THEN
    testIsolationScore += 6
    isolationDetails["cleanupHooks"] = true
  END IF
  
  // No Shared State (3 points)
  hasNoGlobalVars = NOT testContent.Contains("let ") OUTSIDE test blocks
  IF hasNoGlobalVars THEN
    testIsolationScore += 3
    isolationDetails["noSharedState"] = true
  END IF
  
  breakdown["testIsolation"] = {
    "score": testIsolationScore,
    "max": 15,
    "details": isolationDetails
  }
  totalScore += testIsolationScore
  
  // ===================================================================
  // CATEGORY 5: Documentation Quality (10 points max)
  // ===================================================================
  
  documentationScore = 0
  docDetails = {
    "testDescription": false,
    "codeComments": 0,
    "scenarioExplanation": false
  }
  
  // Test Description (4 points)
  hasDescription = testContent.Contains("test.describe") OR testContent.Contains("// Test:")
  IF hasDescription THEN
    documentationScore += 4
    docDetails["testDescription"] = true
  END IF
  
  // Code Comments (4 points)
  commentLines = CountCommentLines(testContent)
  IF commentLines >= 5 THEN
    documentationScore += 4
    docDetails["codeComments"] = commentLines
  ELSE IF commentLines >= 2 THEN
    documentationScore += 2
    docDetails["codeComments"] = commentLines
  END IF
  
  // Scenario Explanation (2 points)
  hasScenarioDoc = testContent.Contains("// Scenario:") OR testContent.Contains("// Purpose:")
  IF hasScenarioDoc THEN
    documentationScore += 2
    docDetails["scenarioExplanation"] = true
  END IF
  
  breakdown["documentationQuality"] = {
    "score": documentationScore,
    "max": 10,
    "details": docDetails
  }
  totalScore += documentationScore
  
  // ===================================================================
  // CATEGORY 6: Playwright Best Practices (10 points max)
  // ===================================================================
  
  bestPracticesScore = 0
  practicesDetails = {
    "dataTestIdSelectors": 0,
    "autoWaiting": false,
    "parallelSafe": false
  }
  
  // data-testid Selectors (4 points)
  dataTestIdCount = CountOccurrences(testContent, "data-testid")
  IF dataTestIdCount >= 5 THEN
    bestPracticesScore += 4
    practicesDetails["dataTestIdSelectors"] = dataTestIdCount
  ELSE IF dataTestIdCount >= 2 THEN
    bestPracticesScore += 2
    practicesDetails["dataTestIdSelectors"] = dataTestIdCount
  END IF
  
  // Auto-Waiting (3 points)
  usesAutoWait = NOT testContent.Contains("sleep(") AND NOT testContent.Contains("setTimeout(")
  IF usesAutoWait THEN
    bestPracticesScore += 3
    practicesDetails["autoWaiting"] = true
  END IF
  
  // Parallel Execution Safe (3 points)
  isParallelSafe = NOT testContent.Contains("test.describe.serial")
  IF isParallelSafe THEN
    bestPracticesScore += 3
    practicesDetails["parallelSafe"] = true
  END IF
  
  breakdown["playwrightBestPractices"] = {
    "score": bestPracticesScore,
    "max": 10,
    "details": practicesDetails
  }
  totalScore += bestPracticesScore
  
  // ===================================================================
  // GENERATE RECOMMENDATIONS
  // ===================================================================
  
  recommendations = []
  
  // Acceptance Criteria Gaps
  FOR EACH criteria IN criteriaAssertions WHERE status == "MISSING":
    recommendations.append("Add assertion for: " + criteria.criteria)
  END FOR
  
  // Assertion Gaps
  IF assertionTypes["ui"] < 8 THEN
    recommendations.append("Add more UI assertions (toBeVisible, toHaveText)")
  END IF
  IF assertionTypes["api"] < 8 THEN
    recommendations.append("Add API response validation")
  END IF
  IF assertionTypes["database"] == 0 THEN
    recommendations.append("Add database persistence check (page reload after mutation)")
  END IF
  
  // Error Handling Gaps
  IF NOT errorHandlingDetails["tryCatch"] THEN
    recommendations.append("Add try/catch blocks for error handling")
  END IF
  IF errorHandlingDetails["timeouts"] == "partial" OR NOT errorHandlingDetails["timeouts"] THEN
    recommendations.append("Add explicit wait conditions (waitForSelector, waitForResponse)")
  END IF
  
  // Isolation Gaps
  IF NOT isolationDetails["cleanupHooks"] THEN
    recommendations.append("Add afterEach hook for test cleanup")
  END IF
  IF NOT isolationDetails["independentData"] THEN
    recommendations.append("Use unique test data (timestamps, UUIDs) to prevent test conflicts")
  END IF
  
  // Documentation Gaps
  IF docDetails["codeComments"] < 3 THEN
    recommendations.append("Add comments explaining complex logic and selectors")
  END IF
  
  // Best Practices Gaps
  IF practicesDetails["dataTestIdSelectors"] < 3 THEN
    recommendations.append("Use data-testid attributes for stable selectors")
  END IF
  IF NOT practicesDetails["autoWaiting"] THEN
    recommendations.append("Replace sleep/setTimeout with Playwright auto-waiting")
  END IF
  
  // ===================================================================
  // RETURN COMPLETE SCORE OBJECT
  // ===================================================================
  
  RETURN {
    "totalScore": totalScore,
    "maxScore": 100,
    "breakdown": breakdown,
    "recommendations": recommendations,
    "grade": CalculateGrade(totalScore)
  }
  
END FUNCTION
```

---

## Helper Functions

### FindAssertions
```
FUNCTION FindAssertions(testContent, keywords):
  
  assertions = []
  lines = SplitLines(testContent)
  
  FOR i = 0 TO lines.length - 1:
    line = lines[i]
    
    IF line.Contains("expect(") THEN
      FOR EACH keyword IN keywords:
        IF line.Contains(keyword) THEN
          assertions.append({
            "line": i + 1,
            "assertion": line.trim(),
            "keyword": keyword
          })
        END IF
      END FOR
    END IF
  END FOR
  
  RETURN assertions
  
END FUNCTION
```

### ExtractKeywords
```
FUNCTION ExtractKeywords(criteria):
  
  // Remove common words and extract meaningful terms
  stopWords = ["the", "a", "an", "is", "are", "should", "must", "will"]
  words = criteria.toLowerCase().split(" ")
  
  keywords = []
  FOR EACH word IN words:
    IF NOT stopWords.contains(word) AND word.length > 3 THEN
      keywords.append(word)
    END IF
  END FOR
  
  RETURN keywords
  
END FUNCTION
```

### CountCommentLines
```
FUNCTION CountCommentLines(testContent):
  
  lines = SplitLines(testContent)
  commentCount = 0
  
  FOR EACH line IN lines:
    trimmedLine = line.trim()
    IF trimmedLine.startsWith("//") OR trimmedLine.startsWith("/*") THEN
      commentCount++
    END IF
  END FOR
  
  RETURN commentCount
  
END FUNCTION
```

### CalculateGrade
```
FUNCTION CalculateGrade(score):
  
  IF score >= 90 THEN
    RETURN "A (Excellent)"
  ELSE IF score >= 80 THEN
    RETURN "B (Good)"
  ELSE IF score >= 70 THEN
    RETURN "C (Acceptable)"
  ELSE IF score >= 60 THEN
    RETURN "D (Needs Improvement)"
  ELSE
    RETURN "F (Poor - Regenerate)"
  END IF
  
END FUNCTION
```

---

## Quality Report Generation

### Generate Quality Report File
```
FUNCTION GenerateQualityReport(scoreObject, testName, key):
  
  reportContent = "# Test Quality Report: " + testName + "\n"
  reportContent += "**Generated:** " + CurrentTimestamp() + "\n"
  reportContent += "**Key:** " + key + "\n"
  reportContent += "**Overall Score:** " + scoreObject.totalScore + "/100 (" + scoreObject.grade + ")\n\n"
  
  reportContent += "## Score Breakdown\n\n"
  
  // Category 1: Acceptance Criteria Coverage
  reportContent += "### Acceptance Criteria Coverage: " + scoreObject.breakdown["acceptanceCriteriaCoverage"].score + "/30\n"
  FOR EACH criteria IN scoreObject.breakdown["acceptanceCriteriaCoverage"].details:
    IF criteria.status == "COVERED" THEN
      reportContent += "- ✅ " + criteria.criteria + " (Assertions: " + criteria.assertions.count + ")\n"
    ELSE
      reportContent += "- ❌ " + criteria.criteria + " (MISSING)\n"
    END IF
  END FOR
  reportContent += "\n"
  
  // Category 2: Assertion Completeness
  reportContent += "### Assertion Completeness: " + scoreObject.breakdown["assertionCompleteness"].score + "/20\n"
  details = scoreObject.breakdown["assertionCompleteness"].details
  reportContent += "- UI assertions: " + (details["ui"] > 0 ? "✅" : "❌") + " (" + details["ui"] + "/8 pts)\n"
  reportContent += "- API assertions: " + (details["api"] > 0 ? "✅" : "❌") + " (" + details["api"] + "/8 pts)\n"
  reportContent += "- Database assertions: " + (details["database"] > 0 ? "✅" : "❌") + " (" + details["database"] + "/4 pts)\n\n"
  
  // Category 3: Error Handling
  reportContent += "### Error Handling: " + scoreObject.breakdown["errorHandling"].score + "/15\n"
  errorDetails = scoreObject.breakdown["errorHandling"].details
  reportContent += "- try/catch blocks: " + (errorDetails["tryCatch"] ? "✅" : "❌") + "\n"
  reportContent += "- Timeout handling: " + (errorDetails["timeouts"] == true ? "✅" : (errorDetails["timeouts"] == "partial" ? "⚠️ Partial" : "❌")) + "\n"
  reportContent += "- Retry logic: " + (errorDetails["retryLogic"] ? "✅" : "❌") + "\n\n"
  
  // Category 4: Test Isolation
  reportContent += "### Test Isolation: " + scoreObject.breakdown["testIsolation"].score + "/15\n"
  isolationDetails = scoreObject.breakdown["testIsolation"].details
  reportContent += "- Independent test data: " + (isolationDetails["independentData"] ? "✅" : "❌") + "\n"
  reportContent += "- Cleanup hooks: " + (isolationDetails["cleanupHooks"] ? "✅" : "❌") + "\n"
  reportContent += "- No shared state: " + (isolationDetails["noSharedState"] ? "✅" : "❌") + "\n\n"
  
  // Category 5: Documentation Quality
  reportContent += "### Documentation Quality: " + scoreObject.breakdown["documentationQuality"].score + "/10\n"
  docDetails = scoreObject.breakdown["documentationQuality"].details
  reportContent += "- Test description: " + (docDetails["testDescription"] ? "✅" : "❌") + "\n"
  reportContent += "- Code comments: " + docDetails["codeComments"] + " lines\n"
  reportContent += "- Scenario explanation: " + (docDetails["scenarioExplanation"] ? "✅" : "❌") + "\n\n"
  
  // Category 6: Playwright Best Practices
  reportContent += "### Playwright Best Practices: " + scoreObject.breakdown["playwrightBestPractices"].score + "/10\n"
  practicesDetails = scoreObject.breakdown["playwrightBestPractices"].details
  reportContent += "- data-testid selectors: " + practicesDetails["dataTestIdSelectors"] + " instances\n"
  reportContent += "- Auto-waiting: " + (practicesDetails["autoWaiting"] ? "✅" : "❌") + "\n"
  reportContent += "- Parallel execution safe: " + (practicesDetails["parallelSafe"] ? "✅" : "❌") + "\n\n"
  
  // Recommendations
  reportContent += "## Recommendations\n\n"
  IF scoreObject.recommendations.count > 0 THEN
    FOR EACH recommendation IN scoreObject.recommendations:
      reportContent += "- " + recommendation + "\n"
    END FOR
  ELSE
    reportContent += "No improvements needed - excellent test quality!\n"
  END IF
  reportContent += "\n"
  
  // Test File Location
  reportContent += "## Test File Location\n\n"
  reportContent += "**DRAFT:** `.github/key-data-streams/" + key + "/tests/DRAFT/" + testName + ".spec.ts`\n"
  reportContent += "**Status:** Awaiting approval (see Step 7.5 options)\n"
  
  RETURN reportContent
  
END FUNCTION
```

---

## Usage Example

**Invocation:**
```
scoreObject = CalculateTestQualityScore(
  testFilePath: ".github/key-data-streams/kds/tests/DRAFT/enforcement-validation.spec.ts",
  acceptanceCriteria: [
    "Step -1 detects .github modification requests",
    "Enforcement message displays @workspace /kds command",
    "Agent halts execution before proceeding"
  ]
)

reportContent = GenerateQualityReport(
  scoreObject: scoreObject,
  testName: "enforcement-validation",
  key: "kds"
)

WriteFile(".github/key-data-streams/kds/tests/DRAFT/enforcement-validation.quality-report.md", reportContent)

DisplayToUser(scoreObject)
```

---

**End of Test Quality Scoring Algorithm**
