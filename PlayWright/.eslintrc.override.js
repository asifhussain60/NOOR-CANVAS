/**
 * ESLint Override Configuration for PlayWright Test Suite
 * CLEANUP PROTOCOL: Applied during cleanup protocol completion
 * 
 * These overrides handle complex browser globals and test-specific patterns
 * that would require extensive refactoring to properly type.
 */

module.exports = {
    overrides: [
        {
            files: ["tests/**/*.spec.ts"],
            rules: {
                // Allow any types for browser globals (SignalR, window objects)
                "@typescript-eslint/no-explicit-any": ["error", {
                    "ignoreRestArgs": true,
                    "fixToUnknown": false
                }],

                // Allow unused parameters in catch blocks (common pattern)
                "@typescript-eslint/no-unused-vars": ["error", {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                    "caughtErrorsIgnorePattern": "^_?error"
                }]
            }
        }
    ]
};