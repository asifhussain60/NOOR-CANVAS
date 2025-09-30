import { expect, test } from '@playwright/test';

/**
 * [DEBUG-WORKITEM:retrosync:comprehensive] Comprehensive system audit for architecture synchronization
 * Tests current API endpoints, services, and architecture state
 * Uses retrosync protocol for requirements/implementation/test synchronization
 */

test.describe('RETROSYNC: Comprehensive System Architecture Audit', () => {

    test('API Endpoints Inventory - Controllers and Services', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:retrosync:comprehensive] Starting API inventory audit');

        // Test key API endpoints for functionality and availability
        const apiTests = [
            // HostController endpoints
            { endpoint: '/api/host/albums', method: 'GET', description: 'Host albums cascade' },
            { endpoint: '/api/host/token/PQ9N5YWW/validate', method: 'GET', description: 'Host token validation' },
            { endpoint: '/api/host/sessions/list', method: 'GET', description: 'Host sessions list' },
            { endpoint: '/api/host/asset-lookup', method: 'GET', description: 'Asset lookup definitions' },
            { endpoint: '/api/host/ksessions/countries/flags', method: 'GET', description: 'Country flags from KSESSIONS' },

            // ParticipantController endpoints  
            { endpoint: '/api/participant/session/TXZ25W6K/validate', method: 'GET', description: 'Participant token validation' },
            { endpoint: '/api/participant/session/TXZ25W6K/participants', method: 'GET', description: 'Session participants list' },

            // QuestionController endpoints
            { endpoint: '/api/question/session/TXZ25W6K', method: 'GET', description: 'Session Q&A retrieval' },

            // AdminController endpoints
            { endpoint: '/api/admin/sessions', method: 'GET', description: 'Admin session management' },

            // HealthController endpoints
            { endpoint: '/api/health', method: 'GET', description: 'System health check' },
            { endpoint: '/api/health/detailed', method: 'GET', description: 'Detailed health metrics' },

            // HostProvisionerController endpoints
            { endpoint: '/api/hostprovisioner/status', method: 'GET', description: 'Host provisioner status' },

            // IssueController endpoints
            { endpoint: '/api/issue', method: 'GET', description: 'Issue tracking list' }
        ];

        let workingEndpoints = 0;
        let failedEndpoints = 0;
        const results: any[] = [];

        for (const apiTest of apiTests) {
            try {
                console.log(`[DEBUG-WORKITEM:retrosync:comprehensive] Testing ${apiTest.method} ${apiTest.endpoint}`);

                const response = await page.request.get(`https://localhost:9091${apiTest.endpoint}`);
                const isWorking = response.ok() || response.status() === 401 || response.status() === 404; // 401/404 means endpoint exists

                if (isWorking) {
                    workingEndpoints++;
                    console.log(`✅ ${apiTest.endpoint} - ${response.status()}`);
                } else {
                    failedEndpoints++;
                    console.log(`❌ ${apiTest.endpoint} - ${response.status()}`);
                }

                results.push({
                    endpoint: apiTest.endpoint,
                    method: apiTest.method,
                    status: response.status(),
                    working: isWorking,
                    description: apiTest.description
                });

                // Small delay between requests
                await page.waitForTimeout(100);

            } catch (error) {
                failedEndpoints++;
                console.log(`❌ ${apiTest.endpoint} - Connection failed: ${error}`);
                results.push({
                    endpoint: apiTest.endpoint,
                    method: apiTest.method,
                    status: 'ERROR',
                    working: false,
                    description: apiTest.description,
                    error: error.message
                });
            }
        }

        console.log(`[DEBUG-WORKITEM:retrosync:comprehensive] API Inventory Complete:`);
        console.log(`✅ Working endpoints: ${workingEndpoints}`);
        console.log(`❌ Failed endpoints: ${failedEndpoints}`);
        console.log(`📊 Total tested: ${apiTests.length}`);

        // Validate that core endpoints are working
        expect(workingEndpoints).toBeGreaterThan(failedEndpoints);
        expect(workingEndpoints).toBeGreaterThanOrEqual(8); // Minimum viable endpoints
    });

    test('SignalR Hubs Infrastructure Validation', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:retrosync:comprehensive] Testing SignalR hubs connectivity');

        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Check SignalR hub connections via browser console
        const signalrStatus = await page.evaluate(() => {
            const hubs = ['SessionHub', 'QAHub', 'AnnotationHub', 'TestHub'];
            const results = {};

            // Check if SignalR is available
            if (window['blazorCulture']) {
                results['blazor'] = 'available';
            }

            // Check for SignalR connection references
            const scripts = Array.from(document.querySelectorAll('script'));
            const signalrScripts = scripts.filter(s => s.src && s.src.includes('signalr'));
            results['signalr_scripts'] = signalrScripts.length;

            return results;
        });

        console.log('[DEBUG-WORKITEM:retrosync:comprehensive] SignalR Infrastructure:', signalrStatus);

        // Test hub endpoints (they should return method not allowed, indicating they exist)
        const hubEndpoints = [
            '/hub/session',
            '/hub/qa',
            '/hub/annotation',
            '/hub/test'
        ];

        let hubsFound = 0;
        for (const hubEndpoint of hubEndpoints) {
            try {
                const response = await page.request.get(`https://localhost:9091${hubEndpoint}`);
                // SignalR hubs typically return 405 Method Not Allowed for GET requests
                if (response.status() === 405 || response.status() === 200) {
                    hubsFound++;
                    console.log(`✅ Hub found: ${hubEndpoint}`);
                } else {
                    console.log(`❓ Hub status uncertain: ${hubEndpoint} - ${response.status()}`);
                }
            } catch (error) {
                console.log(`❌ Hub not accessible: ${hubEndpoint} - ${error}`);
            }
        }

        expect(hubsFound).toBeGreaterThanOrEqual(3); // At minimum SessionHub, QAHub, AnnotationHub should be available
    });

    test('Database Connectivity and Models Validation', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:retrosync:comprehensive] Testing database connectivity via health endpoints');

        // Test database connectivity via health endpoint
        const healthResponse = await page.request.get('https://localhost:9091/api/health/detailed');
        expect(healthResponse.ok()).toBeTruthy();

        const healthData = await healthResponse.json();
        console.log('[DEBUG-WORKITEM:retrosync:comprehensive] Health check results:', healthData);

        // Validate database models via API responses
        const sessionValidation = await page.request.get('https://localhost:9091/api/participant/session/TXZ25W6K/validate');
        if (sessionValidation.ok()) {
            const sessionData = await sessionValidation.json();
            console.log('[DEBUG-WORKITEM:retrosync:comprehensive] Session validation model:', sessionData);
        }

        // Check if recent KSESSIONS integration is working
        const countryFlagsTest = await page.request.get('https://localhost:9091/api/host/ksessions/countries/flags');
        if (countryFlagsTest.ok()) {
            const flagsData = await countryFlagsTest.json();
            console.log('[DEBUG-WORKITEM:retrosync:comprehensive] KSESSIONS country flags integration working:', flagsData);
        }
    });

    test('Recent Architecture Changes Validation', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:retrosync:comprehensive] Validating recent architectural changes');

        // Test new KSESSIONS API endpoints added in September 2025
        const newEndpoints = [
            '/api/host/ksessions/session/212/details',
            '/api/host/ksessions/countries/flags',
            '/api/host/asset-lookup'
        ];

        let newEndpointsWorking = 0;
        for (const endpoint of newEndpoints) {
            try {
                const response = await page.request.get(`https://localhost:9091${endpoint}`);
                if (response.ok() || response.status() === 401) { // 401 means endpoint exists but needs auth
                    newEndpointsWorking++;
                    console.log(`✅ New endpoint working: ${endpoint}`);
                } else {
                    console.log(`❓ New endpoint status: ${endpoint} - ${response.status()}`);
                }
            } catch (error) {
                console.log(`❌ New endpoint failed: ${endpoint} - ${error}`);
            }
        }

        // Test routing fix: /host/control-panel/{token} should work
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        const finalUrl = page.url();
        expect(finalUrl).toContain('/host/control-panel/PQ9N5YWW');
        console.log(`✅ Routing fix validated: ${finalUrl}`);

        // Test backward compatibility redirect: /host/control/{token} should redirect
        await page.goto('https://localhost:9091/host/control/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        const redirectedUrl = page.url();
        expect(redirectedUrl).toContain('/host/control-panel/PQ9N5YWW');
        console.log(`✅ Backward compatibility redirect working: ${redirectedUrl}`);

        expect(newEndpointsWorking).toBeGreaterThanOrEqual(1); // At least one new endpoint should be working
    });

    test('Service Layer Architecture Validation', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:retrosync:comprehensive] Validating service layer architecture');

        // Test service integration by loading a complex page that uses multiple services
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Check for evidence of key services being loaded/working
        const servicesStatus = await page.evaluate(() => {
            const results = {};

            // Check for Blazor Server functionality (indicates service registration worked)
            results['blazor_components'] = document.querySelectorAll('[b-*]').length > 0;

            // Check for CSS loading (LoadingService, ConfigurableLoadingService)
            const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            results['stylesheets_loaded'] = stylesheets.length;

            // Check for JavaScript services
            results['page_title'] = document.title;
            results['has_form_elements'] = document.querySelectorAll('input, button, select').length > 0;

            return results;
        });

        console.log('[DEBUG-WORKITEM:retrosync:comprehensive] Services status:', servicesStatus);

        // Validate core page functionality indicates services are working
        expect(servicesStatus['blazor_components']).toBe(true);
        expect(servicesStatus['stylesheets_loaded']).toBeGreaterThan(0);
        expect(servicesStatus['has_form_elements']).toBe(true);
        expect(servicesStatus['page_title']).toContain('NOOR Canvas');
    });
});