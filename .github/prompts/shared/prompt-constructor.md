# Prompt Constructor Algorithm

**Purpose:** Build optimized prompt invocation for target agent

**Used by:** route.prompt.md (Step 5)

---

## Algorithm

**Input:** target_agent, context_package, key, complexity

**Output:** prompt_invocation (formatted string)

---

## Agent-Specific Parameters

**plan.prompt.md:**
```
@workspace /plan 
  key={key}
  user_request="{core_request}"
  scope="{layers_affected}"
  constraints="{technical_constraints}"
  include_suggestions={true|false}
```

**task.prompt.md:**
```
@workspace /task
  key={key}
  tasks=["{task1}", "{task2}"]
  github-branch={branch}
  commit-checkpoints={true|false}
  verbosity={concise|detailed}
```

**todo.prompt.md:**
```
@workspace /todo
  key={detected_key}
  task="{single_task}"
  auto-chain={true|false}
```

**test-generation.prompt.md:**
```
@workspace /test
  key={key}
  scenario="{test_scenario}"
  testType={functional|visual|both}
  auto-execute={true|false}
```

**ask.prompt.md:**
```
@workspace /ask
  question="{question}"
  context="{file_context}"
  depth={quick|standard|comprehensive}
  verbosity={concise|detailed}
```

---

## Context Packaging

**Visual Context (images/videos):**
- Attach mockups to prompt
- Reference screenshot files
- Include video timestamps
- Note UI states shown

**Error Context (stack traces):**
- Include full stack trace
- Highlight error line
- Add exception type
- Note error frequency

**File Context (code files):**
- List affected files
- Include relevant code blocks
- Add line numbers
- Note current behavior

---

## Request De-Noising

**Remove:**
- Filler words (just, please, maybe)
- Uncertainty markers (I think, possibly)
- Redundant phrases
- Politeness wrappers

**Preserve:**
- Technical terms
- Specific requirements
- Constraints
- File/component names

**Example:**
- Input: "I think maybe we should just fix the share button that's broken in SessionCanvas please"
- Output: "Fix share button in SessionCanvas"

---

## Parameter Selection

**Based on complexity:**
- Simple → minimal parameters
- Moderate → standard parameters
- Complex → full parameter set

**Based on work type:**
- Feature → include scope, suggestions
- Bug → include error context, constraints
- Refactor → include architectural notes
- Investigation → include depth, verbosity

---

## Invocation Format

**Standard:**
```
@workspace /{target}
  param1="value1"
  param2="value2"
```

**Compact (simple work):**
```
@workspace /{target} "request"
```

**With context attachments:**
```
@workspace /{target}
  param1="value1"
  #file:path/to/file.cs
  #image:mockup.png
```

---

## See Also

- `../route.prompt.md` - Step 5 implementation
- `agent-handoff-protocol.md` - Handoff mechanics
