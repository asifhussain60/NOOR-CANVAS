// ESLint configuration override for test files
// Applied during cleanup protocol to handle complex browser globals and test patterns

module.exports = {
    overrides: [
        {
            files: ["tests/**/*.spec.ts"],
            rules: {
                // Allow any types for SignalR browser globals (complex to type properly)
                "@typescript-eslint/no-explicit-any": ["warn", {
                    "ignoreRestArgs": true
                }],

                // Allow unused variables with underscore prefix (test patterns)
                "@typescript-eslint/no-unused-vars": ["error", {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                    "caughtErrors": "none"
                }]
            }
        }
    ]
};