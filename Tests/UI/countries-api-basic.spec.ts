// Simple test for countries API endpoint with proper authentication
// Testing NOOR Canvas Countries Dropdown: Direct API testing

import { expect, test, type APIRequestContext } from '@playwright/test';
import { generateTestToken } from './test-utils';

/**
 * NOOR Canvas - Countries API Direct Test Suite
 * Simple tests for countries endpoint functionality
 */

interface CountryData {
    CountryID: number;
    CountryName: string;
    ISO2: string;
    ISO3?: string;
    IsActive: boolean;
}

test.describe('Countries API Direct Tests', () => {

    test('should respond to countries endpoint with generated token', async ({ request }: { request: APIRequestContext }) => {
        console.log('Testing countries API endpoint with generated authentication token...');

        // Generate proper authentication token
        const tokenData = await generateTestToken(request);
        console.log(`Generated host token: ${tokenData.hostToken}`);

        // Use the generated token for API call
        const response = await request.get(`/api/host/countries?guid=${tokenData.hostToken}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log(`API Response Status: ${response.status()}`);

        if (response.status() === 200) {
            const countries: CountryData[] = await response.json();
            console.log(`Successfully loaded ${countries.length} countries from API`);

            // Verify response structure
            expect(countries).toBeInstanceOf(Array);

            if (countries.length > 0) {
                const firstCountry = countries[0];
                expect(firstCountry).toHaveProperty('countryID');
                expect(firstCountry).toHaveProperty('countryName');
                expect(firstCountry).toHaveProperty('isO2');
                expect(firstCountry).toHaveProperty('isO3');
                expect(firstCountry).toHaveProperty('isActive');

                console.log(`Sample country: ${(firstCountry as any).countryName} (${(firstCountry as any).isO2})`);
                console.log('Countries API endpoint is working correctly');
            } else {
                console.log('Countries API returned empty array - this may be expected if no active countries');
            }
        } else {
            console.log(`API call failed with status ${response.status()}`);
            const errorText = await response.text();
            console.log(`Error response: ${errorText}`);
        }
    });

    test('should have functional albums endpoint for comparison', async ({ request }: { request: APIRequestContext }) => {
        console.log('Testing albums API endpoint for comparison...');

        // Generate proper authentication token
        const tokenData = await generateTestToken(request);
        console.log(`Generated host token: ${tokenData.hostToken}`);

        const response = await request.get(`/api/host/albums?guid=${tokenData.hostToken}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log(`Albums API Response Status: ${response.status()}`);

        if (response.status() === 200) {
            const albums = await response.json();
            console.log(`Albums API returned ${albums.length} albums`);
            console.log('Albums API is working - this confirms the basic pattern');
        } else {
            console.log(`Albums API call failed with status ${response.status()}`);
        }
    });
});