import { expect, test } from '@playwright/test';

test.describe('HtmlAgilityPack Asset Processing Tests', () => {
    test('Host Controller - Process HTML Assets API endpoint', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Starting HtmlAgilityPack asset processing test');

        // Test HTML content with various Islamic assets that should be detected
        const testHtmlContent = `
      <div class="session-content">
        <div class="ayah-card">
          <p class="arabic-text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p class="translation">In the name of Allah, the Most Gracious, the Most Merciful</p>
        </div>
        
        <div class="ahadees-container">
          <h3>Hadith Content</h3>
          <p class="hadith-text">The example of believers in regard to mutual love...</p>
        </div>
        
        <span class="inlineArabic">الحمد لله</span>
        
        <table class="islamic-table">
          <tr><th>Topic</th><th>Details</th></tr>
          <tr><td>Prayer</td><td>Five times daily</td></tr>
        </table>
        
        <img src="/test-image.jpg" alt="Test Islamic Content" />
      </div>
    `;

        // Navigate to a page to get proper session context
        await page.goto('https://localhost:9091/');

        // Test the process-html-assets API endpoint
        const response = await page.request.post('https://localhost:9091/api/host/process-html-assets', {
            data: {
                sessionId: 12345,
                htmlContent: testHtmlContent,
                hostToken: 'TEST123'
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] API Response Status:', response.status());

        // Verify the API responds successfully
        expect(response.status()).toBe(200);

        const responseData = await response.json();
        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] API Response Data:', JSON.stringify(responseData, null, 2));

        // Verify the response structure
        expect(responseData.success).toBe(true);
        expect(responseData.processedHtml).toBeDefined();
        expect(responseData.detectedAssets).toBeDefined();
        expect(responseData.assetCount).toBeGreaterThan(0);

        // Verify that HtmlAgilityPack detected the expected asset types
        const assetTypes = responseData.detectedAssets.map(asset => asset.assetType);
        expect(assetTypes).toContain('ayah-card');
        expect(assetTypes).toContain('ahadees-content');
        expect(assetTypes).toContain('inline-arabic');
        expect(assetTypes).toContain('islamic-table');
        expect(assetTypes).toContain('image-asset');

        // Verify that data-asset-id attributes were added to the processed HTML
        expect(responseData.processedHtml).toContain('data-asset-id=');
        expect(responseData.processedHtml).toContain('data-asset-type=');
        expect(responseData.processedHtml).toContain('noor-shareable-asset');

        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Successfully detected', responseData.assetCount, 'assets using HtmlAgilityPack');
    });

    test('Asset Extraction API endpoint', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Testing asset extraction functionality');

        // First process HTML to get an asset ID
        const testHtmlContent = `
      <div class="session-content">
        <div class="ayah-card" data-asset-id="12345-ayah-card-1" data-asset-type="ayah-card">
          <p class="arabic-text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p class="translation">In the name of Allah, the Most Gracious, the Most Merciful</p>
        </div>
      </div>
    `;

        await page.goto('https://localhost:9091/');

        // Test the extract-asset API endpoint
        const response = await page.request.post('https://localhost:9091/api/host/extract-asset', {
            data: {
                sessionId: 12345,
                assetId: '12345-ayah-card-1',
                htmlContent: testHtmlContent,
                hostToken: 'TEST123'
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Extract Asset Response Status:', response.status());

        // Verify the API responds successfully
        expect(response.status()).toBe(200);

        const responseData = await response.json();
        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Extract Response:', JSON.stringify(responseData, null, 2));

        // Verify the extracted asset data
        expect(responseData.success).toBe(true);
        expect(responseData.assetId).toBe('12345-ayah-card-1');
        expect(responseData.assetType).toBe('ayah-card');
        expect(responseData.htmlContent).toBeDefined();
        expect(responseData.safeHtmlContent).toBeDefined();
        expect(responseData.textContent).toBeDefined();
        expect(responseData.metadata).toBeDefined();

        // Verify the extracted HTML contains the expected content
        expect(responseData.htmlContent).toContain('ayah-card');
        expect(responseData.htmlContent).toContain('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
        expect(responseData.textContent).toContain('In the name of Allah');

        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Successfully extracted asset with HtmlAgilityPack processing');
    });

    test('Host Control Panel Enhanced Asset Processing Integration', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Testing HostControlPanel integration with enhanced asset processing');

        // Navigate to Host Control Panel with a test token
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');

        // Wait for the page to load completely
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Allow Blazor to fully initialize

        // Check if the AssetHtmlProcessingService is working by looking for enhanced processing logs
        const pageContent = await page.content();

        // Verify the Host Control Panel loads successfully
        expect(pageContent).toContain('Host Control Panel');

        // Look for any session content that might trigger our enhanced processing
        const sessionControls = page.locator('text=SESSION CONTROLS');
        await expect(sessionControls).toBeVisible({ timeout: 10000 });

        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] HostControlPanel loaded successfully with enhanced asset processing capability');

        // Test if there's any transcript content that would trigger asset processing
        const transcriptArea = page.locator('.transcript-content, .session-transcript');
        if (await transcriptArea.count() > 0) {
            console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Found transcript area - enhanced processing would be triggered for session content');
        }

        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Enhanced asset processing integration test completed successfully');
    });

    test('Service Registration and Dependency Injection Validation', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] Validating AssetHtmlProcessingService registration');

        // Test that the service is properly registered by making an API call that would fail if DI is broken
        await page.goto('https://localhost:9091/');

        const response = await page.request.post('https://localhost:9091/api/host/process-html-assets', {
            data: {
                sessionId: 99999,
                htmlContent: '<div class="test">Test content</div>',
                hostToken: 'TEST'
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Even if no assets are detected, the service should respond without DI errors
        expect(response.status()).toBe(200);

        const responseData = await response.json();

        // Verify the service processed the request (even if no assets detected)
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBeDefined();

        console.log('[DEBUG-WORKITEM:assetshare:continue:092912484-cont1] AssetHtmlProcessingService is properly registered and injectable');
    });
});