// Multi-user SignalR synchronization test
// Tests the specific scenario: 3 users (Asif, Ishrat, Saprano) with same token
// Verifies all tabs show all 3 names after sequential participant registration

const { chromium } = require('playwright');

async function testSignalRSync() {
    const browser = await chromium.launch({ headless: false });

    console.log('🚀 Starting SignalR synchronization test...');

    try {
        // Create 3 browser contexts (simulating 3 different users/tabs)
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();
        const context3 = await browser.newContext();

        // Open 3 pages with the same token
        const page1 = await context1.newPage();
        const page2 = await context2.newPage();
        const page3 = await context3.newPage();

        console.log('📱 Opening 3 browser instances with token TEST213U...');

        // Navigate all 3 pages to the same token
        await Promise.all([
            page1.goto('https://localhost:9091/user/landing/TEST213U'),
            page2.goto('https://localhost:9091/user/landing/TEST213U'),
            page3.goto('https://localhost:9091/user/landing/TEST213U')
        ]);

        console.log('⏳ Waiting for pages to load...');
        await page1.waitForTimeout(3000);

        // Register User 1: Asif
        console.log('👤 Registering Asif in browser 1...');
        await page1.fill('[name="displayName"]', 'Asif');
        await page1.selectOption('[name="country"]', { label: 'United States' });
        await page1.click('button[type="submit"]');

        // Wait for navigation to waiting room
        await page1.waitForURL('**/session/waiting/**');
        console.log('✅ Asif registered and in waiting room');

        // Wait a moment for SignalR to sync
        await page1.waitForTimeout(2000);

        // Register User 2: Ishrat
        console.log('👤 Registering Ishrat in browser 2...');
        await page2.fill('[name="displayName"]', 'Ishrat');
        await page2.selectOption('[name="country"]', { label: 'Canada' });
        await page2.click('button[type="submit"]');

        await page2.waitForURL('**/session/waiting/**');
        console.log('✅ Ishrat registered and in waiting room');

        // Wait for SignalR sync
        await page2.waitForTimeout(2000);

        // Register User 3: Saprano
        console.log('👤 Registering Saprano in browser 3...');
        await page3.fill('[name="displayName"]', 'Saprano');
        await page3.selectOption('[name="country"]', { label: 'United Kingdom' });
        await page3.click('button[type="submit"]');

        await page3.waitForURL('**/session/waiting/**');
        console.log('✅ Saprano registered and in waiting room');

        // Wait for final SignalR sync
        await page3.waitForTimeout(3000);

        // Now check participant lists in all 3 browsers
        console.log('🔍 Checking participant lists across all browsers...');

        const getParticipantNames = async (page) => {
            const participants = await page.$$eval('.participant-item', elements =>
                elements.map(el => el.textContent?.trim() || '')
            );
            return participants.filter(name => name.length > 0);
        };

        const participants1 = await getParticipantNames(page1);
        const participants2 = await getParticipantNames(page2);
        const participants3 = await getParticipantNames(page3);

        console.log('📊 Results:');
        console.log('Browser 1 (Asif):', participants1);
        console.log('Browser 2 (Ishrat):', participants2);
        console.log('Browser 3 (Saprano):', participants3);

        // Verify all browsers show all 3 participants
        const expectedParticipants = ['Asif', 'Ishrat', 'Saprano'];
        const allBrowsersMatch = [participants1, participants2, participants3].every(list =>
            expectedParticipants.every(name =>
                list.some(participant => participant.includes(name))
            )
        );

        if (allBrowsersMatch) {
            console.log('🎉 SUCCESS! All browsers show all 3 participants - SignalR sync is working!');
            return { success: true, message: 'SignalR synchronization fixed successfully' };
        } else {
            console.log('❌ FAILURE! Participant synchronization is not working correctly');
            return {
                success: false,
                message: 'SignalR sync issue still exists',
                details: { participants1, participants2, participants3 }
            };
        }

    } catch (error) {
        console.error('💥 Test failed with error:', error);
        return { success: false, message: error.message };
    } finally {
        await browser.close();
    }
}

// Run the test
testSignalRSync().then(result => {
    console.log('\n📋 Final Result:', result);
    process.exit(result.success ? 0 : 1);
});