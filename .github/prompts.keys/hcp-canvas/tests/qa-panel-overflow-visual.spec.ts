/**
 * Visual Regression Test: Q&A Panel Overflow Fix
 * Key: hcp-canvas
 * Feature: qa-panel-overflow
 * 
 * Purpose: Verify the Q&A sidebar panel in SessionCanvas does not overflow 
 * the container width on desktop and mobile viewports.
 * 
 * Related Issue: Right panel overflow reported on 2025-10-19
 * Fix Applied: min-width:0 strategy + mobile responsiveness enhancements
 */

import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

// Configuration
const APP_URL = 'http://localhost:5000';
const SESSION_ID = 215; // Test session with Q&A data

// Viewport configurations
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};

test.describe('Q&A Panel Overflow - Visual Regression', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to session canvas with Q&A panel
    await page.goto(`${APP_URL}/Canvas/Session/${SESSION_ID}`);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for Q&A panel to render
    await page.waitForSelector('.canvas-sidebar', { timeout: 10000 });
    
    // Give components time to settle
    await page.waitForTimeout(1000);
  });

  test('Desktop viewport (1920x1080) - Q&A sidebar should not overflow', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForTimeout(500); // Allow reflow
    
    // Verify sidebar is present
    const sidebar = page.locator('.canvas-sidebar');
    await expect(sidebar).toBeVisible();
    
    // Get sidebar dimensions
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox).toBeTruthy();
    
    // Get parent container dimensions
    const mainGrid = page.locator('.canvas-main-grid');
    const gridBox = await mainGrid.boundingBox();
    expect(gridBox).toBeTruthy();
    
    // Assert sidebar does not overflow container
    if (sidebarBox && gridBox) {
      expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(gridBox.x + gridBox.width);
      console.log(`Desktop - Sidebar width: ${sidebarBox.width}px, Container width: ${gridBox.width}px`);
    }
    
    // Capture Percy snapshot for visual baseline
    await percySnapshot(page, 'Q&A Panel - Desktop 1920x1080', {
      widths: [1920],
      minHeight: 1080
    });
  });

  test('Tablet viewport (768x1024) - Q&A sidebar should not overflow', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.waitForTimeout(500); // Allow reflow
    
    // Verify sidebar is present
    const sidebar = page.locator('.canvas-sidebar');
    await expect(sidebar).toBeVisible();
    
    // Get sidebar dimensions
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox).toBeTruthy();
    
    // Get parent container dimensions
    const mainGrid = page.locator('.canvas-main-grid');
    const gridBox = await mainGrid.boundingBox();
    expect(gridBox).toBeTruthy();
    
    // Assert sidebar does not overflow container
    if (sidebarBox && gridBox) {
      expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(gridBox.x + gridBox.width);
      console.log(`Tablet - Sidebar width: ${sidebarBox.width}px, Container width: ${gridBox.width}px`);
    }
    
    // Capture Percy snapshot for visual baseline
    await percySnapshot(page, 'Q&A Panel - Tablet 768x1024', {
      widths: [768],
      minHeight: 1024
    });
  });

  test('Mobile viewport (375x667) - Q&A sidebar should not overflow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.waitForTimeout(500); // Allow reflow
    
    // Verify sidebar is present (may be stacked below on mobile)
    const sidebar = page.locator('.canvas-sidebar');
    await expect(sidebar).toBeVisible();
    
    // Get sidebar dimensions
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox).toBeTruthy();
    
    // Get viewport dimensions
    const viewportSize = page.viewportSize();
    expect(viewportSize).toBeTruthy();
    
    // Assert sidebar does not overflow viewport width
    if (sidebarBox && viewportSize) {
      expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(viewportSize.width);
      console.log(`Mobile - Sidebar width: ${sidebarBox.width}px, Viewport width: ${viewportSize.width}px`);
    }
    
    // Capture Percy snapshot for visual baseline
    await percySnapshot(page, 'Q&A Panel - Mobile 375x667', {
      widths: [375],
      minHeight: 667
    });
  });

  test('Desktop - Long question text should wrap properly', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForTimeout(500);
    
    // Check if there are question items
    const questionItems = page.locator('.canvas-question-item');
    const count = await questionItems.count();
    
    if (count > 0) {
      // Get first question item
      const firstQuestion = questionItems.first();
      await expect(firstQuestion).toBeVisible();
      
      // Get question text element
      const questionText = firstQuestion.locator('.canvas-question-text');
      const textBox = await questionText.boundingBox();
      
      // Get parent question item box
      const itemBox = await firstQuestion.boundingBox();
      
      // Assert text does not overflow question card
      if (textBox && itemBox) {
        expect(textBox.x + textBox.width).toBeLessThanOrEqual(itemBox.x + itemBox.width);
        console.log(`Question text width: ${textBox.width}px, Card width: ${itemBox.width}px`);
      }
    } else {
      console.log('No questions found in this session - skipping text wrap test');
    }
    
    // Capture Percy snapshot
    await percySnapshot(page, 'Q&A Panel - Long Text Wrapping', {
      widths: [1920],
      minHeight: 1080
    });
  });

  test('Mobile - Question cards should be responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.waitForTimeout(500);
    
    // Check if there are question items
    const questionItems = page.locator('.canvas-question-item');
    const count = await questionItems.count();
    
    if (count > 0) {
      // Check each question card
      for (let i = 0; i < Math.min(count, 3); i++) {
        const question = questionItems.nth(i);
        const questionBox = await question.boundingBox();
        const viewportSize = page.viewportSize();
        
        if (questionBox && viewportSize) {
          // Assert card does not exceed viewport width (accounting for padding)
          expect(questionBox.width).toBeLessThanOrEqual(viewportSize.width);
          console.log(`Question ${i + 1} width: ${questionBox.width}px, Viewport: ${viewportSize.width}px`);
        }
      }
    } else {
      console.log('No questions found in this session - skipping mobile card test');
    }
    
    // Capture Percy snapshot
    await percySnapshot(page, 'Q&A Panel - Mobile Responsive Cards', {
      widths: [375],
      minHeight: 667
    });
  });

  test('Horizontal scroll should not be present', async ({ page }) => {
    // Test on desktop viewport
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForTimeout(500);
    
    // Check for horizontal scrollbar on main container
    const scrollWidth = await page.evaluate(() => {
      const container = document.querySelector('.canvas-main-grid');
      if (!container) return { hasOverflow: false, scrollWidth: 0, clientWidth: 0 };
      
      return {
        hasOverflow: container.scrollWidth > container.clientWidth,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth
      };
    });
    
    console.log(`Scroll check - scrollWidth: ${scrollWidth.scrollWidth}px, clientWidth: ${scrollWidth.clientWidth}px`);
    expect(scrollWidth.hasOverflow).toBe(false);
  });
});
