# Questionnaire Generator Algorithm

**Purpose:** Generate targeted clarification questions for ambiguous requests

**Used by:** plan.prompt.md (Step 1.5)

---

## Algorithm

**Input:** user_request, context_package, ambiguities[]

**Output:** questions[] (max 5)

---

## Question Categories

**1. Scope Clarification**
- Which components affected?
- What layers need changes?
- Database changes required?
- Testing scope?

**2. Requirement Clarification**
- Expected behavior?
- User interaction flow?
- Error handling approach?
- Edge cases to handle?

**3. Technical Clarification**
- Technology preferences?
- Design pattern to use?
- Breaking changes acceptable?
- Backward compatibility needed?

**4. Priority Clarification**
- Timeline constraints?
- Must-have vs nice-to-have?
- Blocking issues?
- Quick fix or robust solution?

---

## When to Generate Questions

**Trigger conditions:**
- Multiple valid interpretations
- Missing critical details
- Conflicting requirements
- Unclear scope (too broad/vague)
- Unknown component references
- Ambiguous technical approach

**Skip questions when:**
- Request is crystal clear
- Standard patterns apply
- All context provided
- No blocking unknowns

---

## Question Formulation Rules

**Be specific:**
- ❌ "What do you mean?"
- ✅ "Should the share button broadcast to all participants or selected recipients only?"

**Offer options when possible:**
- ❌ "How should this work?"
- ✅ "Should validation be client-side (FluentValidation) or server-side (data annotations)?"

**Limit to essentials:**
- Max 5 questions
- Focus on blockers
- Group related questions
- Prioritize critical unknowns

---

## Example Scenarios

**Vague Request:** "Fix the canvas"
**Questions:**
1. Which canvas component? (SessionCanvas, TranscriptCanvas, AnnotationCanvas)
2. What specific issue? (rendering, performance, data loading, UI layout)
3. When does it occur? (on load, during interaction, specific user actions)

**Ambiguous Request:** "Add share functionality"
**Questions:**
1. What should be shared? (canvas state, annotations, transcript, assets)
2. Share mechanism? (real-time SignalR broadcast or export/import)
3. Recipient scope? (all participants, selected users, external users)
4. UI placement? (toolbar button, context menu, both)

**Incomplete Request:** "Make the app faster"
**Questions:**
1. Which area is slow? (page load, canvas rendering, data operations, SignalR)
2. Current vs desired performance? (specific metrics)
3. User flow affected? (initial load, real-time updates, data queries)

---

## Output Format

```markdown
## 🧠 Clarification Needed (≤5 questions)

1. **Scope:** Which canvas component needs the fix?
   - A. SessionCanvas
   - B. TranscriptCanvas
   - C. AnnotationCanvas
   - D. All of them

2. **Behavior:** Should share broadcast real-time or export state?
   - A. Real-time SignalR broadcast
   - B. Export/import functionality
   - C. Both options

3. **UI:** Where should the share button appear?
   - A. Main toolbar
   - B. Context menu
   - C. Both locations

**Reply with:** A1, B2, A3 (or explain if none fit)
```

---

## See Also

- `../plan.prompt.md` - Step 1.5 implementation
- `request-analyzer.md` - Ambiguity detection
