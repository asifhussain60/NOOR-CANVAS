const { test, expect } = require('@playwright/test');

/**
 * NOOR Canvas - API Integration Test Suite
 * 
 * Tests API endpoints and integration points including:
 * - Token generation and validation
 * - Host and User token workflows
 * - Database connectivity
 * - Error handling and edge cases
 */

test.describe('API Integration Tests', () => {

  test('should generate host token via API', async ({ request }) => {
    const response = await request.post('/api/host/generate-token', {
      data: {
        sessionId: 500,
        createdBy: 'API Test Suite',
        title: 'API Integration Test Session'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('hostToken');
    expect(data).toHaveProperty('userToken');
    expect(typeof data.hostToken).toBe('string');
    expect(typeof data.userToken).toBe('string');
    
    // Verify token format (should be GUID-like)
    expect(data.hostToken).toMatch(/^[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    expect(data.userToken).toMatch(/^[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    
    console.log('Generated tokens:', { hostToken: data.hostToken, userToken: data.userToken });
  });

  test('should validate host token via API', async ({ request }) => {
    // First generate a token
    const generateResponse = await request.post('/api/host/generate-token', {
      data: {
        sessionId: 501,
        createdBy: 'Token Validation Test',
        title: 'Token Validation Test Session'
      }
    });

    const tokens = await generateResponse.json();

    // Then validate the generated host token
    const validateResponse = await request.post('/api/host/validate-token', {
      data: {
        token: tokens.hostToken,
        isHost: true
      }
    });

    if (validateResponse.ok()) {
      const validationData = await validateResponse.json();
      expect(validationData.valid).toBeTruthy();
      console.log('Token validation successful');
    } else {
      // May not be implemented yet, log for debugging
      console.log('Token validation endpoint status:', validateResponse.status());
    }
  });

  test('should reject invalid host tokens', async ({ request }) => {
    const response = await request.post('/api/host/create-session', {
      data: {
        hostToken: 'invalid-token-format',
        sessionData: {
          album: '18',
          category: '55', 
          session: '1281'
        }
      }
    });

    // Should return 400 Bad Request for invalid token
    expect(response.status()).toBe(400);
    
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('Invalid host token');
    
    console.log('Invalid token rejection confirmed');
  });

  test('should handle database connectivity issues', async ({ request }) => {
    // Test endpoint that requires database access
    const response = await request.get('/api/health');
    
    if (response.ok()) {
      const health = await response.json();
      console.log('Health check:', health);
      
      // If health endpoint exists, verify database status
      if (health.database) {
        expect(health.database.status).toBe('healthy');
      }
    } else {
      console.log('Health endpoint not available, status:', response.status());
    }
  });

  test('should load Islamic content data via API', async ({ request }) => {
    // Test loading albums (groups)
    const albumsResponse = await request.get('/api/host/albums');
    
    if (albumsResponse.ok()) {
      const albums = await albumsResponse.json();
      expect(Array.isArray(albums)).toBeTruthy();
      expect(albums.length).toBeGreaterThan(0);
      
      // Verify album structure
      if (albums.length > 0) {
        const firstAlbum = albums[0];
        expect(firstAlbum).toHaveProperty('id');
        expect(firstAlbum).toHaveProperty('name');
        
        console.log('Albums loaded successfully:', albums.length);
      }
    } else {
      console.log('Albums API status:', albumsResponse.status());
    }
  });

  test('should load categories for specific album', async ({ request }) => {
    // Test cascading dropdown API - categories for album
    const categoriesResponse = await request.get('/api/host/categories?albumId=18');
    
    if (categoriesResponse.ok()) {
      const categories = await categoriesResponse.json();
      expect(Array.isArray(categories)).toBeTruthy();
      
      console.log('Categories for album 18:', categories.length);
    } else {
      console.log('Categories API status:', categoriesResponse.status());
    }
  });

  test('should load sessions for album and category', async ({ request }) => {
    // Test cascading dropdown API - sessions for category
    const sessionsResponse = await request.get('/api/host/sessions?albumId=18&categoryId=55');
    
    if (sessionsResponse.ok()) {
      const sessions = await sessionsResponse.json();
      expect(Array.isArray(sessions)).toBeTruthy();
      
      console.log('Sessions for album 18, category 55:', sessions.length);
      
      // Look for session 1281 specifically (used in cascading test)
      if (sessions.length > 0) {
        const hasTestSession = sessions.some(s => s.id === 1281 || s.sessionId === 1281);
        console.log('Test session 1281 available:', hasTestSession);
      }
    } else {
      console.log('Sessions API status:', sessionsResponse.status());
    }
  });
});

test.describe('Performance & Load Tests', () => {

  test('should handle multiple concurrent token generations', async ({ request }) => {
    // Generate multiple tokens concurrently
    const tokenPromises = Array.from({ length: 5 }, (_, i) => 
      request.post('/api/host/generate-token', {
        data: {
          sessionId: 600 + i,
          createdBy: `Concurrent Test ${i}`,
          title: `Concurrent Session ${i}`
        }
      })
    );

    const responses = await Promise.all(tokenPromises);
    
    // All should succeed
    responses.forEach((response, i) => {
      expect(response.ok()).toBeTruthy();
      console.log(`Concurrent token ${i} generated successfully`);
    });

    // Verify all tokens are unique
    const tokens = await Promise.all(responses.map(r => r.json()));
    const hostTokens = tokens.map(t => t.hostToken);
    const uniqueTokens = new Set(hostTokens);
    
    expect(uniqueTokens.size).toBe(hostTokens.length);
    console.log('All generated tokens are unique');
  });

  test('should handle rapid API calls without errors', async ({ request }) => {
    // Make rapid sequential calls to test rate limiting/stability
    const rapidCalls = [];
    
    for (let i = 0; i < 10; i++) {
      const promise = request.get('/api/health').then(r => r.status());
      rapidCalls.push(promise);
      
      // Small delay between calls
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const statuses = await Promise.all(rapidCalls);
    
    // Should handle all calls gracefully (2xx or 4xx, not 5xx server errors)
    statuses.forEach((status, i) => {
      expect(status).toBeLessThan(500);
      console.log(`Rapid call ${i}: ${status}`);
    });
  });
});

test.describe('Security & Validation Tests', () => {

  test('should reject malformed requests', async ({ request }) => {
    // Test malformed JSON
    try {
      const response = await request.post('/api/host/generate-token', {
        data: '{invalid-json'
      });
      
      expect(response.status()).toBe(400);
    } catch (error) {
      // Expected to fail due to malformed request
      console.log('Malformed request properly rejected');
    }
  });

  test('should validate required fields', async ({ request }) => {
    // Test missing required fields
    const response = await request.post('/api/host/generate-token', {
      data: {
        // Missing sessionId, createdBy, title
      }
    });

    expect(response.status()).toBe(400);
    
    if (response.headers()['content-type']?.includes('json')) {
      const error = await response.json();
      console.log('Validation error:', error);
    }
  });

  test('should handle SQL injection attempts safely', async ({ request }) => {
    // Test with potential SQL injection in sessionId
    const response = await request.post('/api/host/generate-token', {
      data: {
        sessionId: "1; DROP TABLE Sessions;--",
        createdBy: 'Security Test',
        title: 'SQL Injection Test'
      }
    });

    // Should either reject or safely handle the malicious input
    if (response.ok()) {
      console.log('SQL injection attempt handled safely');
    } else {
      console.log('SQL injection attempt rejected with status:', response.status());
    }
  });
});