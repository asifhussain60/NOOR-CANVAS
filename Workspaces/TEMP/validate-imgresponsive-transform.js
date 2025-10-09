/**
 * Simple validation script to test imgResponsive transformation
 * Run manually in browser console on session-transcript-styling.html
 * 
 * Tests:
 * 1. Transform function removes inline width/height styles
 * 2. data-islamic-content attribute is appended correctly
 * 3. Empty style attributes are removed
 * 4. Transform function exists and is callable
 */

console.log('='.repeat(80));
console.log('imgResponsive Transformation Validation Tests');
console.log('='.repeat(80));

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, errorMsg = '') {
    if (condition) {
        console.log(`✓ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`✗ FAIL: ${testName}${errorMsg ? ` - ${errorMsg}` : ''}`);
        failedTests++;
    }
}

// Test 1: Transform function exists
assert(typeof transformHtml === 'function',
    'transformHtml function exists');

// Test 2: Remove inline width/height styles
const testHtml1 = '<img src="/test.jpg" class="imgResponsive" style="width: 500px; height: 300px; border: 1px solid red;">';
const result1 = transformHtml(testHtml1);
assert(!result1.includes('width: 500px'),
    'Removes inline width style');
assert(!result1.includes('height: 300px'),
    'Removes inline height style');
assert(result1.includes('border: 1px solid red'),
    'Preserves other inline styles');

// Test 3: Add data-islamic-content attribute
const testHtml2 = '<img src="/test.jpg" class="imgResponsive">';
const result2 = transformHtml(testHtml2);
assert(result2.includes('data-islamic-content'),
    'Adds data-islamic-content attribute to imgResponsive');

// Test 4: Don't duplicate data-islamic-content
const testHtml3 = '<img src="/test.jpg" class="imgResponsive" data-islamic-content>';
const result3 = transformHtml(testHtml3);
const count = (result3.match(/data-islamic-content/g) || []).length;
assert(count === 1,
    'Does not duplicate data-islamic-content attribute',
    `Found ${count} occurrences`);

// Test 5: Remove empty style attributes
const testHtml4 = '<img src="/test.jpg" class="imgResponsive" style="width: 500px; height: 300px;">';
const result4 = transformHtml(testHtml4);
assert(!result4.includes('style=""'),
    'Removes empty style attributes');
assert(!result4.includes('style='),
    'Removes style attribute entirely when empty');

// Test 6: Handle images without style attribute
const testHtml5 = '<img src="/test.jpg" class="imgResponsive">';
const result5 = transformHtml(testHtml5);
assert(result5.includes('imgResponsive'),
    'Handles images without style attribute');
assert(result5.includes('data-islamic-content'),
    'Still adds data-islamic-content to images without style');

// Test 7: Handle mixed content
const testHtml6 = `
    <div class="example"><p>Example</p></div>
    <img src="/test.jpg" class="imgResponsive" style="width: 700px; height: 525px; margin: 10px auto;">
    <div class="quote"><p>Quote</p></div>
`;
const result6 = transformHtml(testHtml6);
assert(!result6.includes('width: 700px'),
    'Removes width from image in mixed content');
assert(!result6.includes('height: 525px'),
    'Removes height from image in mixed content');
assert(result6.includes('margin: 10px auto'),
    'Preserves margin in mixed content');
assert((result6.match(/data-islamic-content/g) || []).length >= 3,
    'Adds data-islamic-content to all relevant elements in mixed content');

// Test 8: Handle multiple images
const testHtml7 = `
    <img src="/test1.jpg" class="imgResponsive" style="width: 500px;">
    <img src="/test2.jpg" class="imgResponsive" style="height: 400px;">
`;
const result7 = transformHtml(testHtml7);
assert(!result7.includes('width: 500px'),
    'Removes width from first image in multiple images');
assert(!result7.includes('height: 400px'),
    'Removes height from second image in multiple images');

// Final summary
console.log('='.repeat(80));
console.log(`TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(80));

if (failedTests === 0) {
    console.log('%c ALL TESTS PASSED! ✓', 'color: green; font-weight: bold; font-size: 16px;');
} else {
    console.log('%c SOME TESTS FAILED! ✗', 'color: red; font-weight: bold; font-size: 16px;');
}
