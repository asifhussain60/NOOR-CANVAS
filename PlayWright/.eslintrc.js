module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'playwright'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:playwright/playwright-test',
        'prettier'
    ],
    rules: {
        '@typescript-eslint/no-unused-vars': ['error'],
        'no-duplicate-imports': 'error',
        'playwright/no-skipped-test': 'warn'
    }
};