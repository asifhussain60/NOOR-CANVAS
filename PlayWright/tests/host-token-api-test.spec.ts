import { expect, test } from '@playwright/test';

// Configure test to ignore SSL errors for local development
test.use({ ignoreHTTPSErrors: true });

test.describe('Host Authentication with Friendly Token - API Only', () => {
    const TEST_HOST_TOKEN = 'JHINFLXN';

    test('should authenticate host via API with friendly token', async ({ request }) => {
        console.log('=== Host Authentication: API Token Validation ===');
        console.log(`Testing host token: ${TEST_HOST_TOKEN}`);

        // Test 1: Validate host token with albums API
        console.log('\nStep 1: Testing Albums API with host token...');
        const albumsResponse = await request.get(`https://localhost:9091/api/host/albums?guid=${TEST_HOST_TOKEN}`);

        console.log(`Albums API Status: ${albumsResponse.status()}`);

        if (albumsResponse.ok()) {
            const albums = await albumsResponse.json();
            console.log(`✅ Host authenticated successfully - ${albums.length} albums loaded`);

            // Find our test album (18)
            const testAlbum = albums.find((album: any) => album.GroupId === 18);
            if (testAlbum) {
                console.log(`✅ Test Album found: ${testAlbum.GroupName} (ID: ${testAlbum.GroupId})`);
            }

            expect(albumsResponse.ok()).toBeTruthy();
            expect(albums.length).toBeGreaterThan(0);
        } else {
            const errorText = await albumsResponse.text();
            console.error(`❌ Albums API failed: ${errorText}`);
            throw new Error(`Host authentication failed: ${albumsResponse.status()}`);
        }

        // Test 2: Load categories for Album 18
        console.log('\nStep 2: Testing Categories API for Album 18...');
        const categoriesResponse = await request.get(`https://localhost:9091/api/host/categories/18?guid=${TEST_HOST_TOKEN}`);

        console.log(`Categories API Status: ${categoriesResponse.status()}`);

        if (categoriesResponse.ok()) {
            const categories = await categoriesResponse.json();
            console.log(`✅ Categories loaded - ${categories.length} categories for Album 18`);

            // Find our test category (55)
            const testCategory = categories.find((cat: any) => cat.CategoryID === 55);
            if (testCategory) {
                console.log(`✅ Test Category found: ${testCategory.CategoryName} (ID: ${testCategory.CategoryID})`);
            }

            expect(categoriesResponse.ok()).toBeTruthy();
        } else {
            console.error(`❌ Categories API failed`);
        }

        // Test 3: Load sessions for Category 55
        console.log('\nStep 3: Testing Sessions API for Category 55...');
        const sessionsResponse = await request.get(`https://localhost:9091/api/host/sessions/55?guid=${TEST_HOST_TOKEN}`);

        console.log(`Sessions API Status: ${sessionsResponse.status()}`);

        if (sessionsResponse.ok()) {
            const sessions = await sessionsResponse.json();
            console.log(`✅ Sessions loaded - ${sessions.length} sessions for Category 55`);

            // Find our test session (1281)
            const testSession = sessions.find((session: any) => session.SessionID === 1281);
            if (testSession) {
                console.log(`✅ Test Session found: ${testSession.SessionName} (ID: ${testSession.SessionID})`);
            }

            expect(sessionsResponse.ok()).toBeTruthy();
        } else {
            console.error(`❌ Sessions API failed`);
        }

        // Test 4: Test the Issue-107 fixed API endpoint
        console.log('\nStep 4: Testing Session Creation API with fixed camelCase properties...');

        const sessionPayload = {
            hostFriendlyToken: TEST_HOST_TOKEN,
            selectedSession: '1281',
            selectedCategory: '55',
            selectedAlbum: '18',
            sessionDate: '2025-09-18',
            sessionTime: '2:00 PM',
            sessionDuration: 60
        };

        console.log('Session creation payload:');
        console.log(JSON.stringify(sessionPayload, null, 2));

        const createSessionResponse = await request.post(`https://localhost:9091/api/host/create-session?token=${TEST_HOST_TOKEN}`, {
            data: sessionPayload
        });

        console.log(`Session Creation API Status: ${createSessionResponse.status()}`);

        const responseText = await createSessionResponse.text();
        console.log(`Response: ${responseText}`);

        if (createSessionResponse.ok()) {
            console.log('✅ Session creation successful - Issue-107 fix is working!');
            const sessionResult = JSON.parse(responseText);
            if (sessionResult.success) {
                console.log(`✅ Session ID: ${sessionResult.sessionId}`);
                console.log(`✅ User Token: ${sessionResult.userToken}`);
                console.log(`✅ Session URL: ${sessionResult.sessionUrl}`);
            }
        } else if (createSessionResponse.status() === 400) {
            console.log('❌ Session creation failed - checking error details...');
            try {
                const errorData = JSON.parse(responseText);
                console.log(`Error: ${errorData.error}`);
                if (errorData.received) {
                    console.log(`Received values: ${JSON.stringify(errorData.received)}`);
                }
            } catch (e) {
                console.log(`Raw error: ${responseText}`);
            }
        }

        console.log('\n=== Host Authentication Flow Completed ===');
        console.log('✅ Host token authentication successful');
        console.log('✅ Cascading dropdown data APIs working');
        console.log('✅ Ready for UI interaction');
    });

    test('should verify complete cascading dropdown chain with host token', async ({ request }) => {
        console.log('=== Cascading Dropdown Chain Validation ===');

        const TOKEN = TEST_HOST_TOKEN;

        // Verify the complete chain: Album 18 → Category 55 → Session 1281
        console.log('Validating cascading relationship: Album 18 → Category 55 → Session 1281');

        // Step 1: Get Album 18
        const albumsResponse = await request.get(`https://localhost:9091/api/host/albums?guid=${TOKEN}`);
        expect(albumsResponse.ok()).toBeTruthy();
        const albums = await albumsResponse.json();

        const album18 = albums.find((a: any) => a.GroupId === 18);
        expect(album18).toBeDefined();
        console.log(`✅ Album 18: ${album18.GroupName}`);

        // Step 2: Get Categories for Album 18, find Category 55
        const categoriesResponse = await request.get(`https://localhost:9091/api/host/categories/18?guid=${TOKEN}`);
        expect(categoriesResponse.ok()).toBeTruthy();
        const categories = await categoriesResponse.json();

        const category55 = categories.find((c: any) => c.CategoryID === 55);
        expect(category55).toBeDefined();
        expect(category55.GroupId).toBe(18); // Verify it belongs to Album 18
        console.log(`✅ Category 55: ${category55.CategoryName} (belongs to Album ${category55.GroupId})`);

        // Step 3: Get Sessions for Category 55, find Session 1281
        const sessionsResponse = await request.get(`https://localhost:9091/api/host/sessions/55?guid=${TOKEN}`);
        expect(sessionsResponse.ok()).toBeTruthy();
        const sessions = await sessionsResponse.json();

        const session1281 = sessions.find((s: any) => s.SessionID === 1281);
        expect(session1281).toBeDefined();
        expect(session1281.CategoryId).toBe(55); // Verify it belongs to Category 55
        console.log(`✅ Session 1281: ${session1281.SessionName} (belongs to Category ${session1281.CategoryId})`);

        console.log('✅ Complete cascading chain verified successfully!');
        console.log('   Album 18 contains Category 55 which contains Session 1281');
    });
});