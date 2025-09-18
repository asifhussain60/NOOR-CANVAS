// This file contains Playwright test utilities for NOOR Canvas
// Shared functions for token generation and common test operations

import { type APIRequestContext } from '@playwright/test';

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
 */
export async function generateTestToken(request: APIRequestContext): Promise<TokenData> {
    const tokenRequest: TokenGenerationRequest = {
        sessionId: Math.floor(Math.random() * 1000) + 200,
        createdBy: 'Playwright Test Suite',
        title: `Test Session ${Date.now()}`
    };

    const response = await request.post('/api/host/generate-token', {
        data: tokenRequest
    });

    if (!response.ok()) {
        throw new Error(`Failed to generate token: ${response.status()}`);
    }

    return await response.json() as TokenData;
}