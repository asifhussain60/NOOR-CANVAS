# Blazor View Rebuild Strategy — Copilot Prompt (for `.razor` views)

**Context**  
- Project type: **Blazor** (Server or WebAssembly), using `.razor` views.  
- Source: I will provide a complete **HTML mock** for a view.  
- Goal: Generate a production-ready `.razor` file that faithfully reproduces the mock **and** works within the Blazor stack.

---

## ✅ High-Level Objectives
1. **Replace the entire view**: Copy the **ENTIRE** provided HTML into the target `.razor` file, **replacing all existing markup** if the view already exists.  
2. **Make it Blazor-correct**: Systematically adapt the raw HTML to valid Razor/Blazor: components, bindings, event handling, assets, and accessibility.  
3. **Bind placeholders to real data**: Convert placeholders into actual **Blazor bindings** backed by a strongly-typed model.  
4. **Insert the logo block**: Find the comment `<!-- Logo -->` and insert a centered `<div class="noor-canvas-logo">...</div>`.  
5. **Inline styles only**: All styles must be **inline** in the markup to prevent cross-view conflicts.  
6. **Lint / verify syntax**: Ensure the generated Razor compiles cleanly and passes analyzers (no red squiggles). Provide a quick self-check list.

---

## 🔧 Detailed Instructions for Copilot

### 1) Replace the Entire View
- Overwrite the target `.razor` file with the full HTML provided. Do not merge or partially reuse old markup.
- Preserve the original structure and content order from the mock.
- Keep *only* a single root container if needed (e.g., `<div>`) to satisfy Razor rules.

### 2) Adapt HTML for Blazor
- Convert any incompatible HTML or attributes into Razor-friendly equivalents (e.g., `for=""` on `<label>` should reference `id` of input; void tags must not have closing tags).
- Fix self-closing elements and boolean attributes to valid HTML5/Razor.
- Replace raw event attributes (e.g., `onclick="..."`) with Blazor events (e.g., `@onclick="HandlerName"`). Implement the handler in `@code`.
- Use Blazor components when applicable (e.g., `<InputText>`, `<InputNumber>`, `<EditForm>`, `<DataAnnotationsValidator>`).
- Ensure relative asset paths (images, fonts) resolve correctly under `wwwroot`. If uncertain, add a TODO comment with the expected path.
- Add basic **ARIA** attributes and semantic roles where straightforward (keep minimal and correct).

### 3) Bind Placeholders to Real Data
- Detect placeholders in the HTML (patterns may include `{{Name}}`, `[[Name]]`, `data-bind="Name"`, or comments like `<!-- bind: Name -->`).  
- Replace placeholders with Razor expressions `@Model.Property` or `@Property` as appropriate.
- Create a strongly-typed backing model in the `@code` block (or a separate `*.cs` model if needed). Prefer:
  ```csharp
  [Parameter] public MyViewModel? Model { get; set; }
  ```
  - If `Model` is null (design-time), **seed demo data** in `OnInitialized` so the view renders in isolation.
- For editable fields, use `@bind-Value`, `@bind`, or component equivalents (`<InputText @bind-Value="Model.Name" />`).
- For lists/tables/cards, use `@foreach` rendering with strongly-typed items.
- For conditional sections, use `@if` / `@else` blocks (no inline JS).

### 4) Insert the Centered Logo Block
- Locate the exact marker: `<!-- Logo -->`.
- Immediately after this comment, insert:
  ```html
  <div class="noor-canvas-logo" style="display:flex;align-items:center;justify-content:center;text-align:center;">
      <!-- Optional: replace with an <img> or SVG if available -->
      <span>@(Model?.LogoText ?? "Noor Canvas")</span>
  </div>
  ```
- Ensure the block is horizontally centered (and vertically centered if that section’s container has a fixed height). Use **inline styles only**.
- Do **not** introduce global CSS, external stylesheets, or classes beyond what the mock already includes.

### 5) Inline Styles Only (No Conflicts)
- All styling must be **inline** (e.g., `style="..."` directly on elements).  
- Do **not** modify or create global `.css` files.  
- If a style is reused, duplicate the inline style where needed (intentional for isolation).

### 6) Lint / Syntax Verification (Razor-Friendly Checklist)
Before finalizing, ensure:
- ✅ The file builds: Razor compiles with **no errors or warnings**.  
- ✅ All `@using` or `@inject` statements needed by components or models are present.  
- ✅ All event handlers referenced in markup exist in `@code` and are `private` unless needed externally.  
- ✅ Nullable annotations respected (`#nullable enable`) and null checks for `Model` when rendering.  
- ✅ No unresolved paths, missing assets, or broken loops/conditions.  
- ✅ Recommend (but don’t require) running:
  - `dotnet build` (treat warnings as errors where possible)
  - `dotnet format` (for style/analyzers)

---

## 📦 Output Requirements
- **Return the full content** of the final `.razor` file (complete markup **plus** the `@code` block).  
- If a view model class is introduced, include it inline (temporary) **or** provide the exact `*.cs` file content with namespace and `using` directives.  
- Include a short **"What Changed"** summary at the end (bullet points: replaced markup, bindings added, handlers added, logo block inserted, inline styles, any TODOs).

---

## 🧩 Minimal Example Skeleton (for Copilot to Follow)

```razor
@page "/sample-view"
@using System.ComponentModel.DataAnnotations

<!-- Root container (copied from mock and adapted) -->
<div id="sample-root" style="min-height:100vh;display:flex;flex-direction:column;padding:16px;">

    <!-- Logo -->
    <!-- Logo -->
    <div class="noor-canvas-logo" style="display:flex;align-items:center;justify-content:center;text-align:center;margin-bottom:12px;">
        <span style="font-weight:600;font-size:1.25rem;">@(Model?.LogoText ?? "Noor Canvas")</span>
    </div>

    <!-- Example bound content copied from mock -->
    <h1 style="margin:0 0 8px 0;">@Model?.Title</h1>
    <p style="margin:0 0 16px 0;">@Model?.Subtitle</p>

    <EditForm Model="Model" OnValidSubmit="HandleSubmit" style="display:block;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
        <DataAnnotationsValidator />
        <div style="display:flex;gap:8px;align-items:center;">
            <label for="name" style="width:120px;">Name</label>
            <InputText id="name" @bind-Value="Model!.Name" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;" />
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;align-items:center;">
            <label for="age" style="width:120px;">Age</label>
            <InputNumber id="age" @bind-Value="Model!.Age" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;" />
        </div>
        <button type="submit" style="margin-top:12px;padding:8px 12px;border:0;border-radius:8px;background:#111827;color:#fff;cursor:pointer;">
            Save
        </button>
    </EditForm>

    @if (Items?.Any() == true)
    {
        <ul style="margin-top:16px;padding-left:18px;">
            @foreach (var item in Items)
            {
                <li>@item</li>
            }
        </ul>
    }
</div>

@code {
    [Parameter] public SampleViewModel? Model { get; set; }
    private List<string>? Items { get; set; }

    protected override void OnInitialized()
    {
        // Seed demo data so the view renders without external inputs
        Model ??= new SampleViewModel
        {
            LogoText = "Noor Canvas",
            Title = "Guided Learning",
            Subtitle = "Welcome to the sample view",
            Name = "Fatima",
            Age = 21
        };

        Items ??= new List<string> { "Lesson 1", "Lesson 2", "Lesson 3" };
    }

    private void HandleSubmit()
    {
        // Handle form submit (placeholder)
    }

    public class SampleViewModel
    {
        public string? LogoText { get; set; }

        [Required]
        public string? Name { get; set; }

        [Range(1, 120)]
        public int Age { get; set; }

        public string? Title { get; set; }
        public string? Subtitle { get; set; }
    }
}
```

---

## 📝 Copilot One-Shot Prompt (Paste This)

> **You are updating a Blazor `.razor` view from a complete HTML mock.**  
> 1) **Replace** the entire file with the HTML exactly as provided.  
> 2) **Adapt** the markup to valid Blazor/Razor (events, components, asset paths, accessibility).  
> 3) **Bind** placeholders to real data via a strongly-typed model; seed demo data if `Model` is null.  
> 4) Find `<!-- Logo -->` and insert a centered `<div class="noor-canvas-logo">` block (inline styles only).  
> 5) Keep **all styles inline**; do not create or modify global CSS.  
> 6) Verify the view compiles (no analyzer errors).  
> **Return**: the full `.razor` file content (including `@code`), plus a short “What Changed” summary.