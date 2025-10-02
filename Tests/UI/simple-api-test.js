/**
 * Simple API test to examine question data structure
 */

const https = require('https');

// Ignore SSL certificate errors for localhost development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function makeApiCall(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsedData });
                } catch (err) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
    });
}

async function analyzeQuestionData() {
    console.log('🔍 ANALYZING: Question data structure from API');
    console.log('='.repeat(50));
    
    const testConfig = {
        hostToken: 'KJAHA99L',
        userToken: 'PQ9N5YWW'
    };
    
    try {
        // Test 1: Get questions using HostToken
        console.log('\n📊 TEST 1: Getting questions with HostToken');
        const hostResult = await makeApiCall(`https://localhost:9091/api/question/session/${testConfig.hostToken}`);
        console.log(`Status: ${hostResult.status}`);
        if (hostResult.status === 200 && hostResult.data) {
            console.log('📦 HostToken Response:');
            console.log(JSON.stringify(hostResult.data, null, 2));
            
            if (hostResult.data.questions && hostResult.data.questions.length > 0) {
                console.log('\n🔍 Question Analysis (HostToken):');
                hostResult.data.questions.forEach((q, i) => {
                    console.log(`   Question ${i + 1}:`);
                    console.log(`   - Text: "${q.text}"`);
                    console.log(`   - UserName: "${q.userName}"`);
                    console.log(`   - CreatedBy: "${q.createdBy}"`);
                    console.log(`   - Votes: ${q.votes}`);
                    console.log('');
                });
            } else {
                console.log('   No questions found with HostToken');
            }
        } else {
            console.log(`❌ Error: ${hostResult.status} - ${JSON.stringify(hostResult.data)}`);
        }
        
        // Test 2: Get questions using UserToken
        console.log('\n📊 TEST 2: Getting questions with UserToken');
        const userResult = await makeApiCall(`https://localhost:9091/api/question/session/${testConfig.userToken}`);
        console.log(`Status: ${userResult.status}`);
        if (userResult.status === 200 && userResult.data) {
            console.log('📦 UserToken Response:');
            console.log(JSON.stringify(userResult.data, null, 2));
            
            if (userResult.data.questions && userResult.data.questions.length > 0) {
                console.log('\n🔍 Question Analysis (UserToken):');
                userResult.data.questions.forEach((q, i) => {
                    console.log(`   Question ${i + 1}:`);
                    console.log(`   - Text: "${q.text}"`);
                    console.log(`   - UserName: "${q.userName}"`);
                    console.log(`   - CreatedBy: "${q.createdBy}"`);
                    console.log(`   - Votes: ${q.votes}`);
                    console.log('');
                });
            } else {
                console.log('   No questions found with UserToken');
            }
        } else {
            console.log(`❌ Error: ${userResult.status} - ${JSON.stringify(userResult.data)}`);
        }
        
        // Test 3: Get participant info
        console.log('\n📊 TEST 3: Getting participant information');
        const participantResult = await makeApiCall(`https://localhost:9091/api/participant/session/${testConfig.userToken}/participants`);
        console.log(`Status: ${participantResult.status}`);
        if (participantResult.status === 200 && participantResult.data) {
            console.log('👥 Participants Response:');
            console.log(JSON.stringify(participantResult.data, null, 2));
        } else {
            console.log(`❌ Error: ${participantResult.status} - ${JSON.stringify(participantResult.data)}`);
        }
        
        console.log('\n📋 SUMMARY:');
        console.log('='.repeat(50));
        console.log('1. Question data structure includes: text, userName, createdBy, votes');
        console.log('2. HostToken vs UserToken may return different data');
        console.log('3. userName field is where participant names should appear');
        console.log('4. If userName shows "Anonymous", the issue is in participant name resolution');
        
    } catch (error) {
        console.error('❌ API test failed:', error);
    }
}

// Run the analysis
analyzeQuestionData();