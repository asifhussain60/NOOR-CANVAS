# URL Migration Plan: noorcanvas.servehttp.com → noorcanvas.kashkole.com

**Key**: `url-migration-production`  
**Date**: 2025-10-23  
**Work**: Migrate production URL from noorcanvas.servehttp.com to https://noorcanvas.kashkole.com  

---

## Phase 1: Core Application URL Updates

**Context**: Update hardcoded production URLs in core application files.

**Task Prompt**:
```
@task key=url-migration-phase1 work="Update production URLs in core application files from noorcanvas.servehttp.com to noorcanvas.kashkole.com"

Priority: high
Files: SPA/NoorCanvas/Program.cs, SPA/NoorCanvas/Pages/UserLanding.razor, SPA/NoorCanvas/Services/HostSessionService.cs, SPA/NoorCanvas/Services/Security/DatabaseEnvironmentGuardService.cs

Requirements:
1. Update PRODUCTION_HOSTNAME constant in DatabaseEnvironmentGuardService.cs
2. Update hardcoded production URLs in Program.cs (lines 122, 134)
3. Update hardcoded production URLs in UserLanding.razor (lines 525-526)
4. Update hardcoded production URLs in HostSessionService.cs (lines 68, 86)
5. Ensure all URL references use https://noorcanvas.kashkole.com
6. Maintain existing conditional logic and patterns
7. Update related comments and documentation strings

Testing:
- Verify no hardcoded servehttp.com references remain in core files
- Confirm security guard service uses new hostname
- Validate URL generation logic works correctly
```

**Exit Criteria**: All hardcoded production URLs updated in core application files, no servehttp.com references remain.

---

## Phase 2: Configuration and Environment Updates

**Context**: Update configuration files and environment-specific settings.

**Task Prompt**:
```
@task key=url-migration-phase2 work="Update configuration files and environment settings for new production URL"

Priority: high
Files: SPA/NoorCanvas/appsettings.Production.json, Tools/HostProvisioner/*/appsettings*.json

Requirements:
1. Add BaseUrl configuration to appsettings.Production.json if needed
2. Update any URL configurations in HostProvisioner appsettings files
3. Ensure CORS policies allow new domain
4. Update any API endpoint configurations
5. Review and update security headers for new domain

Testing:
- Verify configuration loads correctly
- Test CORS policies with new domain
- Validate API connectivity
```

**Exit Criteria**: All configuration files updated for new domain, CORS and security policies configured.

---

## Phase 3: Documentation and Deployment Scripts

**Context**: Update deployment scripts, documentation, and reference materials.

**Task Prompt**:
```
@task key=url-migration-phase3 work="Update deployment scripts and documentation for new production URL"

Priority: medium
Files: Scripts/ncdeploy.ps1, Scripts/ncdeploy.bat, Scripts/post-deploy-smoke-test.ps1, Docs/, Workspaces/

Requirements:
1. Update deployment scripts to reference new URL for smoke tests
2. Update documentation files that reference old production URL
3. Update any hardcoded URLs in test and verification scripts
4. Add migration notes to deployment documentation
5. Update README files and quick reference guides

Testing:
- Verify deployment scripts work with new URL
- Test smoke test scripts against new domain
- Confirm documentation accuracy
```

**Exit Criteria**: All scripts and documentation updated, deployment process validated.

---

## Phase 4: Test Generation and Validation

**Context**: Create tests to validate the URL migration works correctly.

**Test Generation Prompt**:
```
@test-generation key=url-migration-tests work="Generate tests to validate production URL migration"

Requirements:
1. Create Playwright test to verify new production URL accessibility
2. Test security guard service with new hostname
3. Validate URL generation logic in various scenarios
4. Test CORS functionality with new domain
5. Create smoke test for deployment validation

Test scenarios:
- Production hostname detection
- Security guard validation
- URL generation in different environments
- Cross-origin requests
- SSL/TLS verification

Location: Tests/UI/url-migration-validation.spec.ts
```

**Exit Criteria**: Comprehensive test suite created and passing for URL migration.

---

## Phase 5: Self-Review and Validation

**Context**: Comprehensive review of all changes and validation.

**Requirements**:
1. **Design Review**: Verify all URL references updated consistently
2. **Security Review**: Confirm security policies work with new domain
3. **Functionality Review**: Test URL generation in all scenarios
4. **Configuration Review**: Validate all environment configs are correct
5. **Documentation Review**: Ensure all references are updated

**Pass Criteria**:
- Zero references to noorcanvas.servehttp.com in production code
- All tests passing
- Security guard service working correctly
- CORS policies functional
- Documentation accurate and complete

---

## Phase 6: Final Healthcheck and Completion

**Context**: Final system validation and completion summary.

**Healthcheck**: Run comprehensive system health check to ensure no regressions introduced.

**Completion Metrics**:
- Files updated: ~10-15 core files
- URL references changed: ~8-10 locations
- Tests created: 5-7 validation tests
- Documentation updated: Multiple reference files

---

## Error Remediation Plan

**High Priority Errors**:
1. Broken URL generation logic
2. CORS policy failures
3. Security guard false positives

**Medium Priority Errors**:
1. Inconsistent URL references
2. Documentation inconsistencies
3. Test configuration issues

**Remediation Strategy**:
- Immediate rollback capability via git checkpoint commits
- Incremental testing after each phase
- Manual verification of critical URL generation paths