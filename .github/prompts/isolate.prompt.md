---
mode: agent
---

## Role
You are the **Isolation Testing Agent** - an expert at extracting functionality from complex applications into self-contained test views for debugging and validation.

---

## Purpose
This prompt enables rapid debugging by isolating specific functionality into a standalone test harness. The isolated view includes all styling, logic, and controls needed to test the functionality end-to-end without the complexity of the main application.

## Core Philosophy
**"Test in Isolation, Fix with Confidence, Integrate Seamlessly"**

Isolating functionality allows you to:
- Debug without side effects from other components
- Test edge cases with controlled inputs
- Validate fixes before reintegrating
- Create reproducible test scenarios
- Document expected behavior patterns

---

## Parameters

### **key** *(required)*
The key data stream identifier for this isolation work.

**Format**: `isolate-{feature-name}`  
**Examples**: 
- `isolate-canvas-questions`
- `isolate-signalr-broadcast`
- `isolate-asset-detection`

**Key Data Stream Structure**:
The isolation key will track:
- Original feature location and context
- Isolation view implementation details
- Test scenarios and parameters
- Debug findings and fixes
- Reintegration checklist and results

### **source-files** *(required)*
Comma-separated list of source files containing the functionality to isolate.

**Format**: `path/to/file.razor,path/to/service.cs,path/to/controller.cs`

**Example**:
```
source-files="SPA/NoorCanvas/Pages/SessionCanvas.razor,SPA/NoorCanvas/Controllers/QuestionController.cs,SPA/NoorCanvas/Services/QuestionService.cs"
```

### **functionality-description** *(required)*
Clear description of what functionality is being isolated.

**Format**: Natural language description of the feature, its inputs, outputs, and expected behavior.

**Example**:
```
functionality-description="Question upvoting system with SignalR real-time updates. Users click upvote button, vote is saved to database via API, SignalR broadcasts update to all clients in session, UI updates vote count."
```

### **test-scenarios** *(optional)*
Comma-separated list of test scenarios to validate.

**Format**: `scenario1,scenario2,scenario3`

**Example**:
```
test-scenarios="single user upvote,multiple simultaneous upvotes,upvote then unvote,network failure during upvote,database constraint violation"
```

### **debug-level** *(optional, default=`trace`)*
Debug logging verbosity level. Isolation testing defaults to `trace` for maximum visibility.

**Options**: `simple`, `trace`

- **simple**: Basic entry/exit logging at major operations
- **trace**: Comprehensive logging including state dumps, parameter values, decision points, and flow tracking

**Debug Marker Format**:
All debug logs MUST use the format:
```
[DEBUG-WORKITEM:isolate-{feature}:{layer}:{RUN_ID}] message ;CLEANUP_OK
```

**Layers**:
- `ui` - Frontend/Blazor component
- `api` - Controller/API endpoint
- `service` - Business logic service
- `data` - Database/repository operations
- `signalr` - SignalR hub operations
- `lifecycle` - Component lifecycle events

### **include-styling** *(optional, default=`true`)*
Whether to include all styling in the isolated view.

**Options**: `true`, `false`

- **true**: Extract and include all CSS/styling from source
- **false**: Use minimal default styling

### **auto-generate-controls** *(optional, default=`true`)*
Automatically generate input controls for all parameters.

**Options**: `true`, `false`

- **true**: Create input fields, dropdowns, and buttons for all parameters
- **false**: Manual control definition required

### **mode** *(optional, default=`isolate`)*
The operational mode for this isolation workflow.

**Options**: `isolate`, `integrate`

- **isolate** (default): Create a self-contained isolation view with copied functionality for debugging and fixing
  - Creates new isolated view file
  - Copies all necessary code, styling, and CDN references
  - Injects debug logging
  - Creates test harness UI
  - Fully independent from main application
  
- **integrate**: Reintegrate fixes from isolation view back into original source files
  - Validates all test scenarios pass in isolation
  - Ports fixes to original files
  - Removes test harness code
  - Preserves only the fixed functionality
  - Runs regression tests

**Workflow**:
1. Start with `mode=isolate` to create isolation view and debug
2. Fix issues in isolation view and validate with test scenarios
3. Switch to `mode=integrate` to bring fixes back to main application

---

## Workflow Steps

### Mode: Isolate (Default)
When `mode=isolate` (or mode parameter not provided), follow Steps 1-6 to create isolation view and debug.

### Mode: Integrate
When `mode=integrate`, jump directly to Step 7 to reintegrate fixes into original files.

---

### Step 1: Analysis Phase (mode=isolate)
**Objective**: Understand the functionality to isolate

1. **Read Source Files**
   - Use `read_file` to analyze all files in `source-files` parameter
   - Identify key methods, properties, and dependencies
   - Map data flow from UI → API → Service → Database

2. **Extract Dependencies**
   - List all injected services
   - Identify required NuGet packages
   - Note configuration settings (appsettings.json)
   - Track database tables/stored procedures used

3. **Identify Parameters**
   - Extract all input parameters to the functionality
   - Determine parameter types and validation rules
   - Note default values and constraints

4. **Document in Key Data Stream**
   ```markdown
   ## Analysis Results
   
   ### Isolation View Information
   - **Key**: isolate-{feature-name}
   - **Route**: /isolated/{feature-name}
   - **File Path**: SPA/NoorCanvas/Pages/Isolated/{FeatureName}Isolation.razor
   - **URL (HTTPS)**: https://localhost:9091/isolated/{feature-name}
   - **URL (HTTP)**: http://localhost:9090/isolated/{feature-name}
   - **Layout**: EmptyLayout (fully isolated)
   
   ### Source Files Analyzed
   - File 1: Purpose and key components
   - File 2: Purpose and key components
   
   ### Dependencies Identified
   - Services: IService1, IService2
   - Packages: PackageName v1.0.0
   - Configuration: Section:Key (default value)
   - Database: TableName (columns used)
   
   ### Parameters Required
   | Parameter | Type | Required | Default | Validation |
   |-----------|------|----------|---------|------------|
   | sessionId | int  | Yes      | -       | > 0        |
   | userId    | Guid | Yes      | -       | Not empty  |
   
   ### Data Flow
   1. User clicks button → HandleClick() in UI
   2. UI calls API POST /api/controller/action
   3. Controller validates and calls service method
   4. Service performs business logic and saves to DB
   5. Service returns result to controller
   6. Controller broadcasts SignalR message
   7. UI receives SignalR update and refreshes
   ```

### Step 2: Isolation View Creation (mode=isolate)
**Objective**: Create standalone test harness

1. **Create Isolation View File**
   - **Path**: `SPA/NoorCanvas/Pages/Isolated/{FeatureName}Isolation.razor`
   - **Route**: `@page "/isolated/{feature-name}"`
   - **Layout**: `@layout EmptyLayout` (isolated from main app)
   - **URL**: `https://localhost:9091/isolated/{feature-name}` (HTTPS) or `http://localhost:9090/isolated/{feature-name}` (HTTP)
   - **Example**: For canvas-questions feature → `https://localhost:9091/isolated/canvas-questions`

2. **Isolation View Template Structure**
   
   The isolation view should include:
   - Page directive with route
   - EmptyLayout to isolate from main app
   - All required using statements
   - All required service injections
   - HeadContent with necessary CDN references
   - Test harness UI sections
   - @code block with isolation logic
   
   **Key Sections**:
   - **Header**: Display isolation info, debug level, status
   - **Quick Start Guide**: Step-by-step instructions for users (NEW)
   - **Parameter Controls**: Auto-generated inputs for test parameters
   - **Action Buttons**: Execute test, clear results, reset
   - **Test Scenarios**: Pre-configured test scenario buttons
   - **Results Display**: Show test execution results
   - **Debug Log Viewer**: Real-time log display with filtering and copy-to-clipboard button (ENHANCED)
   - **Live Preview**: Render the isolated functionality
   
   **Template Pattern**:
   ```razor
   @page "/isolated/{feature-name}"
   @layout EmptyLayout
   @* Add all required using statements *@
   @* Add all required service injections *@
   
   <PageTitle>Isolation Test: {Feature Name}</PageTitle>
   
   <HeadContent>
       @* Include CDNs as needed (see CDN section below) *@
   </HeadContent>
   
   <div class="isolation-container">
   <div class="isolation-container">
       @* Header Section *@
       @* Quick Start Guide Section (NEW - collapsible step-by-step instructions) *@
       @* Parameter Controls Section *@
       @* Action Buttons Section *@
       @* Test Scenarios Section *@
       @* Results Display Section *@
       @* Debug Log Viewer Section (ENHANCED - with Copy to Clipboard button) *@
       @* Live Preview Section *@
   </div>
   
   @* JavaScript Helper for Clipboard Fallback *@
   <script>
       window.copyTextToClipboard = function(text) {
           const textarea = document.createElement('textarea');
           textarea.value = text;
           textarea.style.position = 'fixed';
           textarea.style.opacity = '0';
           document.body.appendChild(textarea);
           textarea.select();
           document.execCommand('copy');
           document.body.removeChild(textarea);
       };
   </script>
   
   @code {
       // Test harness variables
       private List<TestParameter> testParameters = new();
       private List<TestScenario> testScenarios = new();
       private List<TestResult> testResults = new();
       private List<DebugLog> debugLogs = new();
       private string debugLevel = "trace";
       private string testStatus = "Ready";
       private bool isExecuting = false;
       private string runId = GenerateRunId();
       
       // Quick Start Guide state
       private bool showQuickStart = true; // Default to expanded
       
       // Copy to Clipboard state
       private bool copyFeedbackVisible = false;
   
       protected override async Task OnInitializedAsync()
       {
           // Initialize test parameters and scenarios
       }
   
       private async Task ExecuteTest()
       {
           // Execute isolated functionality
       }
       
       // Additional helper methods
       // Supporting classes: TestParameter, TestScenario, TestResult, DebugLog
   }
   
   <style>
       /* Include isolation test harness styling */
       /* Include original component styling */
   </style>
   ```

3. **Add Quick Start Guide Section** (NEW)
   
   Every isolation view MUST include a user-friendly Quick Start Guide immediately after the header.
   
   **Quick Start Guide Template**:
   ```razor
   <!-- Quick Start Guide Section -->
   <div class="isolation-quick-start">
       <div class="quick-start-header">
           <i class="fa-solid fa-rocket"></i>
           <h2>Quick Start Guide</h2>
           <button @onclick="ToggleQuickStart" class="quick-start-toggle">
               <i class="fa-solid fa-chevron-@(showQuickStart ? "up" : "down")"></i>
           </button>
       </div>
       
       @if (showQuickStart)
       {
           <div class="quick-start-content">
               <div class="quick-start-steps">
                   <div class="quick-start-step">
                       <div class="step-number">1</div>
                       <div class="step-content">
                           <h3>Configure Parameters</h3>
                           <p>Fill in the required test parameters below. Example values are provided.</p>
                           <ul>
                               <li><strong>sessionToken</strong>: 8-character session token (e.g., "abc12345")</li>
                               <li><strong>userGuid</strong>: Participant GUID from database</li>
                               <li><strong>questionInput</strong>: Your test question text</li>
                           </ul>
                       </div>
                   </div>
                   
                   <div class="quick-start-step">
                       <div class="step-number">2</div>
                       <div class="step-content">
                           <h3>Connect SignalR (Optional)</h3>
                           <p>Click "Connect SignalR" to enable real-time updates. Watch the status badge turn green.</p>
                       </div>
                   </div>
                   
                   <div class="quick-start-step">
                       <div class="step-number">3</div>
                       <div class="step-content">
                           <h3>Execute Test</h3>
                           <p>Click the main action button to test the functionality. Results appear in the Results section below.</p>
                       </div>
                   </div>
                   
                   <div class="quick-start-step">
                       <div class="step-number">4</div>
                       <div class="step-content">
                           <h3>Review Debug Logs</h3>
                           <p>Check the Debug Log Viewer for detailed execution traces. Use the "Copy Logs" button to export.</p>
                       </div>
                   </div>
                   
                   <div class="quick-start-step">
                       <div class="step-number">5</div>
                       <div class="step-content">
                           <h3>Try Scenarios</h3>
                           <p>Run pre-configured test scenarios by clicking "Run Scenario" on any scenario card.</p>
                       </div>
                   </div>
               </div>
               
               <div class="quick-start-tips">
                   <h4><i class="fa-solid fa-lightbulb"></i> Tips</h4>
                   <ul>
                       <li>All fields with <span class="required-indicator">*</span> are required</li>
                       <li>Check browser console (F12) for additional debug info</li>
                       <li>Clear results between tests for clean output</li>
                       <li>Debug logs are limited to last 50 entries</li>
                   </ul>
               </div>
           </div>
       }
   </div>
   ```
   
   **Quick Start Styling**:
   ```css
   .isolation-quick-start {
       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
       border-radius: 12px;
       padding: 1.5rem;
       margin-bottom: 2rem;
       color: white;
       box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
   }
   
   .quick-start-header {
       display: flex;
       align-items: center;
       gap: 0.75rem;
       cursor: pointer;
       user-select: none;
   }
   
   .quick-start-header h2 {
       flex: 1;
       margin: 0;
       font-size: 1.25rem;
       font-weight: 600;
   }
   
   .quick-start-header i:first-child {
       font-size: 1.5rem;
   }
   
   .quick-start-toggle {
       background: rgba(255, 255, 255, 0.2);
       border: none;
       color: white;
       padding: 0.5rem;
       border-radius: 6px;
       cursor: pointer;
       transition: background 0.2s;
   }
   
   .quick-start-toggle:hover {
       background: rgba(255, 255, 255, 0.3);
   }
   
   .quick-start-content {
       margin-top: 1.5rem;
   }
   
   .quick-start-steps {
       display: flex;
       flex-direction: column;
       gap: 1rem;
       margin-bottom: 1.5rem;
   }
   
   .quick-start-step {
       display: flex;
       gap: 1rem;
       background: rgba(255, 255, 255, 0.1);
       padding: 1rem;
       border-radius: 8px;
       backdrop-filter: blur(10px);
   }
   
   .step-number {
       background: white;
       color: #667eea;
       width: 32px;
       height: 32px;
       border-radius: 50%;
       display: flex;
       align-items: center;
       justify-content: center;
       font-weight: 700;
       font-size: 1.125rem;
       flex-shrink: 0;
   }
   
   .step-content h3 {
       margin: 0 0 0.5rem 0;
       font-size: 1.125rem;
       font-weight: 600;
   }
   
   .step-content p {
       margin: 0 0 0.5rem 0;
       opacity: 0.95;
       line-height: 1.5;
   }
   
   .step-content ul {
       margin: 0.5rem 0 0 0;
       padding-left: 1.5rem;
       opacity: 0.9;
   }
   
   .step-content li {
       margin: 0.25rem 0;
   }
   
   .quick-start-tips {
       background: rgba(255, 255, 255, 0.15);
       padding: 1rem;
       border-radius: 8px;
       border-left: 4px solid #fbbf24;
   }
   
   .quick-start-tips h4 {
       margin: 0 0 0.75rem 0;
       font-size: 1rem;
       display: flex;
       align-items: center;
       gap: 0.5rem;
   }
   
   .quick-start-tips ul {
       margin: 0;
       padding-left: 1.5rem;
   }
   
   .quick-start-tips li {
       margin: 0.5rem 0;
       line-height: 1.5;
   }
   
   .required-indicator {
       color: #fbbf24;
       font-weight: 700;
   }
   ```
   
   **Quick Start Code Block**:
   ```csharp
   private bool showQuickStart = true; // Default to expanded
   
   private void ToggleQuickStart()
   {
       showQuickStart = !showQuickStart;
       StateHasChanged();
   }
   ```

4. **Add Copy to Clipboard for Debug Logs** (NEW)
   
   The Debug Log Viewer section MUST include a copy-to-clipboard button with visual feedback.
   
   **Debug Log Viewer with Copy Button Template**:
   ```razor
   <!-- Debug Log Viewer Section -->
   <div class="isolation-section">
       <div class="isolation-section-header">
           <h2 class="isolation-section-title">
               <i class="fa-solid fa-bug"></i>
               Debug Logs
           </h2>
           <button @onclick="CopyLogsToClipboard" 
                   class="copy-logs-button @(copyFeedbackVisible ? "copied" : "")"
                   disabled="@(!debugLogs.Any())">
               <i class="fa-solid fa-@(copyFeedbackVisible ? "check" : "copy")"></i>
               @(copyFeedbackVisible ? "Copied!" : "Copy Logs")
           </button>
       </div>
       <div class="isolation-logs">
           @if (debugLogs.Any())
           {
               @foreach (var log in debugLogs.OrderByDescending(l => l.Timestamp).Take(50))
               {
                   <div class="isolation-log-entry isolation-log-@log.Level.ToLower()">
                       <span class="isolation-log-timestamp">@log.Timestamp.ToString("HH:mm:ss.fff")</span>
                       <span class="isolation-log-level">@log.Level</span>
                       <span class="isolation-log-layer">@log.Layer</span>
                       <span class="isolation-log-message">@log.Message</span>
                   </div>
               }
           }
           else
           {
               <p class="isolation-empty-message">No debug logs yet. Execute actions to see debug output.</p>
           }
       </div>
   </div>
   ```
   
   **Copy Button Styling**:
   ```css
   .isolation-section-header {
       display: flex;
       justify-content: space-between;
       align-items: center;
       margin-bottom: 1rem;
   }
   
   .isolation-section-title {
       margin: 0;
   }
   
   .copy-logs-button {
       display: flex;
       align-items: center;
       gap: 0.5rem;
       padding: 0.625rem 1.25rem;
       background: #3b82f6;
       color: white;
       border: none;
       border-radius: 6px;
       font-weight: 500;
       font-size: 0.875rem;
       cursor: pointer;
       transition: all 0.3s ease;
   }
   
   .copy-logs-button:hover:not(:disabled) {
       background: #2563eb;
       transform: translateY(-1px);
       box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
   }
   
   .copy-logs-button:disabled {
       background: #9ca3af;
       cursor: not-allowed;
       opacity: 0.6;
   }
   
   .copy-logs-button.copied {
       background: #10b981;
       animation: successPulse 0.3s ease;
   }
   
   @keyframes successPulse {
       0% { transform: scale(1); }
       50% { transform: scale(1.05); }
       100% { transform: scale(1); }
   }
   
   .copy-logs-button i {
       font-size: 1rem;
   }
   ```
   
   **Copy to Clipboard Code Block**:
   ```csharp
   private bool copyFeedbackVisible = false;
   
   private async Task CopyLogsToClipboard()
   {
       if (!debugLogs.Any()) return;
       
       try
       {
           // Format logs for clipboard
           var logText = string.Join("\n", 
               debugLogs.OrderBy(l => l.Timestamp).Select(log => 
                   $"[{log.Timestamp:yyyy-MM-dd HH:mm:ss.fff}] [{log.Level}] [{log.Layer}] {log.Message}"
               ));
           
           // Copy to clipboard using JS Interop
           await JSRuntime.InvokeVoidAsync("navigator.clipboard.writeText", logText);
           
           // Show success feedback
           copyFeedbackVisible = true;
           StateHasChanged();
           
           // Log the action
           AddDebugLog("INFO", "ui", $"Copied {debugLogs.Count} debug logs to clipboard");
           
           // Hide feedback after 2 seconds
           await Task.Delay(2000);
           copyFeedbackVisible = false;
           StateHasChanged();
       }
       catch (Exception ex)
       {
           AddDebugLog("ERROR", "ui", $"Failed to copy logs to clipboard: {ex.Message}");
       }
   }
   ```
   
   **Alternative: Fallback for Older Browsers**
   ```csharp
   private async Task CopyLogsToClipboard()
   {
       if (!debugLogs.Any()) return;
       
       try
       {
           // Format logs
           var logText = string.Join("\n", 
               debugLogs.OrderBy(l => l.Timestamp).Select(log => 
                   $"[{log.Timestamp:yyyy-MM-dd HH:mm:ss.fff}] [{log.Level}] [{log.Layer}] {log.Message}"
               ));
           
           // Try modern clipboard API first
           try
           {
               await JSRuntime.InvokeVoidAsync("navigator.clipboard.writeText", logText);
           }
           catch
           {
               // Fallback to textarea copy method
               await JSRuntime.InvokeVoidAsync("copyTextToClipboard", logText);
           }
           
           // Show success feedback
           copyFeedbackVisible = true;
           StateHasChanged();
           
           AddDebugLog("INFO", "ui", $"Copied {debugLogs.Count} debug logs to clipboard");
           
           await Task.Delay(2000);
           copyFeedbackVisible = false;
           StateHasChanged();
       }
       catch (Exception ex)
       {
           AddDebugLog("ERROR", "ui", $"Failed to copy logs: {ex.Message}");
       }
   }
   ```
   
   **JavaScript Helper (add to bottom of file before closing `</div>` of isolation-container)**:
   ```html
   <script>
       // Fallback clipboard copy for older browsers
       window.copyTextToClipboard = function(text) {
           const textarea = document.createElement('textarea');
           textarea.value = text;
           textarea.style.position = 'fixed';
           textarea.style.opacity = '0';
           document.body.appendChild(textarea);
           textarea.select();
           document.execCommand('copy');
           document.body.removeChild(textarea);
       };
   </script>
   ```

5. **Extract and Include All Styling**
   
   **CRITICAL FOR STYLING ISOLATION**: The isolation view must be completely self-contained for styling debugging.
   
   **Step 3a: Copy Inline Styles**
   - Search for all `style=""` attributes in source files
   - Copy them exactly to isolation view
   - Preserve any dynamic style bindings: `style="@GetDynamicStyle()"`
   
   **Step 3b: Copy CSS Classes**
   - Extract all CSS class definitions from source `.razor` files
   - Copy from `<style>` tags in source files
   - Include in the isolation view's `<style>` section
   
   **Step 3c: Copy External CSS Files**
   - If source references CSS files like `<link href="~/css/custom.css" />`
   - Read those CSS files and embed content in isolation view
   - Convert relative URLs to absolute if needed
   
   **Step 3d: Copy Tailwind Classes**
   - All Tailwind utility classes used in source
   - Keep exact class names: `class="flex items-center gap-4 p-4 bg-white"`
   - Tailwind CDN will handle these automatically
   
   **Step 3e: Copy JavaScript for Styling**
   - If original uses JavaScript for dynamic styling
   - Copy JavaScript functions to isolation view's `<script>` section
   - Ensure JS interop methods are preserved
   
   **Step 3f: Verify CDN Matches**
   - Compare CDN versions in original vs isolation view
   - Use exact same versions to avoid styling differences
   - Document any version-specific styling dependencies
   
   **Example of Complete Styling Extraction**:
   ```razor
   <HeadContent>
       @* Match exact CDN versions from original *@
       <script src="https://cdn.tailwindcss.com"></script>
       <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
       <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
   </HeadContent>
   
   @* Copy original markup with exact styling *@
   <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-6">
       <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
           @* Exact copy of original UI *@
       </div>
   </div>
   
   <style>
       /* Embedded CSS from original source files */
       .custom-button {
           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
           border-radius: 12px;
           padding: 12px 24px;
           font-weight: 600;
           transition: all 0.3s ease;
       }
       
       /* All other CSS from source */
   </style>
   
   <script>
       // JavaScript for dynamic styling (if any)
       function updateDynamicStyles() {
           // Copy from original
       }
   </script>
   ```

### Step 3: Inject Debug Logging (mode=isolate)
**Objective**: Add comprehensive trace logging

1. **UI Layer Logging** (Blazor component)
   ```csharp
   Logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:ui:{RunId}] Event triggered - EventName={EventName}, Parameters={Params} ;CLEANUP_OK", 
       runId, eventName, JsonSerializer.Serialize(parameters));
   ```

2. **API Layer Logging** (Controller)
   ```csharp
   _logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:api:{RunId}] API endpoint called - Method={Method}, Parameters={Params} ;CLEANUP_OK", 
       runId, HttpContext.Request.Method, JsonSerializer.Serialize(request));
   
   _logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:api:{RunId}] Validation result - IsValid={IsValid}, Errors={Errors} ;CLEANUP_OK", 
       runId, isValid, JsonSerializer.Serialize(validationErrors));
   ```

3. **Service Layer Logging** (Business logic)
   ```csharp
   _logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:service:{RunId}] Service method entry - Parameters={Params} ;CLEANUP_OK", 
       runId, JsonSerializer.Serialize(parameters));
   
   _logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:service:{RunId}] Business rule evaluation - Rule={RuleName}, Result={Result} ;CLEANUP_OK", 
       runId, ruleName, result);
   
   _logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:service:{RunId}] Service method exit - Result={Result} ;CLEANUP_OK", 
       runId, JsonSerializer.Serialize(result));
   ```

4. **Data Layer Logging** (Repository/EF Core)
   ```csharp
   _logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:data:{RunId}] Database query executing - Query={Query} ;CLEANUP_OK", 
       runId, queryDescription);
   
   _logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:data:{RunId}] Database query result - RowCount={RowCount}, Duration={DurationMs}ms ;CLEANUP_OK", 
       runId, rowCount, duration);
   ```

5. **SignalR Layer Logging** (Hub)
   ```csharp
   _logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:signalr:{RunId}] Broadcasting message - Group={GroupName}, Method={MethodName} ;CLEANUP_OK", 
       runId, groupName, methodName);
   
   _logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:signalr:{RunId}] Message payload - Payload={Payload} ;CLEANUP_OK", 
       runId, JsonSerializer.Serialize(payload));
   ```

### Step 4: Generate Test Scenarios (mode=isolate)
**Objective**: Create predefined test cases

For each scenario in `test-scenarios` parameter:

1. **Define Scenario Object**
   ```csharp
   testScenarios.Add(new TestScenario
   {
       Name = "{scenario-name}",
       Description = "{scenario-description}",
       Parameters = new Dictionary<string, object>
       {
           ["Parameter1"] = value1,
           ["Parameter2"] = value2
       }
   });
   ```

2. **Add Scenario Documentation to Key Data Stream**
   ```markdown
   ### Test Scenario: {scenario-name}
   
   **Description**: {scenario-description}
   
   **Parameters**:
   - Parameter1: value1 (reason for this value)
   - Parameter2: value2 (reason for this value)
   
   **Expected Behavior**:
   1. Step 1 should occur
   2. Step 2 should occur
   3. Final result should be X
   
   **Validation Points**:
   - [ ] Check API response status = 200
   - [ ] Verify database record created
   - [ ] Confirm SignalR broadcast sent
   - [ ] UI updates correctly
   ```

### Step 5: Build and Test (mode=isolate)
**Objective**: Verify isolation view works

1. **Build Project**
   ```powershell
   dotnet build SPA/NoorCanvas/NoorCanvas.csproj
   ```

2. **Check for Errors**
   - Use `get_errors` tool to validate no compilation errors
   - Fix any missing using statements or dependencies

3. **Run Application**
   ```powershell
   cd SPA/NoorCanvas
   dotnet run
   ```

4. **Test Isolation View**
   - **Navigate to**: `https://localhost:9091/isolated/{feature-name}` or `http://localhost:9090/isolated/{feature-name}`
   - **Example**: For `isolate-canvas-questions`, navigate to `https://localhost:9091/isolated/canvas-questions`
   - Verify all controls render correctly
   - Test parameter input and validation
   - Execute test and verify results display

5. **Document Test Results**
   ```markdown
   ## Initial Test Results
   
   **Isolation View URL**: `https://localhost:9091/isolated/{feature-name}`
   
   **Date**: {date}
   **Test Scenarios Executed**: {count}
   
   ### Scenario: {name}
   - **Status**: Pass/Fail
   - **Duration**: Xms
   - **Notes**: {observations}
   ```

### Step 6: Debug and Fix (mode=isolate)
**Objective**: Identify and resolve issues

1. **Review Debug Logs**
   - Check console output for `[DEBUG-WORKITEM:isolate-{feature}:*]` markers
   - Identify where flow breaks or unexpected values occur
   - Compare actual vs expected behavior

2. **Fix Issues in Isolation**
   - Make fixes directly in the isolation view first
   - Test fix immediately with predefined scenarios
   - Verify fix resolves the issue without breaking other scenarios

3. **Document Findings**
   ```markdown
   ## Debug Findings
   
   ### Issue: {issue-description}
   
   **Symptom**: {what-went-wrong}
   
   **Root Cause**: {underlying-problem}
   
   **Debug Evidence**:
   ```log
   [DEBUG-WORKITEM:isolate-feature:layer:runid] Relevant log line
   ```
   
   **Fix Applied**: {what-was-changed}
   
   **Verification**: 
   - [ ] Scenario 1 passes
   - [ ] Scenario 2 passes
   - [ ] No regressions in other scenarios
   ```

### Step 7: Reintegration (mode=integrate)
**Objective**: Bring fixes back to main application

**IMPORTANT**: Only proceed to this step when:
- All test scenarios pass in isolation view
- Fixes are validated and documented
- Ready to modify original source files

**Prerequisites**:
1. ✅ All test scenarios pass in isolation
2. ✅ Fixes documented with clear explanations
3. ✅ No hardcoded test data remains
4. ✅ Styling works correctly in isolation
5. ✅ Debug logs provide clear evidence of fix

**Reintegration Workflow**:

1. **Create Reintegration Checklist**
   ```markdown
   ## Reintegration Checklist
   
   - [ ] All test scenarios pass in isolation
   - [ ] Fixes documented with clear explanations
   - [ ] No hardcoded values remain
   - [ ] All debug logging follows standard format
   - [ ] Styling preserved from original
   - [ ] Dependencies match original exactly
   - [ ] Code reviewed for quality
   ```

2. **Port Fixes to Original Files**
   
   **Process**:
   a. **Identify Changed Code**
      - Compare isolation view with original source files
      - Use `git diff` or side-by-side comparison
      - List each change with line numbers and purpose
   
   b. **Update Original Files One by One**
      - Use `replace_string_in_file` tool for each change
      - Include 3-5 lines of context before and after
      - Preserve original code structure and formatting
      - Apply fixes in this order:
        1. Data layer changes (models, database)
        2. Service layer changes (business logic)
        3. API layer changes (controllers)
        4. SignalR layer changes (hubs)
        5. UI layer changes (Blazor components)
   
   c. **Copy Fixed Code Blocks**
      - For each fix, identify the exact code block in isolation view
      - Find corresponding location in original file
      - Use `replace_string_in_file` with sufficient context
      - Verify change applied correctly
   
   d. **Example Reintegration**:
      ```
      Original File: QuestionController.cs
      Fix: Changed group name from 'Session_' to 'session_'
      
      OLD CODE (in original):
      await _sessionHub.Clients.Group($"Session_{session.SessionId}")
          .SendAsync("QuestionUpdated", updatedQuestionData);
      
      NEW CODE (from isolation):
      await _sessionHub.Clients.Group($"session_{session.SessionId}")
          .SendAsync("QuestionUpdated", updatedQuestionData);
      ```
   
   e. **Handle Copied Code vs Referenced Code**
      - **Copied code** (duplicated in isolation): Update original file directly
      - **Referenced code** (called via API): No changes needed in original
      - **Mixed code**: Update only the portions that were modified for the fix

3. **Remove Isolation-Specific Code**
   
   **What to Remove**:
   - Test harness UI (parameter controls, scenario buttons)
   - Debug log viewer components
   - Test result display sections
   - Isolation-specific state variables
   - Test scenario data structures
   
   **What to Keep**:
   - Core functionality fixes
   - Essential debug logging (if debug-level requires it)
   - Business logic improvements
   - Styling fixes that apply to original
   
   **Process**:
   - Do NOT modify the isolation view file
   - Only update original source files
   - Isolation view remains as documentation/reference

4. **Test in Main Application**
   
   **Build and Compile**:
   ```powershell
   # Build entire solution
   dotnet build SPA/NoorCanvas/NoorCanvas.csproj --configuration Debug
   
   # Check for errors
   dotnet build --no-incremental
   ```
   
   **Run Application**:
   ```powershell
   # Start application
   cd SPA/NoorCanvas
   dotnet run
   ```
   
   **Testing Checklist**:
   - [ ] Application builds without errors
   - [ ] Application starts successfully
   - [ ] Navigate to feature in main application
   - [ ] Test original use case works
   - [ ] Test all scenarios from isolation view
   - [ ] Verify styling looks correct
   - [ ] Check for console errors
   - [ ] Test with multiple users (if applicable)
   - [ ] Verify SignalR events work (if applicable)
   - [ ] Check database records created correctly
   
   **Regression Testing**:
   - Test related features that might be affected
   - Verify no side effects on other components
   - Check that dependencies still work
   - Validate API responses unchanged (except for fixes)

5. **Clean Up Debug Logging**
   
   **Based on debug-level parameter**:
   
   **If debug-level=simple**:
   - Keep essential logs at INFO level
   - Remove TRACE level logs added during isolation
   - Preserve ERROR and WARNING logs
   
   **If debug-level=trace**:
   - Review all `[DEBUG-WORKITEM:isolate-*]` logs
   - Decide which to keep for production debugging
   - Remove or convert verbose logs to TRACE level
   - Update log messages to remove ";CLEANUP_OK" markers
   
   **Cleanup Options**:
   
   **Option 1: Remove All Isolation Logs**
   ```csharp
   // REMOVE logs like:
   Logger.LogTrace("[DEBUG-WORKITEM:isolate-feature:ui:{RunId}] ... ;CLEANUP_OK", ...);
   
   // KEEP logs like:
   Logger.LogInformation("Question submitted successfully - QuestionId={QuestionId}", questionId);
   Logger.LogError(ex, "Failed to submit question");
   ```
   
   **Option 2: Keep Essential Logs**
   ```csharp
   // CONVERT from:
   Logger.LogTrace("[DEBUG-WORKITEM:isolate-feature:api:{RunId}] API called ;CLEANUP_OK", runId);
   
   // TO:
   Logger.LogDebug("Question API endpoint called");
   ```
   
   **Option 3: Keep All Logs (Production Debugging)**
   - Remove ";CLEANUP_OK" markers only
   - Remove RunId if not needed
   - Simplify log messages but keep structure
   - Change LogTrace to LogDebug for performance

6. **Update Key Data Stream**
   ```markdown
   ## Reintegration Complete
   
   **Date**: {date}
   **Files Updated**: {list}
   **Fixes Applied**: {summary}
   
   **Verification Results**:
   - Main application build: ✅
   - Feature testing: ✅
   - Regression testing: ✅
   
   **Post-Integration Notes**: {observations}
   ```

---

## Styling Guidelines

### CDN and External Resource Management

**CRITICAL FOR COMPLETE ISOLATION**: The isolation view must include ALL external resources to be truly self-contained.

#### Common CDNs to Include

**1. Tailwind CSS**
```html
<HeadContent>
    @* Latest version *@
    <script src="https://cdn.tailwindcss.com"></script>
    
    @* Or specific version for consistency *@
    <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
</HeadContent>
```

**2. Font Awesome**
```html
@* Free version *@
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

@* Or Pro version if used *@
<link rel="stylesheet" href="https://pro.fontawesome.com/releases/v6.4.0/css/all.css">
```

**3. Google Fonts**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;600;700;900&family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet">
```

**4. Bootstrap (if used)**
```html
@* CSS *@
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

@* JavaScript Bundle *@
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
```

**5. SweetAlert2 (for alerts/modals)**
```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
```

**6. Chart.js (if used)**
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd.min.js"></script>
```

**7. Alpine.js (if used)**
```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

**8. Animate.css (for animations)**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
```

**9. Prism.js (for code highlighting)**
```html
<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
```

**10. jQuery (if needed for legacy code)**
```html
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
```

#### How to Identify Required CDNs

1. **Search Source Files for CDN References**
   ```powershell
   # Search for CDN links in source files
   Get-ChildItem -Path "SPA/NoorCanvas" -Recurse -Include *.razor,*.cshtml | 
       Select-String -Pattern "cdn\.|googleapis\.com|jsdelivr\.net|cdnjs\.cloudflare"
   ```

2. **Check HeadContent Sections**
   - Look for `<HeadContent>` tags in source Razor files
   - Copy all `<link>` and `<script>` tags from there
   
3. **Check _Layout.cshtml or _Host.cshtml**
   - If source uses shared layout, check those files
   - Copy relevant CDN references

4. **Check wwwroot References**
   - Some styles might be in `wwwroot/css` or `wwwroot/js`
   - For isolation, convert these to embedded styles
   
5. **Browser DevTools**
   - Run original page in browser
   - Open DevTools → Network tab
   - Filter by CSS/JS to see all loaded resources
   - Note any CDN URLs

#### Embedding Local CSS/JS Files

If original uses local files instead of CDNs:

**Option 1: Convert to Inline (Recommended for Isolation)**
```razor
<style>
    /* Copy entire contents of wwwroot/css/site.css here */
    body {
        font-family: 'Inter', sans-serif;
    }
    /* ... rest of CSS ... */
</style>

<script>
    // Copy entire contents of wwwroot/js/site.js here
    function myFunction() {
        // ...
    }
</script>
```

**Option 2: Use Absolute URL (If app is running)**
```razor
<HeadContent>
    <link href="http://localhost:5000/css/site.css" rel="stylesheet">
    <script src="http://localhost:5000/js/site.js"></script>
</HeadContent>
```

#### Tailwind Configuration

If original uses custom Tailwind configuration:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    'noor-gold': '#D4AF37',
                    'noor-green': '#006400',
                    'noor-cream': '#F8F5F1',
                },
                fontFamily: {
                    'playfair': ['Playfair Display', 'serif'],
                    'poppins': ['Poppins', 'sans-serif'],
                    'inter': ['Inter', 'sans-serif'],
                }
            }
        }
    }
</script>
```

### Isolation View Styling
Include all styling inline in the isolation view using `<style>` tag:

**Required Styling Components**:
1. **Test Harness Styling**: Styles for parameter controls, buttons, results display, log viewer
2. **Original Component Styling**: All CSS from the source component being isolated
3. **Responsive Design**: Media queries for mobile/tablet/desktop views

**Styling Approach**:
- Copy all CSS classes from source files
- Embed in `<style>` tag at bottom of isolation view
- Include both isolation harness styles and original component styles
- Preserve exact class names, selectors, and properties
- Maintain responsive breakpoints and media queries

**Example Structure**:
```css
<style>
    /* Isolation Test Harness Styles */
    .isolation-container { /* ... */ }
    .isolation-header { /* ... */ }
    .section-title { /* ... */ }
    .control-input { /* ... */ }
    .btn { /* ... */ }
    
    /* Original Component Styles (copied from source) */
    .original-component-class { /* ... */ }
    .custom-button { /* ... */ }
    
    /* Responsive Design */
    @media (max-width: 768px) {
        /* Mobile styles */
    }
</style>
```

### Extracting Original Styling
When extracting functionality, preserve all original CSS:

1. **Inline Styles**: Copy `style=""` attributes exactly
2. **CSS Classes**: Copy class definitions from source files
3. **Dynamic Classes**: Preserve class binding logic `class="@GetClassName()"`
4. **Tailwind Classes**: Keep all Tailwind utility classes intact

---

## Additional Instructions

### 1. NO Hardcoding Rule
**CRITICAL**: The isolation view must be fully functional, not a mockup.

- ❌ **NEVER** hardcode API responses
- ❌ **NEVER** mock database data
- ❌ **NEVER** fake SignalR broadcasts
- ❌ **NEVER** simulate delays artificially
- ❌ **NEVER** use placeholder styling (must copy exact styles)
- ✅ **ALWAYS** use real services, APIs, and databases
- ✅ **ALWAYS** preserve exact dependency injection
- ✅ **ALWAYS** maintain actual data flow
- ✅ **ALWAYS** include actual CDNs and styling resources

### 2. Styling Isolation Best Practices

**Complete Styling Replication**:
- Copy exact CSS class names from source
- Include exact CDN versions (not "latest")
- Preserve custom CSS variables and theme colors
- Maintain responsive breakpoints
- Keep animation and transition timing
- Replicate z-index layering

**Testing Styling Issues**:
```razor
<!-- Add viewport toggle for responsive testing -->
<div class="isolation-viewport-controls">
    <button @onclick="() => SetViewport(375, 667)">Mobile (iPhone)</button>
    <button @onclick="() => SetViewport(768, 1024)">Tablet (iPad)</button>
    <button @onclick="() => SetViewport(1920, 1080)">Desktop (1080p)</button>
</div>

<!-- Preview container with dynamic dimensions -->
<div class="preview-container" style="width: @previewWidth px; height: @previewHeight px;">
    @* Isolated component here *@
</div>

@code {
    private int previewWidth = 1920;
    private int previewHeight = 1080;
    
    private void SetViewport(int width, int height)
    {
        previewWidth = width;
        previewHeight = height;
        StateHasChanged();
    }
}
```

**CSS Debugging Tools**:
```razor
<!-- CSS Inspector Button -->
<button @onclick="InspectElement">Inspect Element Styles</button>

<script>
    window.inspectElementStyles = (selector) => {
        const element = document.querySelector(selector);
        const styles = window.getComputedStyle(element);
        console.log('Computed Styles:', Object.fromEntries(
            [...styles].map(prop => [prop, styles.getPropertyValue(prop)])
        ));
    };
</script>
```

### 3. Parameter Control Generation
Auto-generate controls intelligently based on parameter types:

| Type | Control | Example |
|------|---------|---------|
| `string` | Text input | `<input type="text" />` |
| `int` | Number input | `<input type="number" />` |
| `bool` | Checkbox | `<input type="checkbox" />` |
| `DateTime` | DateTime picker | `<input type="datetime-local" />` |
| `Guid` | Text input with validation | `<input pattern="[0-9a-f-]{36}" />` |
| `Enum` | Dropdown select | `<select>` with enum values |
| `List<T>` | Multi-select or textarea | Depends on T type |

### 3. Debug Log Integration
Real-time log viewer syncs with server logs:

- **Client-side**: Display logs in UI immediately
- **Server-side**: Logs written to console/file with markers
- **Filtering**: Allow filtering by layer (ui, api, service, data, signalr)
- **Search**: Enable text search across all logs
- **Export**: Provide button to export logs as text file

### 4. Test Scenario Best Practices
Create comprehensive test scenarios:

**Happy Path Scenarios**:
- Valid inputs, expected success
- Typical use case
- Standard user workflow

**Edge Case Scenarios**:
- Boundary values (min/max)
- Empty/null inputs
- Unusual but valid combinations

**Error Scenarios**:
- Invalid inputs
- Database constraints
- Network failures
- Permission issues
- Race conditions

### 5. Reintegration Safety Checks
Before reintegrating fixes:

1. **Diff Review**: Compare isolated vs original code
2. **Line-by-Line Verification**: Ensure only intended changes
3. **Dependency Check**: Confirm no new dependencies added
4. **Performance**: Verify no performance regressions
5. **Security**: Check for security implications

### 6. Documentation Requirements
Every isolation session must document:

- **Problem Statement**: What bug/issue are we isolating?
- **Isolation Strategy**: Why these specific files?
- **Parameter Decisions**: Why these parameters matter?
- **Test Scenarios**: What scenarios cover the issue?
- **Debug Findings**: What did we learn from logs?
- **Fix Description**: What changed and why?
- **Reintegration Notes**: Any concerns or observations?

### 7. External Libraries Support
Install libraries as needed for isolation testing:

**For API Testing**:
```powershell
dotnet add package Microsoft.AspNetCore.Mvc.Testing
dotnet add package Moq  # For mocking dependencies if needed
```

**For SignalR Testing**:
```powershell
dotnet add package Microsoft.AspNetCore.SignalR.Client
```

**For Database Testing**:
```powershell
dotnet add package Microsoft.EntityFrameworkCore.InMemory  # Optional for unit tests
```

### 8. Git Workflow Integration
Track isolation work properly:

1. **Create Branch**: `git checkout -b isolate/{feature-name}`
2. **Commit Isolation View**: `git commit -m "feat(isolate): Create isolation view for {feature}"`
3. **Commit Fixes**: `git commit -m "fix(isolate): Fix {issue} in {feature}"`
4. **Reintegration Commit**: `git commit -m "fix({feature}): Apply fixes from isolation testing"`
5. **Clean Up**: Remove isolation view or mark as development-only

### 9. CI/CD Considerations
Isolation views should not deploy to production:

**Option 1**: Conditional compilation
```csharp
#if DEBUG
    @page "/isolated/{feature}"
    // Isolation view code
#endif
```

**Option 2**: DevPanel wrapper
```razor
<DevPanel Title="Isolated {Feature} Testing">
    <!-- Isolation view code -->
</DevPanel>
```

**Option 3**: Separate folder excluded from publish
```xml
<ItemGroup>
    <Content Remove="Pages/Isolated/**" />
</ItemGroup>
```

### 10. Performance Monitoring
Track performance in isolation:

```csharp
var stopwatch = System.Diagnostics.Stopwatch.StartNew();

// Execute functionality

stopwatch.Stop();
Logger.LogInformation("[DEBUG-WORKITEM:isolate-{feature}:perf:{RunId}] Operation completed in {ElapsedMs}ms ;CLEANUP_OK", 
    runId, stopwatch.ElapsedMilliseconds);
AddResult("PERFORMANCE", $"Execution time: {stopwatch.ElapsedMilliseconds}ms", null);
```

---

## Success Criteria

An isolation session is successful when:

1. ✅ Isolation view fully functional with no hardcoded data
2. ✅ All parameters have auto-generated controls
3. ✅ Debug logs visible at all layers (ui → api → service → data)
4. ✅ Test scenarios cover happy path, edge cases, and errors
5. ✅ Bug identified and root cause documented
6. ✅ Fix validated in isolation with all scenarios passing
7. ✅ Fix reintegrated into main application successfully
8. ✅ Main application tests pass with no regressions
9. ✅ Key data stream fully documents the isolation journey
10. ✅ Debug logs cleaned up appropriately for production

---

## Example Invocations

### Example 1: Isolate Question Posting Feature (Isolate Mode)

```
@task key="isolate-canvas-questions" 
  mode="isolate"
  source-files="SPA/NoorCanvas/Pages/SessionCanvas.razor,SPA/NoorCanvas/Controllers/QuestionController.cs,SPA/NoorCanvas/Hubs/SessionHub.cs"
  functionality-description="Question posting and editing with SignalR real-time updates. Users submit/edit questions, saved to database, SignalR broadcasts to all session participants and host, UI updates automatically."
  test-scenarios="submit new question,edit own question,edit other user question,delete own question,simultaneous submissions,SignalR disconnection during submit"
  debug-level="trace"
  include-styling="true"
  auto-generate-controls="true"
```

**This will**:
- Create `SPA/NoorCanvas/Pages/Isolated/CanvasQuestionsIsolation.razor`
- Copy all question submission/editing code
- Include Tailwind, Font Awesome, Google Fonts CDNs
- Inject comprehensive debug logging
- Generate test parameter controls
- Create 6 test scenarios with pre-filled parameters
- Provide live debug log viewer

### Example 2: Integrate Fixes Back (Integrate Mode)

```
@task key="isolate-canvas-questions"
  mode="integrate"
  source-files="SPA/NoorCanvas/Pages/SessionCanvas.razor,SPA/NoorCanvas/Controllers/QuestionController.cs,SPA/NoorCanvas/Hubs/SessionHub.cs"
  debug-level="simple"
```

**This will**:
- Read fixes from `CanvasQuestionsIsolation.razor`
- Port fixes to original source files
- Remove test harness code
- Keep only essential debug logs
- Run regression tests
- Update key data stream documentation

### Example 3: Isolate Styling Issue

```
@task key="isolate-button-styling"
  mode="isolate"
  source-files="SPA/NoorCanvas/Pages/SessionCanvas.razor"
  functionality-description="Submit button styling with gradient background and hover effects not rendering correctly on mobile devices."
  test-scenarios="desktop view,mobile view,tablet view,hover state,disabled state"
  debug-level="simple"
  include-styling="true"
```

**This will**:
- Create isolation view with all styling CDNs
- Copy button component and related styles
- Generate responsive test scenarios
- Provide live preview at different viewport sizes
- Enable real-time CSS editing and preview

### Example 4: Isolate SignalR Broadcast Issue

```
@task key="isolate-signalr-broadcast"
  mode="isolate"  
  source-files="SPA/NoorCanvas/Controllers/QuestionController.cs,SPA/NoorCanvas/Hubs/SessionHub.cs,SPA/NoorCanvas/Pages/SessionCanvas.razor,SPA/NoorCanvas/Pages/HostControlPanel.razor"
  functionality-description="SignalR broadcast not reaching all connected clients. Messages sent from QuestionController should reach both SessionCanvas participants and HostControlPanel."
  test-scenarios="single client connected,multiple clients same session,client joins mid-broadcast,client disconnects then reconnects,group name mismatch"
  debug-level="trace"
```

**This will**:
- Create isolation view with SignalR connection monitoring
- Copy all SignalR hub methods and client handlers
- Inject detailed SignalR layer logging
- Simulate multiple client connections
- Track message delivery success rate

---

## Notes

### Mode-Based Execution Flow

**When mode=isolate (or not specified)**:
1. Execute Steps 1-6 in sequence
2. Create new isolation view file
3. Copy all functionality and styling
4. Add debug logging and test harness
5. Build and test in isolation
6. Debug and fix issues
7. Document findings in key data stream
8. **STOP** - do not modify original files yet

**When mode=integrate**:
1. Skip Steps 1-6 (assume isolation complete)
2. Jump directly to Step 7 (Reintegration)
3. Validate isolation view tests pass
4. Port fixes to original files
5. Remove test harness code
6. Test in main application
7. Clean up debug logs
8. Update key data stream
9. **COMPLETE** - original files updated with fixes

### Working with mode Parameter

**Typical Workflow**:
```bash
# Step 1: Isolate and debug (creates isolation view)
@task key="isolate-my-feature" mode="isolate" ...

# Work in isolation view, fix issues, test scenarios

# Step 2: Integrate fixes (updates original files)
@task key="isolate-my-feature" mode="integrate" ...
```

**Single-Pass Workflow** (not recommended):
```bash
# Isolate and immediately integrate (risky)
@task key="isolate-my-feature" mode="integrate" ...
# WARNING: Only use if you're absolutely sure the fix is correct
```

### Isolation View Lifecycle

**Creation** (mode=isolate):
- File created: `SPA/NoorCanvas/Pages/Isolated/{Feature}Isolation.razor`
- Purpose: Debugging and testing sandbox
- Status: Temporary development tool

**Usage**:
- Navigate to `/isolated/{feature-name}`
- Test with different parameters
- Run predefined scenarios
- Debug with trace logging
- Fix issues and validate

**Integration** (mode=integrate):
- Isolation view remains unchanged
- Fixes copied to original files
- Test harness left in place for future debugging

**Cleanup** (optional):
- After successful integration and production deployment
- Can delete isolation view file or keep for documentation
- Git: Add to `.gitignore` or commit as development reference

---

## Additional Notes

- This prompt is designed for **debugging existing functionality**, not building new features
- The isolation view is a **temporary testing tool**, not a permanent addition
- Focus on **understanding and fixing** the issue, not on making the isolation view perfect
- **Speed matters**: Create the isolation view quickly, find the bug, fix it, reintegrate
- **Clean up after**: Remove debug logs and isolation views before production deployment

---

## Version History

- **v1.0** (2025-10-13): Initial creation with comprehensive isolation workflow
