# Prompt File Enhancement: Task Analysis & Planning

**Date**: September 28, 2025 12:24  
**Files Modified**: 
- `.github/prompts/workitem.prompt.md`
- `.github/prompts/continue.prompt.md`

## Summary
Enhanced both workitem and continue prompt files to include comprehensive task analysis and planning sections that require agents to summarize tasks/phases for users before beginning any work.

## Changes Made

### New Section: "Task Analysis & Planning"
Added between **Parameters** and **Context & Inputs** sections in both files.

#### Key Features:
1. **Mandatory Pre-Work Analysis**
   - Parse user input (single task vs. `---` delimited phases)
   - Extract clear requirements and scope
   - Assess complexity and risks

2. **Phase Breakdown (for multi-phase requests)**
   - Count and summarize each phase
   - Identify dependencies between phases
   - Plan execution order

3. **Structured User Summary**
   - **Workitem**: `📋 WORKITEM ANALYSIS` format
   - **Continue**: `🔄 CONTINUATION ANALYSIS` format
   - Includes scope, task breakdown, risks, and execution plan

4. **User Confirmation Requirement**
   - Agents must wait for explicit approval ("Y/N")
   - No implementation begins until user confirms
   - Changes must be documented if plan is modified

## Benefits

### For Users:
- **Clear Visibility**: See exactly what will be done before work starts
- **Informed Decisions**: Understand scope, risks, and complexity upfront
- **Control**: Ability to modify or reject plans before implementation
- **Predictability**: Consistent format for all workitem and continuation requests

### For Agents:
- **Structured Approach**: Mandatory planning prevents rushed implementations
- **Risk Mitigation**: Forces consideration of dependencies and conflicts
- **Quality Assurance**: Ensures alignment with user expectations before starting
- **Documentation**: Creates clear record of planned vs. actual work

## Implementation Details

### Workitem Summary Format:
```
📋 WORKITEM ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Key: {key}
Mode: {mode}
Request: {brief_description}

🎯 SCOPE ANALYSIS
🔍 TASK BREAKDOWN  
⚠️  DEPENDENCIES & RISKS
🚀 EXECUTION PLAN

Proceed with implementation? (Y/N)
```

### Continue Summary Format:
```
🔄 CONTINUATION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Key: {key}
Mode: {mode}

📊 CURRENT STATE
🎯 CONTINUATION SCOPE  
🔍 CONTINUATION BREAKDOWN
⚠️  DEPENDENCIES & RISKS
🚀 RESUMPTION PLAN

Proceed with continuation? (Y/N)
```

## Technical Integration

### Phase Processing Enhancement:
- Maintains existing `---` delimiter parsing
- Adds phase counting and dependency analysis
- Integrates with existing test mode requirements
- Preserves all existing functionality

### Quality Gate Integration:
- Works with existing analyzer/linter/test protocols
- Compatible with all operation modes (`analyze`, `apply`, `test`)
- Maintains debug logging requirements
- Supports rollback mode for continue operations

## Compatibility
- ✅ Backward compatible with existing workitem keys
- ✅ Maintains all existing parameters and modes
- ✅ Preserves SelfAwareness.instructions.md references  
- ✅ Compatible with SystemStructureSummary.md requirements
- ✅ Works with all existing quality gates and protocols

## Impact Assessment
- **User Experience**: Significantly improved - clear expectations and control
- **Agent Behavior**: More structured and predictable planning phase
- **Quality**: Enhanced through mandatory up-front analysis
- **Documentation**: Better tracking of planned vs. actual work
- **Risk Management**: Proactive identification of issues before implementation

This enhancement transforms both `/workitem` and `/continue` from immediate execution tools into structured, user-confirmed planning and implementation workflows.