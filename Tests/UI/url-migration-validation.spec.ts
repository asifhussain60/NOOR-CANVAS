import { test, expect } from '@playwright/test';

/**
 * URL Migration Validation Tests
 * Validates the migration from noorcanvas.servehttp.com to noorcanvas.kashkole.com
 */

test.describe('URL Migration Validation', () => {
  
  test('Root URL redirects to user landing page', async ({ page }) => {
    // Test that visiting the root URL redirects to /user/landing
    const response = await page.goto('/');
    
    // Should redirect to user landing page
    await expect(page).toHaveURL(/\/user\/landing/);
    
    // Should have successful response
    expect(response?.status()).toBeLessThan(400);
    
    // Verify page loads correctly
    await expect(page.getByText('Participant Registration')).toBeVisible({ timeout: 10000 });
  });

  test('Security guard service recognizes new production hostname', async ({ page }) => {
    // This test would need to be run against production environment
    test.skip(process.env.NODE_ENV !== 'production', 'Only run against production');
    
    await page.goto('/');
    
    // Check console for security guard messages
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('SECURITY-GUARD') || msg.text().includes('kashkole.com')) {
        logs.push(msg.text());
      }
    });
    
    // Navigate to a protected route that would trigger security guard
    await page.goto('/host/landing');
    
    // Wait for any security checks to complete
    await page.waitForTimeout(2000);
    
    // Should not have any security violations for the new domain
    const violations = logs.filter(log => log.includes('SECURITY VIOLATION'));
    expect(violations).toHaveLength(0);
  });

  test('HTTP Client base addresses use new domain in production', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'production', 'Only run against production');
    
    // Navigate to any page that would use HTTP clients
    await page.goto('/user/landing');
    
    // Check console for HTTP client configuration logs
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('HttpClient BaseAddress') || msg.text().includes('kashkole.com')) {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Should find logs indicating new domain is configured
    const configLogs = logs.filter(log => log.includes('kashkole.com'));
    expect(configLogs.length).toBeGreaterThan(0);
  });

  test('CORS functionality works with new domain', async ({ page, context }) => {
    test.skip(process.env.NODE_ENV !== 'production', 'Only run against production');
    
    // Test cross-origin requests work properly
    await page.goto('/');
    
    // Make an API request to test CORS
    const response = await page.evaluate(async () => {
      try {
        const result = await fetch('/api/health', {
          method: 'GET',
          headers: {
            'Origin': 'https://noorcanvas.kashkole.com'
          }
        });
        return {
          status: result.status,
          ok: result.ok
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
  });

  test('Session creation URLs use new domain', async ({ page }) => {
    // Test that session URLs generated use the new domain
    await page.goto('/host/landing');
    
    // Mock valid host token for testing
    await page.evaluate(() => {
      localStorage.setItem('hostToken', 'TEST-TOKEN-123');
    });
    
    // Navigate to host control panel (would need valid session)
    // This is a basic test - in real scenario would need proper setup
    await page.goto('/host/landing');
    
    // Check that any generated URLs contain the new domain
    const pageContent = await page.content();
    
    // Should not contain old domain
    expect(pageContent).not.toContain('servehttp.com');
    
    // In production, should contain new domain in generated links
    if (process.env.NODE_ENV === 'production') {
      expect(pageContent).toContain('kashkole.com');
    }
  });

  test('SSL/TLS certificate works with new domain', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'production', 'Only run against production');
    
    // Test that HTTPS works properly with new domain
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    
    // Should load without certificate errors
    expect(response?.status()).toBeLessThan(400);
    
    // Check that page indicates secure connection
    const securityState = await page.evaluate(() => {
      return {
        protocol: window.location.protocol,
        isSecureContext: window.isSecureContext
      };
    });
    
    expect(securityState.protocol).toBe('https:');
    expect(securityState.isSecureContext).toBe(true);
  });

  test('No references to old domain remain', async ({ page }) => {
    // Test multiple pages to ensure no old domain references
    const pagesToTest = [
      '/',
      '/user/landing',
      '/host/landing'
    ];
    
    for (const url of pagesToTest) {
      await page.goto(url);
      
      const pageContent = await page.content();
      const pageText = await page.textContent('body');
      
      // Should not contain old domain anywhere
      expect(pageContent).not.toContain('servehttp.com');
      expect(pageText).not.toContain('servehttp.com');
      
      // Check console logs for any old domain references
      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));
      
      await page.waitForTimeout(1000);
      
      const oldDomainLogs = logs.filter(log => log.includes('servehttp.com'));
      expect(oldDomainLogs).toHaveLength(0);
    }
  });
});

test.describe('Production Environment Validation', () => {
  
  test.skip(process.env.NODE_ENV !== 'production', 'Production-only tests');
  
  test('Production URL accessibility and performance', async ({ page }) => {
    const startTime = Date.now();
    
    const response = await page.goto('https://noorcanvas.kashkole.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Should load successfully
    expect(response?.status()).toBe(200);
    
    // Should redirect to user landing
    await expect(page).toHaveURL(/\/user\/landing/);
    
    // Should load within reasonable time (10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Should have basic elements visible
    await expect(page.getByText('Participant Registration')).toBeVisible();
  });
  
  test('Database environment guard with new hostname', async ({ page }) => {
    // Navigate to a page that triggers database environment check
    await page.goto('https://noorcanvas.kashkole.com/host/landing');
    
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('SECURITY-GUARD') || msg.text().includes('kashkole.com')) {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Should detect production hostname correctly
    const hostnameLogs = logs.filter(log => 
      log.includes('kashkole.com') && log.includes('Is production hostname: True')
    );
    expect(hostnameLogs.length).toBeGreaterThan(0);
    
    // Should NOT have security violations
    const violations = logs.filter(log => log.includes('SECURITY VIOLATION'));
    expect(violations).toHaveLength(0);
  });
});