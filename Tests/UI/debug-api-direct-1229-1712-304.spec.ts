/**
 * WORKITEM API DEBUG - RUN_ID: 1229-1712-304
 * Direct test of the CreateSession API to see validation errors
 */

import { test } from '@playwright/test';

test('direct API test - sessionopener createSession - RUN_ID:1229-1712-304', async ({ request }) => {
    console.log('[RUN_ID:1229-1712-304] Testing CreateSession API directly');

    // The same data structure that HostSessionService.CreateSessionAndGenerateTokensAsync sends
    const sessionData = {
        HostGuid: "PQ9N5YWW",
        SessionId: 212,  // From logs - existing session
        AlbumId: 14,     // From logs - existing album
        CategoryId: 52,  // From logs - existing category  
        SessionDate: "2025-09-28",
        SessionTime: "6:00 AM",
        SessionDuration: "60"
    };

    console.log('[RUN_ID:1229-1712-304] Sending API request with data:', JSON.stringify(sessionData, null, 2));

    const response = await request.post('https://localhost:9091/api/Host/session/create', {
        headers: {
            'Content-Type': 'application/json',
        },
        data: sessionData,
        ignoreHTTPSErrors: true
    });

    console.log('[RUN_ID:1229-1712-304] API Response Status:', response.status());
    console.log('[RUN_ID:1229-1712-304] API Response Status Text:', response.statusText());

    const responseText = await response.text();
    console.log('[RUN_ID:1229-1712-304] API Response Body:', responseText);

    if (!response.ok()) {
        console.log('[RUN_ID:1229-1712-304] Request failed - this matches the issue we are debugging');

        try {
            const errorData = JSON.parse(responseText);
            console.log('[RUN_ID:1229-1712-304] Parsed error response:', JSON.stringify(errorData, null, 2));
        } catch (e) {
            console.log('[RUN_ID:1229-1712-304] Could not parse error response as JSON');
        }
    } else {
        console.log('[RUN_ID:1229-1712-304] Request succeeded - issue may be fixed!');
    }
});