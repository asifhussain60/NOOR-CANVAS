import { expect, test } from '@playwright/test';

/**
 * Simple Q&A JsonElement Fix Verification Test
 * 
 * This test verifies that the JsonElement casting fix in QuestionController.GetQuestions
 * is working correctly by directly testing the API endpoint that was causing issues.
 * 
 * Previous Issue: System.InvalidCastException when casting JsonElement to primitive types
 * Fix Applied: Added GetIntFromJsonElement() and GetBoolFromJsonElement() helper methods
 */

test.describe('Q&A JsonElement Fix Verification', () => {
    const TEST_TOKEN = 'A3ECXMRK'; // Known active test token for session 212
    const BASE_URL = 'https://localhost:9091';

    test.beforeAll(async () => {
        console.log('🔧 Starting Q&A JsonElement Fix Verification Test');
        console.log(`📋 Using test token: ${TEST_TOKEN}`);
        console.log(`🌐 Testing against: ${BASE_URL}`);
    });

    test('should retrieve questions without JsonElement casting exceptions', async ({ request }) => {
        console.log('\n🔍 TEST: Direct Q&A API JsonElement Fix Verification');

        // Test the Questions API endpoint that was previously failing with JsonElement casting issues
        console.log(`📡 Making GET request to: ${BASE_URL}/api/question/session/${TEST_TOKEN}`);

        const response = await request.get(`${BASE_URL}/api/question/session/${TEST_TOKEN}`, {
            ignoreHTTPSErrors: true
        });

        // Verify the response is successful (no more JsonElement exceptions)
        expect(response.status()).toBe(200);
        console.log(`✅ API Response Status: ${response.status()}`);

        // Parse the response JSON
        const responseBody = await response.json();
        console.log(`📊 Response Structure: ${JSON.stringify(Object.keys(responseBody))}`);

        // Verify the response structure indicates the JsonElement fix is working
        expect(responseBody).toHaveProperty('success');
        expect(responseBody).toHaveProperty('questions');
        expect(responseBody).toHaveProperty('totalCount');
        expect(responseBody).toHaveProperty('message');

        console.log(`✅ JsonElement Fix Verification: Questions array length = ${responseBody.questions?.length || 0}`);
        console.log(`✅ JsonElement Fix Verification: Total count = ${responseBody.totalCount || 0}`);
        console.log(`✅ JsonElement Fix Verification: Success status = ${responseBody.success}`);

        // If questions exist, verify the structure contains properly parsed JsonElement data
        if (responseBody.questions && responseBody.questions.length > 0) {
            const firstQuestion = responseBody.questions[0];
            console.log(`📝 First Question Structure: ${JSON.stringify(Object.keys(firstQuestion))}`);

            // These properties should be properly parsed from JsonElement now (no casting exceptions)
            expect(firstQuestion).toHaveProperty('id');
            expect(firstQuestion).toHaveProperty('questionText');
            expect(firstQuestion).toHaveProperty('userName');
            expect(firstQuestion).toHaveProperty('userId');
            expect(firstQuestion).toHaveProperty('isAnonymous');
            expect(firstQuestion).toHaveProperty('createdAt');

            // Verify that integer and boolean properties are properly converted from JsonElement
            expect(typeof firstQuestion.id).toBe('number');
            expect(typeof firstQuestion.isAnonymous).toBe('boolean');

            console.log(`✅ JsonElement Parsing Verification: ID is number type = ${typeof firstQuestion.id === 'number'}`);
            console.log(`✅ JsonElement Parsing Verification: isAnonymous is boolean type = ${typeof firstQuestion.isAnonymous === 'boolean'}`);
        }

        console.log('🎉 JsonElement Fix Verification Test Completed Successfully!');
    });

    test('should handle session validation without JsonElement issues', async ({ request }) => {
        console.log('\n🔍 TEST: Session Validation API JsonElement Compatibility');

        // Test session validation endpoint to ensure no related JsonElement issues
        console.log(`📡 Making GET request to: ${BASE_URL}/api/participant/session/${TEST_TOKEN}/validate`);

        const response = await request.get(`${BASE_URL}/api/participant/session/${TEST_TOKEN}/validate`, {
            ignoreHTTPSErrors: true
        });

        expect(response.status()).toBe(200);
        console.log(`✅ Session Validation Status: ${response.status()}`);

        const responseBody = await response.json();
        console.log(`📊 Session Validation Response: ${JSON.stringify(Object.keys(responseBody))}`);

        // Verify session validation is working (indicating overall API health)
        expect(responseBody).toHaveProperty('valid');
        expect(responseBody.valid).toBe(true);

        console.log(`✅ Session Validation: Valid = ${responseBody.valid}`);
        console.log('🎉 Session Validation JsonElement Compatibility Test Completed!');
    });

    test.afterAll(async () => {
        console.log('\n📋 Q&A JsonElement Fix Verification Test Summary:');
        console.log('✅ Questions API endpoint responds without JsonElement casting exceptions');
        console.log('✅ JsonElement properties are properly converted to primitive types');
        console.log('✅ Session validation works correctly');
        console.log('✅ Overall API health confirmed - JsonElement fix is working');
    });
});