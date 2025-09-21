// This file contains Playwright test utilities for NOOR Canvas
// Shared functions for token generation and common test operations

import { type APIRequestContext } from '@playwright/test';

// Import health check utilities and database token manager
export { DatabaseTokenManager, type SessionTokenData } from './utils/database-token-manager';
export { afterEachHealthCheck, AppHealthChecker, beforeEachHealthCheck, withHealthChecks } from './utils/test-health-hooks';

/**
 * TypeScript interfaces for better IntelliSense and Copilot suggestions
 */
export interface TokenData {
    hostToken: string;
    userToken: string;
    sessionId?: number;
    createdBy?: string;
    title?: string;
}

export interface TokenGenerationRequest {
    sessionId: number;
    createdBy: string;
    title: string;
}

export interface UserTokenData {
    userToken: string;
    hostToken: string;
    sessionId: number;
}

export interface UserSessionRequest {
    sessionId: number;
    createdBy: string;
    title: string;
}

/**
 * Helper function for generating test tokens with proper typing
 * Enhanced for TypeScript IntelliSense and Copilot autocompletion
 * Uses 8-character token format matching SecureTokenService logic
 */
export async function generateTestToken(request: APIRequestContext): Promise<TokenData> {
    const sessionId = Math.floor(Math.random() * 1000) + 200;

    // Generate 8-character tokens using same charset as SecureTokenService
    const hostToken = generateRandomToken();
    const userToken = generateRandomToken();

    // Create session record first
    const sessionResponse = await request.post('https://localhost:9091/api/session/create', {
        ignoreHTTPSErrors: true,
        data: {
            title: `Test Session ${Date.now()}`,
            createdBy: 'Playwright Test Suite',
            sessionId: sessionId
        }
    });

    if (!sessionResponse.ok()) {
        // Fallback: return tokens without session creation
        console.warn('Failed to create session via API, using tokens directly');
    }

    // Create SecureToken record directly via database API
    try {
        await request.post('https://localhost:9091/api/participant/test/create-token-pair', {
            ignoreHTTPSErrors: true,
            data: {
                sessionId: sessionId,
                hostToken: hostToken,
                userToken: userToken,
                validHours: 24
            }
        });
    } catch (error) {
        console.warn('Failed to create token pair via API, tokens may not validate:', error);
    }

    return {
        hostToken: hostToken,
        userToken: userToken,
        sessionId: sessionId,
        createdBy: 'Playwright Test Suite',
        title: `Test Session ${Date.now()}`
    };
}

/**
 * Generate an 8-character random token using the same charset as SecureTokenService
 * Excludes confusing characters like 0/O and 1/I for better UX
 */
function generateRandomToken(): string {
    const CHARSET = "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789"; // Same as SecureTokenService
    const TOKEN_LENGTH = 8;

    let token = '';
    for (let i = 0; i < TOKEN_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * CHARSET.length);
        token += CHARSET[randomIndex];
    }

    return token;
}