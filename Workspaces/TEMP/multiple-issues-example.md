# Multiple Issues Support Example

## Usage

You can now report multiple issues in a single prompt using the "---" delimiter:

```
106 The dropdown animation is too slow, can we speed it up?
---
The login button on mobile devices appears cut off on smaller screens
---
Users report that the search function doesn't work with special characters like @#$%
---
107 Additional feedback: the color scheme needs to match the brand guidelines better
```

## Processing Logic

1. **Input Parsing**: The system splits on "---" and processes each section
2. **Issue Classification**:
   - `106 The dropdown...` → Existing Issue-106 feedback
   - `The login button...` → New Issue-109 (assuming 108 is next available)
   - `Users report...` → New Issue-110
   - `107 Additional feedback...` → Existing Issue-107 feedback
3. **Application Startup**: Validates app is running once before any testing
4. **Sequential Processing**: Handles each issue individually
5. **Consolidated Output**: Provides summary of all work performed

## Benefits

- **Efficiency**: Report multiple issues without separate prompts
- **Context**: Related issues can be reported together
- **Tracking**: All issues properly numbered and tracked
- **Testing**: Single application startup for all validation needs

## Example Output

```
Processing 4 issues from batch input:

✅ Issue-106: Added feedback about dropdown animation speed
✅ Issue-109: Created new issue for mobile login button display
✅ Issue-110: Created new issue for search special character handling
✅ Issue-107: Added feedback about color scheme requirements

All issues have been processed and tracked in the issue tracker.
```
