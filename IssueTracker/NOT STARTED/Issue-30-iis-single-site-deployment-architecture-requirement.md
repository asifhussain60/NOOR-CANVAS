# Issue-30: IIS Single-Site Deployment Architecture Requirement

**Issue ID**: #30  
**Title**: IIS Single-Site Deployment Architecture Requirement  
**Status**: NOT STARTED  
**Priority**: HIGH  
**Category**: Enhancement  
**Created**: September 13, 2025  
**Last Updated**: September 13, 2025  

---

## 🎯 **Problem Statement**

NOOR Canvas currently uses multiple ports during development:
- **Main Application**: https://localhost:9091 (ASP.NET Core Blazor Server)
- **DocFX Documentation**: http://localhost:9093 (Static documentation site)
- **Test Suite**: Various ports for automated testing

**Production Requirement**: All services must be deployed under a **single IIS site** in production environment. The client infrastructure only supports one IIS site binding, not multiple applications on different ports.

---

## 📊 **Current Development Architecture**

### **Port Usage Analysis**
```
Development Environment:
├── Main Application (NOOR Canvas)
│   ├── HTTPS: localhost:9091 (Primary)
│   └── HTTP: localhost:9090 (Fallback)
├── DocFX Documentation Server
│   └── HTTP: localhost:9093
└── Test Suite Infrastructure
    ├── Health Check Harness
    ├── Implementation Tests
    └── Manual Testing Interface
```

### **Services Requiring Integration**
1. **ASP.NET Core Main Application** (Blazor Server + SignalR)
2. **Static Documentation Site** (DocFX generated content)
3. **Testing Infrastructure** (Health checks, test harnesses)
4. **Development Tools** (NC command suite, observer diagnostics)

---

## 🏗️ **Deployment Architecture Requirements**

### **Single IIS Site Structure**
```
Production IIS Site (https://domain.com):
├── / (root)                     # Main NOOR Canvas application
├── /docs/                       # Static DocFX documentation
├── /health/                     # Health check endpoints
├── /tests/ (dev only)           # Test harnesses (dev/staging only)
└── /observer/ (dev only)        # NOOR Observer (dev/staging only)
```

### **Technical Constraints**
- **Single Port Binding**: 443 HTTPS only (with 80 HTTP redirect)
- **No Subdomain Support**: Cannot use docs.domain.com or test.domain.com
- **IIS Application Pool**: Single app pool for entire site
- **Static Content**: DocFX output must be served as static files under /docs/
- **Security**: Test and observer endpoints disabled in production

---

## 🔧 **Implementation Strategy**

### **Phase 1: ASP.NET Core Route Mapping**
```csharp
// Configure static file serving for DocFX content
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(env.ContentRootPath, "docs")),
    RequestPath = "/docs"
});

// Health check routing
app.MapHealthChecks("/health/basic");
app.MapHealthChecks("/health/detailed", new HealthCheckOptions { ResponseWriter = WriteDetailedResponse });

// Development-only endpoints
if (env.IsDevelopment() || env.IsStaging())
{
    app.MapGet("/tests/", async context => { /* Test harness UI */ });
    app.Map("/observer/stream", observerApp => { /* NOOR Observer SSE */ });
}
```

### **Phase 2: DocFX Integration**
- **Build Process**: Integrate `docfx build` into deployment pipeline
- **Output Location**: Copy DocFX `_site` output to `wwwroot/docs/`
- **Base URL Configuration**: Update DocFX `docfx.json` for `/docs/` base path
- **Asset References**: Ensure all documentation assets use relative paths

### **Phase 3: Development Tool Integration**
- **NC Command Updates**: Modify `nc` command to handle single-site serving
- **Test Infrastructure**: Update test harnesses to use main application host
- **Port Consolidation**: Remove dependency on multiple development ports

---

## 📋 **Implementation Tasks**

### **High Priority Tasks**
- [ ] **Configure ASP.NET Core static file serving** for DocFX content under `/docs/`
- [ ] **Update DocFX configuration** to generate content for `/docs/` base path
- [ ] **Modify deployment scripts** to copy DocFX output to `wwwroot/docs/`
- [ ] **Update NC command suite** to serve consolidated application
- [ ] **Configure IIS application settings** for single-site deployment

### **Medium Priority Tasks**
- [ ] **Update development workflow** to test single-site architecture locally
- [ ] **Modify test infrastructure** to use unified host and port
- [ ] **Update documentation** to reflect new URL structure
- [ ] **Configure environment-based endpoint exposure** (prod vs dev)

### **Testing & Validation**
- [ ] **Local single-site testing**: Verify all services accessible under one port
- [ ] **IIS deployment validation**: Test actual IIS single-site deployment
- [ ] **Documentation accessibility**: Ensure `/docs/` serves DocFX content correctly
- [ ] **Cross-environment testing**: Validate dev/staging/prod configurations

---

## 🎯 **Acceptance Criteria**

### **Development Environment**
- [ ] Main application, documentation, and test tools accessible on single port
- [ ] `nc` command launches unified development server
- [ ] All existing functionality preserved under new URL structure

### **Production Environment**
- [ ] Single IIS site serves main application at root (`/`)
- [ ] Documentation accessible at `/docs/` with full functionality
- [ ] Health checks available at `/health/` endpoints
- [ ] Test and observer endpoints disabled in production
- [ ] SSL certificate covers all integrated services

### **User Experience**
- [ ] No user-facing URL changes for main application functionality
- [ ] Documentation remains fully navigable and searchable
- [ ] Internal links between application and documentation work correctly
- [ ] Performance impact minimal from serving multiple content types

---

## 🔗 **Related Issues & Dependencies**

### **Upstream Dependencies**
- **Phase 6 Deployment Planning**: This issue blocks final deployment architecture
- **DocFX Documentation System**: Must be compatible with static file serving
- **NC Command Suite**: Requires updates for single-site development workflow

### **Downstream Impact**
- **IIS Configuration Scripts**: Need updating for single-site deployment
- **Development Documentation**: URL structure documentation needs updating
- **CI/CD Pipeline**: Build process must include DocFX integration

---

## 📝 **Technical Notes**

### **IIS Configuration Considerations**
- **MIME Types**: Ensure IIS serves DocFX assets (CSS, JS, fonts) correctly
- **Directory Browsing**: Disable for security while allowing application routing
- **Compression**: Enable for static documentation content
- **Caching Headers**: Configure appropriate caching for docs vs. application

### **ASP.NET Core Routing Priority**
```csharp
// Ensure static files are served before MVC routing
app.UseStaticFiles(); // Default wwwroot
app.UseStaticFiles(docsOptions); // DocFX content
app.UseRouting();
app.MapRazorPages(); // Application routing
app.MapControllers();
```

### **DocFX Configuration Updates**
```json
{
  "build": {
    "dest": "_site",
    "globalMetadata": {
      "_appTitle": "NOOR Canvas Documentation",
      "_baseUrl": "/docs/"
    }
  }
}
```

---

## 🕒 **Timeline**

### **Target Completion**
- **Issue Resolution**: Before Phase 6 deployment (Week 19)
- **Testing Completion**: Week 18 (Phase 5)
- **Implementation**: Phase 4-5 transition

### **Critical Path**
This issue is **CRITICAL** for production deployment. Must be resolved before final deployment phase to avoid production architecture changes.

---

## 🔄 **Status Updates**

### **September 13, 2025 - Issue Created**
- Identified single-site IIS deployment requirement
- Documented current multi-port development architecture
- Outlined implementation strategy and tasks
- Added to Phase 6 deployment dependencies

**Next Action**: Begin Phase 4 integration planning with DocFX static file serving configuration.
