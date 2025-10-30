# Questionnaire: KSESSIONS Resources CDN Setup

**Plan Key**: `ksessions-resources-cdn`  
**Purpose**: Determine the optimal architecture for serving KSESSIONS Resources folder  
**Instructions**: Mark your choice with `[X]` and provide answers in designated sections

---

## Q1: Resource Serving Architecture

Select your preferred approach for serving `D:\Websites\KSESSIONS\Resources`:

- [X ] **Option A: IIS Static Site** (Dedicated IIS site on separate port)
  - **Pros**: Complete isolation, simple IIS management, dedicated app pool
  - **Cons**: Additional port management, separate SSL cert needed
  - **Dev URL**: `http://localhost:9092/images/{sessionId}/{file}`
  - **Prod URL**: `https://resources.kashkole.com/images/{sessionId}/{file}` (via Cloudflare)

- [ ] **Option B: Virtual Directory** (Mount under existing NoorCanvas IIS site)
  - **Pros**: Single domain, shared SSL, simpler Cloudflare routing
  - **Cons**: Coupled to NoorCanvas site lifecycle
  - **Dev URL**: `http://localhost:9090/resources/images/{sessionId}/{file}`
  - **Prod URL**: `https://noorcanvas.kashkole.com/resources/images/{sessionId}/{file}`

- [ ] **Option C: ASP.NET Core StaticFiles Middleware** (Code-based approach)
  - **Pros**: Programmatic control, easy config per environment, CORS flexibility
  - **Cons**: Requires code changes to Program.cs, consumes app memory
  - **Dev URL**: `https://localhost:9091/resources/images/{sessionId}/{file}`
  - **Prod URL**: `https://noorcanvas.kashkole.com/resources/images/{sessionId}/{file}`

- [ ] **Option D: Hybrid (StaticFiles for Dev + IIS Static Site for Prod)**
  - **Pros**: Best of both worlds - flexible dev, optimized prod
  - **Cons**: Different configs per environment, more complex deployment
  - **Dev URL**: `https://localhost:9091/resources/images/{sessionId}/{file}`
  - **Prod URL**: `https://resources.kashkole.com/images/{sessionId}/{file}`

**Your Selection**: _______________  
**Reasoning** (optional): 
```
[Write your reasoning here if needed]
```

---

## Q2: Cross-Origin Access Requirements

Will other applications (beyond NoorCanvas) need to access these resources?

- [X ] **Yes** - Need CORS configuration for multiple applications
  - List applications that need access: session.kashkole.com, localhost:8080 (dev). The folder is located under the session.kashkole.com/resources path.
  
- [ ] **No** - Only NoorCanvas will consume these resources
  
- [ ] **Unsure** - May need it in the future

**Impact**: Determines CORS headers and security configuration

---

## Q3: Cloudflare Tunnel Configuration

How should Cloudflare tunnel handle resource serving?

- [X ] **Option A: Subdomain** (`resources.kashkole.com`)
  - Requires: New Cloudflare tunnel config, separate subdomain DNS
  
- [ ] **Option B: Path-based** (`noorcanvas.kashkole.com/resources/*`)
  - Requires: Update existing tunnel rules for path routing
  
- [ ] **Option C: Both** (subdomain AND path-based for redundancy)
  - Requires: Full tunnel config + DNS setup

**Your Selection**: _______________

---

## Q4: Development Environment Configuration

For local development, do you want:

- [X ] **Option A: Direct file system access** (file:/// URLs - simplest)
  - Fast, no server needed, limited to local machine
  
- [ ] **Option B: Local HTTP server** (localhost URLs via IIS/Kestrel)
  - Mimics production, supports network access, CORS testing
  
- [ ] **Option C: Cloudflare tunnel to localhost** (public URL during dev)
  - Test production setup locally, accessible remotely

**Your Selection**: _______________

---

## Q5: Resource URL Pattern

Prefer which URL structure for accessing session images?

- [ ] **Option A: Session-based path**
  - `/resources/images/{sessionId}/{filename}.jpg`
  - Example: `/resources/images/2343/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg`
  
- [X ] **Option B: Flat GUID-based**
  - `/resources/images/{guid}.jpg`
  - Example: `/resources/images/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg`
  - Note: Requires database mapping sessionId → assets

**Your Selection**: _______________  
**Rationale**: _______________________________________________________

---

## Q6: Caching and Performance

For production, enable aggressive caching?

- [X ] **Yes** - Cache static assets for 1 year (recommended)
  - Configuration: `Cache-Control: public, max-age=31536000, immutable`
  
- [ ] **Moderate** - Cache for 1 week
  - Configuration: `Cache-Control: public, max-age=604800`
  
- [ ] **No** - Minimal caching (testing/debugging scenarios)
  - Configuration: `Cache-Control: no-cache`

**Your Selection**: _______________

---

## Q7: Audio/Video Streaming Support

Do you need streaming support for MEDIA/MP3 folders?

- [X ] **Yes** - Enable range requests and MIME type handling
  - Required for HTML5 `<audio>` and `<video>` elements
  
- [ ] **No** - Simple static file serving is sufficient

**Your Selection**: _______________

---

## Q8: Security and Access Control

Should resource access be:

- [ ] **Public** - No authentication required (fastest)
  
- [X ] **Token-based** - Require signed URLs or access tokens
  - Use case: Prevent hotlinking, control access per session
  
- [ ] **Session-based** - Only accessible to authenticated NoorCanvas users

**Your Selection**: _______________

---

## Summary Section (Auto-filled after submission)

**Architecture Choice**: IIS Static Site (Option A)  
**CORS Needed**: Yes (session.kashkole.com, localhost:8080)  
**Cloudflare Strategy**: Subdomain (resources.kashkole.com)  
**Dev Environment**: Direct file system (file:///)  
**URL Pattern**: GUID-flat (/resources/images/{guid}.jpg)  
**Caching Strategy**: Aggressive (1 year)  
**Streaming Support**: Yes (MP3/MEDIA with range requests)  
**Security Model**: Token-based (signed URLs)

---

## Next Steps

After completing this questionnaire, the plan will be finalized with:
1. Detailed implementation phases
2. Configuration file templates
3. Deployment scripts
4. Testing scenarios

**Submit by**: Marking choices with [X] and saving this file.
