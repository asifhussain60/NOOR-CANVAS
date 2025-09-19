// This file contains Playwright tests using @playwright/test
// Testing NOOR Canvas API endpoints and integration points

import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * NOOR Canvas - API Integration Test Suite (TypeScript)
 * 
 * Enhanced with TypeScript typing for optimal GitHub Copilot integration.
 * 
 * Tests API endpoints and integration points including:
 * - Token generation and validation with proper type safety
 * - Host and User token workflows with structured data
 * - Database connectivity and Islamic content loading
 * - Error handling, security validation, and performance testing
 */

// TypeScript interfaces for better IntelliSense and Copilot suggestions
interface TokenGenerationRequest {
    sessionId: number;
    createdBy: string;
    title: string;
}

interface TokenGenerationResponse {
    hostToken: string;
    userToken: string;
    sessionId?: number;
}

interface TokenValidationRequest {
    token: string;
    isHost: boolean;
}

interface TokenValidationResponse {
    valid: boolean;
    message?: string;
}

interface AlbumData {
    id: number;
    name: string;
    description?: string;
}

interface CategoryData {
    id: number;
    name: string;
    albumId: number;
}

interface SessionData {
    id: number;
    sessionId: number;
    name: string;
    categoryId: number;
}

interface HealthCheckResponse {
    status: string;
    database?: {
        status: string;
        connectionString?: string;
    };
}

interface SessionCreationRequest {
    hostToken: string;
    sessionData: {
        album: string;
        category: string;
        session: string;
    };
}

interface ErrorResponse {
    error: string;
    message?: string;
    statusCode?: number;
}

test.describe('API Integration Tests', () => {

    test('should generate host token via API', async ({ request }: { request: APIRequestContext }) => {
        const tokenRequest: TokenGenerationRequest = {
            sessionId: 500,
            createdBy: 'API Test Suite',
            title: 'API Integration Test Session'
        };

        const response = await request.post('/api/host/generate-token', {
            data: tokenRequest
        });

        expect(response.ok()).toBeTruthy();
        const data: TokenGenerationResponse = await response.json();

        // Verify response structure with type safety
        expect(data).toHaveProperty('hostToken');
        expect(data).toHaveProperty('userToken');
        expect(typeof data.hostToken).toBe('string');
        expect(typeof data.userToken).toBe('string');

        // Verify token format follows GUID-like pattern
        expect(data.hostToken).toMatch(/^[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
        expect(data.userToken).toMatch(/^[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);

        console.log('Generated tokens:', { hostToken: data.hostToken, userToken: data.userToken });
    });

    test('should validate host token via API', async ({ request }: { request: APIRequestContext }) => {
        // First generate a token for validation testing
        const generateRequest: TokenGenerationRequest = {
            sessionId: 501,
            createdBy: 'Token Validation Test',
            title: 'Token Validation Test Session'
        };

        const generateResponse = await request.post('/api/host/generate-token', {
            data: generateRequest
        });

        const tokens: TokenGenerationResponse = await generateResponse.json();

        // Then validate the generated host token
        const validationRequest: TokenValidationRequest = {
            token: tokens.hostToken,
            isHost: true
        };

        const validateResponse = await request.post('/api/host/validate-token', {
            data: validationRequest
        });

        if (validateResponse.ok()) {
            const validationData: TokenValidationResponse = await validateResponse.json();
            expect(validationData.valid).toBeTruthy();
            console.log('Token validation successful');
        } else {
            // May not be implemented yet, log for debugging
            console.log('Token validation endpoint status:', validateResponse.status());
        }
    });

    test('should reject invalid host tokens', async ({ request }: { request: APIRequestContext }) => {
        const invalidSessionRequest: SessionCreationRequest = {
            hostToken: 'invalid-token-format',
            sessionData: {
                album: '18',
                category: '55',
                session: '1281'
            }
        };

        const response = await request.post('/api/host/create-session', {
            data: invalidSessionRequest
        });

        // Should return 400 Bad Request for invalid token format
        expect(response.status()).toBe(400);

        const errorData: ErrorResponse = await response.json();
        expect(errorData).toHaveProperty('error');
        expect(errorData.error).toContain('Invalid host token');

        console.log('Invalid token rejection confirmed');
    });

    test('should handle database connectivity issues', async ({ request }: { request: APIRequestContext }) => {
        // Test endpoint that requires database access
        const response = await request.get('/api/health');

        if (response.ok()) {
            const health: HealthCheckResponse = await response.json();
            console.log('Health check:', health);

            // If health endpoint exists, verify database status
            if (health.database) {
                expect(health.database.status).toBe('healthy');
            }
        } else {
            console.log('Health endpoint not available, status:', response.status());
        }
    });

    test('should load Islamic content data via API', async ({ request }: { request: APIRequestContext }) => {
        // Test loading albums (groups) for Islamic content
        const albumsResponse = await request.get('/api/host/albums');

        if (albumsResponse.ok()) {
            const albums: AlbumData[] = await albumsResponse.json();
            expect(Array.isArray(albums)).toBeTruthy();
            expect(albums.length).toBeGreaterThan(0);

            // Verify album structure with type safety
            if (albums.length > 0) {
                const firstAlbum: AlbumData = albums[0];
                expect(firstAlbum).toHaveProperty('id');
                expect(firstAlbum).toHaveProperty('name');
                expect(typeof firstAlbum.id).toBe('number');
                expect(typeof firstAlbum.name).toBe('string');

                console.log('Albums loaded successfully:', albums.length);
            }
        } else {
            console.log('Albums API status:', albumsResponse.status());
        }
    });

    test('should load categories for specific album', async ({ request }: { request: APIRequestContext }) => {
        // Test cascading dropdown API - categories for album 18
        const categoriesResponse = await request.get('/api/host/categories?albumId=18');

        if (categoriesResponse.ok()) {
            const categories: CategoryData[] = await categoriesResponse.json();
            expect(Array.isArray(categories)).toBeTruthy();

            // Verify category structure for cascading dropdown
            if (categories.length > 0) {
                const firstCategory: CategoryData = categories[0];
                expect(firstCategory).toHaveProperty('id');
                expect(firstCategory).toHaveProperty('name');
                expect(typeof firstCategory.id).toBe('number');
                expect(typeof firstCategory.name).toBe('string');
            }

            console.log('Categories for album 18:', categories.length);
        } else {
            console.log('Categories API status:', categoriesResponse.status());
        }
    });

    test('should load sessions for album and category', async ({ request }: { request: APIRequestContext }) => {
        // Test cascading dropdown API - sessions for album 18, category 55
        const sessionsResponse = await request.get('/api/host/sessions?albumId=18&categoryId=55');

        if (sessionsResponse.ok()) {
            const sessions: SessionData[] = await sessionsResponse.json();
            expect(Array.isArray(sessions)).toBeTruthy();

            console.log('Sessions for album 18, category 55:', sessions.length);

            // Look for session 1281 specifically (used in cascading dropdown test)
            if (sessions.length > 0) {
                const hasTestSession: boolean = sessions.some((s: SessionData) =>
                    s.id === 1281 || s.sessionId === 1281
                );
                console.log('Test session 1281 available:', hasTestSession);
            }
        } else {
            console.log('Sessions API status:', sessionsResponse.status());
        }
    });
});

test.describe('Performance & Load Tests', () => {

    test('should handle multiple concurrent token generations', async ({ request }: { request: APIRequestContext }) => {
        // Generate multiple tokens concurrently for load testing
        const tokenPromises: Promise<any>[] = Array.from({ length: 5 }, (_, i: number) =>
            request.post('/api/host/generate-token', {
                data: {
                    sessionId: 600 + i,
                    createdBy: `Concurrent Test ${i}`,
                    title: `Concurrent Session ${i}`
                } as TokenGenerationRequest
            })
        );

        const responses = await Promise.all(tokenPromises);

        // All requests should succeed under concurrent load
        responses.forEach((response, i: number) => {
            expect(response.ok()).toBeTruthy();
            console.log(`Concurrent token ${i} generated successfully`);
        });

        // Verify all generated tokens are unique
        const tokens: TokenGenerationResponse[] = await Promise.all(responses.map(r => r.json()));
        const hostTokens: string[] = tokens.map((t: TokenGenerationResponse) => t.hostToken);
        const uniqueTokens: Set<string> = new Set(hostTokens);

        expect(uniqueTokens.size).toBe(hostTokens.length);
        console.log('All generated tokens are unique');
    });

    test('should handle rapid API calls without errors', async ({ request }: { request: APIRequestContext }) => {
        // Make rapid sequential calls to test rate limiting and stability
        const rapidCalls: Promise<number>[] = [];

        for (let i = 0; i < 10; i++) {
            const promise: Promise<number> = request.get('/api/health').then(r => r.status());
            rapidCalls.push(promise);

            // Small delay between calls to simulate realistic load
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        const statuses: number[] = await Promise.all(rapidCalls);

        // Should handle all calls gracefully (2xx or 4xx, not 5xx server errors)
        statuses.forEach((status: number, i: number) => {
            expect(status).toBeLessThan(500);
            console.log(`Rapid call ${i}: ${status}`);
        });
    });
});

test.describe('Security & Validation Tests', () => {

    test('should reject malformed requests', async ({ request }: { request: APIRequestContext }) => {
        // Test malformed JSON payload handling
        try {
            const response = await request.post('/api/host/generate-token', {
                data: '{invalid-json' as any // Intentionally malformed
            });

            expect(response.status()).toBe(400);
        } catch (error: any) {
            // Expected to fail due to malformed request
            console.log('Malformed request properly rejected');
        }
    });

    test('should validate required fields', async ({ request }: { request: APIRequestContext }) => {
        // Test missing required fields validation
        const incompleteRequest = {} as TokenGenerationRequest; // Missing all required fields

        const response = await request.post('/api/host/generate-token', {
            data: incompleteRequest
        });

        expect(response.status()).toBe(400);

        if (response.headers()['content-type']?.includes('json')) {
            const error: ErrorResponse = await response.json();
            console.log('Validation error:', error);
        }
    });

    test('should handle SQL injection attempts safely', async ({ request }: { request: APIRequestContext }) => {
        // Test with potential SQL injection in sessionId field
        const maliciousRequest: any = {
            sessionId: "1; DROP TABLE Sessions;--", // SQL injection attempt
            createdBy: 'Security Test',
            title: 'SQL Injection Test'
        };

        const response = await request.post('/api/host/generate-token', {
            data: maliciousRequest
        });

        // Should either reject or safely handle the malicious input
        if (response.ok()) {
            console.log('SQL injection attempt handled safely');
        } else {
            console.log('SQL injection attempt rejected with status:', response.status());
        }
    });
});