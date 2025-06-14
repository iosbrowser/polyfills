console.log("Running RegExp Lookbehind Polyfill Tests...");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        testsPassed++;
        // console.log(`PASS: ${message}`);
    } else {
        testsFailed++;
        console.error(`FAIL: ${message}`);
    }
}

function assertArrayEquals(actual, expected, message) {
    if (actual === null && expected === null) {
        testsPassed++;
        return;
    }
    if (actual === null || expected === null || actual.length !== expected.length) {
        testsFailed++;
        console.error(`FAIL: ${message}. Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        return;
    }
    let equals = true;
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] !== expected[i]) {
            equals = false;
            break;
        }
    }
    if (equals) {
        testsPassed++;
    } else {
        testsFailed++;
        console.error(`FAIL: ${message}. Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
    }
}

// Test cases

// 1. RegExp.prototype.test
console.log("\n--- Testing RegExp.prototype.test ---");
// Positive lookbehind
let regexTest1 = new RegExp('(?<=abc)def');
assert(regexTest1.test('abcdef') === true, "test1: Positive lookbehind '(?<=abc)def' on 'abcdef'");
assert(regexTest1.test('defabc') === false, "test2: Positive lookbehind '(?<=abc)def' on 'defabc'");
assert(regexTest1.test('abXdef') === false, "test3: Positive lookbehind '(?<=abc)def' on 'abXdef'");

// Negative lookbehind
let regexTest2 = new RegExp('(?<!abc)def');
assert(regexTest2.test('Xabcdef') === false, "test4: Negative lookbehind '(?<!abc)def' on 'Xabcdef' (false due to polyfill behavior, native might be true for 'def' part if not anchored)");
assert(regexTest2.test('def') === true, "test5: Negative lookbehind '(?<!abc)def' on 'def'");
assert(regexTest2.test('abcdef') === false, "test6: Negative lookbehind '(?<!abc)def' on 'abcdef'");
assert(regexTest2.test('abXdef') === true, "test7: Negative lookbehind '(?<!abc)def' on 'abXdef'");
assert(new RegExp('(?<!\d)foo').test('1foo') === false, "test8: Negative lookbehind '(?<!\d)foo' on '1foo'");
assert(new RegExp('(?<!\d)foo').test('foo') === true, "test9: Negative lookbehind '(?<!\d)foo' on 'foo'");


// 2. RegExp.prototype.exec
console.log("\n--- Testing RegExp.prototype.exec ---");
// Positive lookbehind
let regexExec1 = new RegExp('(?<=abc)def');
let execResult1 = regexExec1.exec('abcdef');
assert(execResult1 !== null && execResult1[0] === 'def', "exec1: Positive lookbehind '(?<=abc)def' on 'abcdef'");
assert(regexExec1.exec('defabc') === null, "exec2: Positive lookbehind '(?<=abc)def' on 'defabc'");

// Negative lookbehind
let regexExec2 = new RegExp('(?<!abc)def');
let execResult2 = regexExec2.exec('Xdef'); // Polyfill might behave differently than native here if not anchored
assert(execResult2 !== null && execResult2[0] === 'def', "exec3: Negative lookbehind '(?<!abc)def' on 'Xdef'");
assert(regexExec2.exec('abcdef') === null, "exec4: Negative lookbehind '(?<!abc)def' on 'abcdef'");

let regexExec3 = new RegExp('(?<=\$\d{1,2}\.)\d{2}');
let execResult3 = regexExec3.exec('Amount: $10.50');
assert(execResult3 !== null && execResult3[0] === '50', "exec5: Positive lookbehind '(?<=\$\d{1,2}\.)\d{2}' on 'Amount: $10.50'");

// 3. String.prototype.match
console.log("\n--- Testing String.prototype.match ---");
// Positive lookbehind
let strMatch1 = 'abcdef';
let matchResult1 = strMatch1.match(new RegExp('(?<=abc)def'));
assert(matchResult1 !== null && matchResult1[0] === 'def', "match1: Positive lookbehind '(?<=abc)def' on 'abcdef'");
assert('defabc'.match(new RegExp('(?<=abc)def')) === null, "match2: Positive lookbehind '(?<=abc)def' on 'defabc'");

// Negative lookbehind
let strMatch2 = 'Xdef';
let matchResult2 = strMatch2.match(new RegExp('(?<!abc)def'));
assert(matchResult2 !== null && matchResult2[0] === 'def', "match3: Negative lookbehind '(?<!abc)def' on 'Xdef'");
assert('abcdef'.match(new RegExp('(?<!abc)def')) === null, "match4: Negative lookbehind '(?<!abc)def' on 'abcdef'");

// Global match
let strMatch3 = 'abc def ghi def';
let regexMatchGlobal = new RegExp('(?<=abc )def|(?<=ghi )def', 'g');
let matchResultGlobal = strMatch3.match(regexMatchGlobal);
assertArrayEquals(matchResultGlobal, ['def', 'def'], "match5: Global positive lookbehind on 'abc def ghi def'");

let strMatch4 = '1def abcdef 2def';
let regexMatchGlobalNeg = new RegExp('(?<!abc)def', 'g');
let matchResultGlobalNeg = strMatch4.match(regexMatchGlobalNeg);
// Expected: The polyfill's matchAllLb logic might return ['def', 'def'] if it processes '1def' and '2def' correctly.
// Native might be more nuanced with global negative lookbehinds.
// Let's assume the polyfill aims for finding 'def' not preceded by 'abc'.
assertArrayEquals(matchResultGlobalNeg, ['def','def'], "match6: Global negative lookbehind '(?<!abc)def' on '1def abcdef 2def'");


// 4. String.prototype.replace
console.log("\n--- Testing String.prototype.replace ---");
// Positive lookbehind
let strReplace1 = 'abcdef';
let replaceResult1 = strReplace1.replace(new RegExp('(?<=abc)def'), 'XYZ');
assert(replaceResult1 === 'abcXYZ', "replace1: Positive lookbehind '(?<=abc)def' replace on 'abcdef'");

let strReplace2 = 'abc def ghi def';
let replaceResult2 = strReplace2.replace(new RegExp('(?<=abc )def', 'g'), 'XYZ');
assert(replaceResult2 === 'abc XYZ ghi def', "replace2: Global positive lookbehind '(?<=abc )def' replace on 'abc def ghi def'");

// Negative lookbehind
let strReplace3 = '1def abcdef 2def';
let replaceResult3 = strReplace3.replace(new RegExp('(?<!abc)def', 'g'), 'XYZ');
// Expected: '1XYZ abcdef 2XYZ'
assert(replaceResult3 === '1XYZ abcdef 2XYZ', "replace3: Global negative lookbehind '(?<!abc)def' replace on '1def abcdef 2def'");

let strReplace4 = 'amount $10.50, then $20.75';
let replaceResult4 = strReplace4.replace(new RegExp('(?<=\$\d{1,2}\.)\d{2}', 'g'), 'XX');
assert(replaceResult4 === 'amount $10.XX, then $20.XX', "replace4: Positive lookbehind with digits '(?<=\$\d{1,2}\.)\d{2}' on 'amount $10.50, then $20.75'");

// Replace with function
let strReplace5 = 'abcdef';
let replaceResult5 = strReplace5.replace(new RegExp('(?<=abc)def'), (match) => match.toUpperCase());
assert(replaceResult5 === 'abcDEF', "replace5: Positive lookbehind with function replacement");

let strReplace6 = '1def abcdef 2def';
let replaceResult6 = strReplace6.replace(new RegExp('(?<!abc)def', 'g'), (match) => match.toUpperCase());
assert(replaceResult6 === '1DEF abcdef 2DEF', "replace6: Global negative lookbehind with function replacement");


console.log("\n--- Test Summary ---");
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
    console.error("\nSome tests failed. Please review the output above.");
} else {
    console.log("\nAll tests passed successfully!");
}

// To run these tests, open an HTML file with both scripts included, or run in a JS environment:
// <script src="RegExp.lookbehind.js"></script>
// <script src="RegExp.lookbehind.test.js"></script>
// Then open the browser console.
