import { expect, test } from '@playwright/test';

test.describe('Waiting Room Token Validation', () => {
    test('should access waiting room with correct UserToken format', async ({ page }) => {
        console.log('=== Testing Waiting Room Token Access Patterns ===');

        // Test recent UserToken from database investigation: 9HGUW8Z9 (Session 220)
        const userToken = '9HGUW8Z9';

        // Test 1: Query parameter format (?token=)
        console.log(`Testing query format: /session/waiting?token=${userToken}`);
        await page.goto(`https://localhost:9091/session/waiting?token=${userToken}`);
        await page.waitForLoadState('networkidle');

        const queryResponse = await page.textContent('body');
        console.log('Query format response:', queryResponse?.substring(0, 300) + '...');

        // Check if we get past the "Session Error - No session token provided" message
        const hasTokenError = queryResponse?.includes('Session Error - No session token provided');
        const hasWaitingRoom = queryResponse?.includes('waiting') || queryResponse?.includes('Waiting') ||
            queryResponse?.includes('session') || queryResponse?.includes('participant');

        console.log('Has token error:', hasTokenError);
        console.log('Has waiting room content:', hasWaitingRoom);

        // Test 2: Path parameter format (/token)
        console.log(`Testing path format: /session/waiting/${userToken}`);
        await page.goto(`https://localhost:9091/session/waiting/${userToken}`);
        await page.waitForLoadState('networkidle');

        const pathResponse = await page.textContent('body');
        console.log('Path format response:', pathResponse?.substring(0, 300) + '...');

        const pathHasError = pathResponse?.includes('Session Error - No session token provided');
        console.log('Path format has token error:', pathHasError);

        // Test 3: Alternative recent token (RMBPANIE from Session 220)
        const alternativeToken = 'RMBPANIE';
        console.log(`Testing alternative token: ${alternativeToken}`);
        await page.goto(`https://localhost:9091/session/waiting?token=${alternativeToken}`);
        await page.waitForLoadState('networkidle');

        const altResponse = await page.textContent('body');
        console.log('Alternative token response:', altResponse?.substring(0, 300) + '...');

        // Test 4: Try with session parameter instead of token
        console.log(`Testing session parameter: /session/waiting?session=${userToken}`);
        await page.goto(`https://localhost:9091/session/waiting?session=${userToken}`);
        await page.waitForLoadState('networkidle');

        const sessionParamResponse = await page.textContent('body');
        console.log('Session parameter response:', sessionParamResponse?.substring(0, 300) + '...');

        // Final assessment
        console.log('\n=== VALIDATION RESULTS ===');
        console.log('Query format (?token=) works:', !hasTokenError && hasWaitingRoom);
        console.log('Path format (/token) works:', !pathHasError);
        console.log('Session parameter works:', !sessionParamResponse?.includes('Session Error - No session token provided'));

        // The correct format should NOT show the token error message
        expect.soft(!hasTokenError || !pathHasError).toBeTruthy();
    });

    test('should verify session creation actually generates UserToken', async ({ page }) => {
        console.log('=== Verifying Session Creation Token Generation ===');

        const hostToken = 'ADMIN123';
        await page.goto(`https://localhost:9091/host/session-opener/${hostToken}`);
        await page.waitForLoadState('networkidle');

        // Track all network responses during session creation
        const responses: string[] = [];
        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('/session') || url.includes('/api') || url.includes('/create')) {
                const status = response.status();
                console.log(`Network: ${status} ${url}`);

                if (status === 200 && !url.includes('.js') && !url.includes('.css')) {
                    try {
                        const body = await response.text();
                        if (body.length > 0 && body.length < 1000) {
                            console.log(`Response body (${url}):`, body);
                            responses.push(body);
                        }
                    } catch (e) {
                        console.log(`Could not read response from ${url}`);
                    }
                }
            }
        });

        // Fill session creation form
        await page.selectOption('select[name="Album"]', { label: 'Quran Comprehension' });
        await page.waitForTimeout(500);

        await page.selectOption('select[name="Category"]', { label: 'Surah Ikhlas' });
        await page.waitForTimeout(500);

        await page.selectOption('select[name="Session"]', { label: 'Masculine vs Feminine Gender' });
        await page.waitForTimeout(500);

        await page.fill('input[name="Title"]', 'Token Generation Test Session');
        await page.fill('textarea[name="Description"]', 'Testing if UserToken is returned after session creation');
        await page.fill('input[name="MaxParticipants"]', '5');

        // Submit and capture response
        console.log('Submitting session creation...');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000); // Allow time for all network requests

        console.log('All captured responses:', responses);

        // Check final page state
        const finalUrl = page.url();
        const finalContent = await page.textContent('body');

        console.log('Final URL:', finalUrl);
        console.log('Final content contains UserToken pattern:', /[A-Z0-9]{8}/.test(finalContent || ''));

        // Look for any tokens in the page content or hidden elements
        const allText = await page.evaluate(() => {
            return {
                visibleText: document.body.innerText,
                htmlContent: document.body.innerHTML
            };
        });

        const tokenMatches = allText.htmlContent.match(/[A-Z0-9]{8}/g) || [];
        console.log('Found potential tokens in HTML:', tokenMatches);

        // Check for hidden inputs or data attributes that might contain the UserToken
        const hiddenInputs = await page.$$('input[type="hidden"]');
        for (const input of hiddenInputs) {
            const name = await input.getAttribute('name');
            const value = await input.getAttribute('value');
            console.log(`Hidden input: ${name} = ${value}`);
        }
    });
});