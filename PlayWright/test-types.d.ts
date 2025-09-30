/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/**
 * ESLint Configuration Override for Playwright Tests
 * 
 * This file provides type definitions and lint rule overrides for Playwright test files
 * that interact with dynamic browser APIs and SignalR connections.
 * 
 * Applied to test files that have legitimate uses of 'any' types due to:
 * - Dynamic browser window objects (SignalR, custom APIs)
 * - Playwright page evaluation contexts
 * - HTTP response handling with variable content types
 * - Development and debugging scenarios with dynamic content
 */

// Global type definitions for common test scenarios
declare global {
    interface Window {
        signalR?: {
            HubConnectionBuilder: new () => {
                withUrl: (url: string) => {
                    build: () => {
                        start: () => Promise<void>;
                        stop: () => Promise<void>;
                        on: (eventName: string, callback: (data: any) => void) => void;
                        invoke: (methodName: string, ...args: any[]) => Promise<void>;
                    };
                };
            };
        };
    }
}

// Asset lookup type definitions
export interface AssetLookup {
    assetIdentifier: string;
    displayName: string;
    cssSelector: string;
    isActive: boolean;
}

export interface DetectedAsset {
    assetType: string;
    assetId: string;
    content: string;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface AssetLookupResponse {
    totalCount: number;
    assetLookups: AssetLookup[];
    requestId: string;
}

export interface ProcessedHtmlResponse {
    success: boolean;
    processedHtml: string;
    detectedAssets: DetectedAsset[];
    assetCount: number;
}

export { };
