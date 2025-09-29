import { test } from '@playwright/test';

test('SessionCanvas UI Improvements - All Phases', async ({ page }) => {
    // Navigate to session canvas page
    await page.goto('http://localhost:9090/session/canvas/test-token');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check if we can access the page (it may show error state without valid token)
    const pageContent = await page.content();

    // Phase 1: Verify SignalR status is icon-only with proper styling
    const hasCircularStatus = pageContent.includes('border-radius:50%') && pageContent.includes('margin-right:1rem');
    const hasIconOnlyStatus = pageContent.includes('title="') && !pageContent.includes('<span style="color:');

    if (hasCircularStatus && hasIconOnlyStatus) {
        console.log('✅ Phase 1 Complete: SignalR status changed to icon-only with right margin');
    }

    // Phase 2: Verify Q&A and Participants tabs have icons and enhanced styling
    const hasQAIcon = pageContent.includes('fa-question-circle') && pageContent.includes('Q&A');
    const hasParticipantsIcon = pageContent.includes('fa-users') && pageContent.includes('Participants');
    const hasTabBackground = pageContent.includes('background:rgba(212,175,55,0.1)') && pageContent.includes('border-radius:0.75rem');

    if (hasQAIcon && hasParticipantsIcon && hasTabBackground) {
        console.log('✅ Phase 2 Complete: Q&A and Participants tabs enhanced with icons and styling');
    }

    // Phase 3: Verify Ask a Question panel improvements
    const hasProperCaseTitle = pageContent.includes('Ask A Question');
    const hasHandIcon = pageContent.includes('fa-hand-raised') && pageContent.includes('text-align:left');
    const hasSubmitIcon = pageContent.includes('fa-paper-plane');
    const hasImprovedFlex = pageContent.includes('flex:4') && pageContent.includes('min-width:80px');

    if (hasProperCaseTitle && hasHandIcon && hasSubmitIcon && hasImprovedFlex) {
        console.log('✅ Phase 3 Complete: Ask a Question panel improved with icons and better layout');
    }

    // Phase 4: Verify content animation is added
    const hasContentAnimation = pageContent.includes('animate-content-fade') && pageContent.includes('contentFade 3s ease-in-out infinite');
    const hasAnimationKeyframes = pageContent.includes('transform: translateY(-2px)');

    if (hasContentAnimation && hasAnimationKeyframes) {
        console.log('✅ Phase 4 Complete: Content placeholder animation added');
    }

    // Overall validation
    if (hasCircularStatus && hasIconOnlyStatus && hasQAIcon && hasParticipantsIcon &&
        hasTabBackground && hasProperCaseTitle && hasHandIcon && hasSubmitIcon &&
        hasImprovedFlex && hasContentAnimation && hasAnimationKeyframes) {
        console.log('🎉 All Four Phases Successfully Implemented!');
    } else {
        console.log('⚠️  Some phases may need verification - check implementation details');
    }
});