---
Trilogy-Version: 2025-11-03
Title: The KDS Story — One Door, Three‑Story Brain
Includes-PR-Intelligence: true
Generated-By: kds.md trilogy section
Generated-At: 2025-11-03T14:05:00Z
---

# A story for humans: The One Door and the Three‑Story Brain

Imagine a small, well-run city called KDS. At the very front of City Hall there's only one entrance with a sign that says:

"Speak here in plain words. We'll take it from there."

That entrance is the One Door — your single command: `#file:KDS/prompts/user/kds.md`. You step up and say what you want, and the city quietly springs into action.

## The cast (each with exactly one job)

**The Door (Universal Entry Point)**
- Listens to your request in natural language and ushers it inside. You never need to remember a different door.

**The Dispatcher (Router → `intent-router.md`)**
- Hears your words and decides who should take the job first. If you say "I want to add…", it calls the Planner; if you say "continue", it calls the Executor; if you say "test this", it calls the Tester.

**The Planner (Work Planner → `work-planner.md`)**
- Turns big wishes into careful phases and small tasks. No building begins without a plan that matches the city's layout.

**The Builder (Executor → `code-executor.md`)**
- Creates or edits what's needed, one focused task at a time, following the plan.

**The Tester (Test Generator → `test-generator.md`)**
- Writes and runs checks to prove the work behaves as promised, including visual checks when needed.

**The Inspector (Health Validator → `health-validator.md`)**
- Walks the site to verify the system is healthy: builds, tests, and safeguards are green.

**The Governor (Change Governor → `change-governor.md`)**
- Reviews changes made to the city's own rules (KDS itself) and keeps standards high.

**The Fixer (Error Corrector → `error-corrector.md`)**
- If someone starts working on the wrong thing or in the wrong place, the Fixer halts, reverts, and puts everyone back on the correct track.

**The Timekeeper (Session Resumer → `session-resumer.md`)**
- Remembers exactly where you left off yesterday and guides you to the next step today.

**The Analyst with a Lens (Screenshot Analyzer → `screenshot-analyzer.md`)**
- Looks at pictures and mockups and translates what's on the screen into clear requirements.

**The Archivist (Commit Handler → `commit-handler.md`)**
- Files finished work with tidy labels, organizes related changes, and tags milestones so history stays readable.

Every person in KDS City has one job on purpose. That's the SOLID way: simple roles, clean handoffs, and no one wearing two hats.

## The Three‑Story Brain at the center of town

In the town square stands a quiet, wise building called the Brain. It has three floors:

**1) Ground Floor — Short‑Term Conversations (Tier 1 → `conversation-history.jsonl`)**
- Keeps the last 20 complete conversations. If you say, "Make it purple," it remembers which "it" you meant. The oldest conversation is gently filed away when a new one begins (FIFO), and the active one is never discarded.

**2) Second Floor — Long‑Term Knowledge (Tier 2 → `knowledge-graph.yaml`)**
- All the city's experiences become patterns here: which requests usually mean which intent, which files often change together, what workflows succeed. It grows wiser with use.

**3) Top Floor — Development Context (Tier 3 → `development-context.yaml`)**
- A balcony view of the whole project: commit rhythms, file hotspots, testing health, and helpful correlations. It can gently warn, "That file has been unstable lately," or "Smaller steps work better here."

Feeding the Brain is the Scribe — an ever‑writing pen (`events.jsonl`). After meaningful periods (say, ~50 new events or a day has passed), the Brain Updater (`brain-updater.md`) tidies notes into long‑term memory and, when it's been at least an hour, refreshes the balcony view (Tier 3) using the Development Context Collector (`development-context-collector.md`).

## A day in KDS City (how the parts work together)

You arrive at the Door and say, "I want to add a pulse animation to the FAB button."

1. **The Door opens** → The Dispatcher listens and says, "This is a plan." It calls the Planner.
2. **The Planner drafts** a simple map: phases, tasks, and acceptance criteria that match how the city is built today — including what must be verified.
3. **The Tester writes** the checks first and runs them (RED). The city expects failing tests before any building begins.
4. **The Builder implements** the change to make those checks pass (GREEN), in the right place, the right way.
5. **The Tester reruns** the checks until they're all green, and small cleanups happen safely (REFACTOR) while tests stay green.
6. **The Inspector strolls** through. "Healthy," they say.
7. **The Archivist files** the work cleanly, perhaps adding a tag for this milestone.
8. **The Scribe logs** each step; later, the Brain absorbs the experience so the next similar request is faster and safer.

> **TDD is the rule here:** write the checks first (RED), make them pass (GREEN), then polish (REFACTOR).

If mid‑way someone starts in the wrong file, the Fixer freezes the scene, undoes the mistake, and points to the correct file. If you return tomorrow and say, "continue," the Timekeeper guides you to the exact next step without you repeating a thing.

If you bring a screenshot instead of words, the Analyst with a Lens reads the picture like a blueprint and translates it for the Planner and Builder.

## Why the city runs smoothly

- **One Door** means zero guesswork for you. You always speak in plain words.
- **The Dispatcher** consults the Brain, so routing gets smarter over time.
- **Each specialist** does one job, which keeps quality high and surprises low.
- **The Brain** remembers conversations (short‑term), learns patterns (long‑term), and watches the horizon (context) to guide better decisions.

## Try it in one sentence

Use the One Door and just talk:

```markdown
#file:KDS/prompts/user/kds.md

I want to add a pulse animation to the FAB button
```

KDS City will plan it, build it, test it, validate it, commit it — and learn from it.

## Who's who (quick reference)

- **Universal Entry:** `kds.md` (this file)
- **Router:** `intent-router.md`
- **Planner:** `work-planner.md`
- **Executor:** `code-executor.md`
- **Tester:** `test-generator.md`
- **Validator:** `health-validator.md`
- **Governor:** `change-governor.md`
- **Error Corrector:** `error-corrector.md`
- **Session Resumer:** `session-resumer.md`
- **Screenshot Analyzer:** `screenshot-analyzer.md`
- **Commit Handler:** `commit-handler.md`
- **Brain Updater:** `brain-updater.md`
- **Brain Query:** `brain-query.md`
- **Conversation Manager:** `conversation-context-manager.md`
- **Dev Context Collector:** `development-context-collector.md`
- **Abstractions:** `session-loader`, `test-runner`, `file-accessor`, `brain-query`
- **Brain Storage:** `conversation-history.jsonl`, `knowledge-graph.yaml`, `development-context.yaml`, `events.jsonl`

**If all you remember is "the One Door" and "the Three‑Story Brain," you'll already understand how KDS works.**

---

**Visual Reference:** See `Image-Prompts.md` for AI-generated illustration prompts (23 scenes).  
**Technical Details:** See `Technical-Reference.md` for agent mappings and architecture.
