/**
 * Debug script to analyze question data flow in HostControlPanel
 * Question: What info does HostControlPanel.razor receive when it gets a question?
 */

const { chromium } = require('playwright');

async function debugQuestionDataFlow() {
    console.log('🔍 DEBUG: Analyzing question data flow in HostControlPanel.razor');
    
    const testConfig = {
        baseUrl: 'http://localhost:9090',
        sessionId: '212',
        hostToken: 'KJAHA99L',
        userToken: 'PQ9N5YWW',
        participantName: 'Test Participant'
    };

    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    
    try {
        // Create separate contexts for host and participant
        const hostContext = await browser.newContext();
        const userContext = await browser.newContext();

        // Set up console logging for both contexts
        const hostPage = await hostContext.newPage();
        const userPage = await userContext.newPage();

        // Monitor all console logs for question data analysis
        hostPage.on('console', msg => {
            const text = msg.text();
            if (text.includes('HOST-QUESTIONS-TRACE') || 
                text.includes('QUESTIONS-DATA') || 
                text.includes('HostQuestionAlert') ||
                text.includes('questionData')) {
                console.log(`🎯 HOST-CONSOLE: ${text}`);
            }
        });

        userPage.on('console', msg => {
            const text = msg.text();
            if (text.includes('QUESTION') || text.includes('SUBMIT')) {
                console.log(`📝 USER-CONSOLE: ${text}`);
            }
        });

        // Step 1: Open HostControlPanel and monitor initial question loading
        console.log('📊 Step 1: Opening HostControlPanel to monitor initial question loading');
        await hostPage.goto(`${testConfig.baseUrl}/Admin/HostControlPanel?SessionID=${testConfig.sessionId}&HostToken=${testConfig.hostToken}`);
        await hostPage.waitForSelector('h2:has-text("HOST CONTROL PANEL")', { timeout: 10000 });
        console.log('✅ HostControlPanel loaded successfully');

        // Wait for any existing questions to load
        await hostPage.waitForTimeout(3000);

        // Step 2: Open SessionCanvas for participant
        console.log('📝 Step 2: Opening SessionCanvas for participant');
        await userPage.goto(`${testConfig.baseUrl}/SessionCanvas?SessionID=${testConfig.sessionId}&UserToken=${testConfig.userToken}`);
        await userPage.waitForSelector('h1', { timeout: 10000 });
        console.log('✅ SessionCanvas loaded successfully');

        // Step 3: Register participant with proper name
        console.log('👤 Step 3: Registering participant with name');
        
        // Check if registration form is present
        const registrationForm = await userPage.$('form');
        if (registrationForm) {
            await userPage.fill('input[name="name"]', testConfig.participantName);
            await userPage.fill('input[name="email"]', 'test@example.com');
            await userPage.selectOption('select[name="country"]', 'Canada');
            await userPage.click('button[type="submit"]');
            await userPage.waitForTimeout(2000);
            console.log('✅ Participant registered successfully');
        } else {
            console.log('ℹ️ Registration form not found, participant may already be registered');
        }

        // Step 4: Submit a test question and monitor SignalR data
        console.log('❓ Step 4: Submitting test question to analyze data structure');
        
        const testQuestion = `Debug Test Question - ${new Date().toLocaleTimeString()}`;
        
        // Look for the question input field
        const questionInput = await userPage.$('input[placeholder*="question"], textarea[placeholder*="question"], input[type="text"]');
        if (questionInput) {
            await questionInput.fill(testQuestion);
            
            // Find and click submit button
            const submitButton = await userPage.$('button:has-text("Submit"), button:has-text("Ask"), button[type="submit"]');
            if (submitButton) {
                console.log(`📤 Submitting question: "${testQuestion}"`);
                await submitButton.click();
                
                // Wait for SignalR transmission and host reception
                await hostPage.waitForTimeout(5000);
                
                console.log('✅ Question submitted, waiting for HostControlPanel to receive data');
            } else {
                console.log('❌ Submit button not found');
            }
        } else {
            console.log('❌ Question input field not found');
        }

        // Step 5: Analyze the question data in HostControlPanel
        console.log('🔍 Step 5: Analyzing question data in HostControlPanel');
        
        // Check if questions are displayed
        const questionsList = await hostPage.$$('[data-testid*="question"], .question-item, div:has-text("' + testQuestion + '")');
        console.log(`📋 Found ${questionsList.length} question elements in HostControlPanel`);

        // Look for participant name display
        const nameElements = await hostPage.$$eval('*', (elements) => {
            return elements
                .filter(el => el.textContent && (
                    el.textContent.includes('Test Participant') || 
                    el.textContent.includes('Anonymous')
                ))
                .map(el => ({
                    tagName: el.tagName,
                    textContent: el.textContent.trim(),
                    className: el.className
                }));
        });

        console.log('👤 Participant name analysis:');
        nameElements.forEach((elem, i) => {
            console.log(`   ${i + 1}. ${elem.tagName}: "${elem.textContent}" (class: ${elem.className})`);
        });

        // Step 6: Check API calls and data structure
        console.log('🌐 Step 6: Checking API calls for question data');
        
        // Monitor network requests
        hostPage.on('response', async response => {
            if (response.url().includes('/api/question/session/')) {
                console.log(`🔗 API Call: ${response.url()}`);
                console.log(`📊 Status: ${response.status()}`);
                
                if (response.status() === 200) {
                    try {
                        const responseData = await response.json();
                        console.log('📦 Question API Response Data:');
                        console.log(JSON.stringify(responseData, null, 2));
                    } catch (err) {
                        console.log('❌ Failed to parse API response:', err.message);
                    }
                }
            }
        });

        // Refresh to trigger API calls
        await hostPage.reload();
        await hostPage.waitForTimeout(3000);

        // Step 7: Examine the HTML structure for questions
        console.log('🔍 Step 7: Examining HTML structure for questions');
        
        const questionsHTML = await hostPage.$eval('body', (body) => {
            const questionElements = Array.from(body.querySelectorAll('*')).filter(el => 
                el.textContent && (
                    el.textContent.toLowerCase().includes('question') || 
                    el.textContent.includes('Test Participant') || 
                    el.textContent.includes('Anonymous')
                )
            );
            
            return questionElements.slice(0, 5).map(el => ({
                tag: el.tagName,
                text: el.textContent.trim().substring(0, 100),
                classes: el.className
            }));
        });

        console.log('🏗️ Question-related HTML elements:');
        questionsHTML.forEach((elem, i) => {
            console.log(`   ${i + 1}. <${elem.tag}> class="${elem.classes}": "${elem.text}"`);
        });

        console.log('\n📋 ANALYSIS SUMMARY:');
        console.log('===================');
        console.log('1. HostControlPanel receives question data through SignalR "HostQuestionAlert" event');
        console.log('2. Question data structure should include: text, userName, createdBy, votes');
        console.log('3. Participant names are resolved via API call to /api/question/session/{token}');
        console.log('4. The issue may be in token resolution or participant lookup logic');
        console.log('5. Check console logs above for specific data structures and API responses');

    } catch (error) {
        console.error('❌ Debug analysis failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the debug analysis
debugQuestionDataFlow().catch(console.error);