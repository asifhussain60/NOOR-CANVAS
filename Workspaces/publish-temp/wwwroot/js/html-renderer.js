/**
 * [DEBUG-WORKITEM:signalcomm:impl] Advanced HTML Renderer - JavaScript fallback for Blazor DOM parser limitations ;CLEANUP_OK
 * Provides client-side HTML parsing and rendering when server-side parsing fails
 * This addresses the core issue of Blazor's DOM parser being too strict with CSS
 */

window.NoorCanvas = window.NoorCanvas || {};
window.NoorCanvas.HtmlRenderer = {

    /**
     * Render HTML content safely using browser's native DOM parser
     * This bypasses Blazor's strict parsing by using browser's more permissive parser
     * @param {string} containerId - ID of the container element
     * @param {string} htmlContent - HTML content to render
     * @param {object} options - Rendering options
     * @returns {Promise<boolean>} Success status
     */
    renderHtml: async function (containerId, htmlContent, options = {}) {
        try {
            console.log('[DEBUG-WORKITEM:signalcomm:impl] JavaScript HTML renderer starting', {
                containerId,
                contentLength: htmlContent?.length || 0,
                options
            });

            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container element with ID '${containerId}' not found`);
            }

            // Validate HTML content
            if (!htmlContent || typeof htmlContent !== 'string') {
                throw new Error('Invalid HTML content provided');
            }

            // Security check - basic XSS prevention
            if (this.containsUnsafeContent(htmlContent)) {
                throw new Error('HTML content contains potentially unsafe elements');
            }

            // Use browser's native DOM parser which is more permissive than Blazor
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');

            // Check for parsing errors
            const parserErrors = doc.getElementsByTagName('parsererror');
            if (parserErrors.length > 0) {
                throw new Error('HTML parsing failed: ' + parserErrors[0].textContent);
            }

            // Extract the parsed content
            const parsedContent = doc.body.firstChild;

            // Clear the container and append the parsed content
            container.innerHTML = '';
            container.appendChild(parsedContent.cloneNode(true));

            // Apply post-processing if needed
            if (options.processLinks) {
                this.processLinks(container);
            }

            if (options.processImages) {
                this.processImages(container);
            }

            console.log('[DEBUG-WORKITEM:signalcomm:impl] JavaScript HTML rendering successful');
            return true;

        } catch (error) {
            console.error('[DEBUG-WORKITEM:signalcomm:impl] JavaScript HTML rendering failed:', error);

            // Render error message
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = this.createErrorMessage(error.message);
            }

            return false;
        }
    },

    /**
     * Check for unsafe content patterns
     * @param {string} html - HTML content to check
     * @returns {boolean} True if unsafe content detected
     */
    containsUnsafeContent: function (html) {
        const unsafePatterns = [
            /<script[^>]*>/i,
            /javascript:/i,
            /vbscript:/i,
            /on\w+\s*=/i,
            /<iframe[^>]*>/i,
            /<object[^>]*>/i,
            /<embed[^>]*>/i
        ];

        return unsafePatterns.some(pattern => pattern.test(html));
    },

    /**
     * Process links to ensure they open safely
     * @param {Element} container - Container element
     */
    processLinks: function (container) {
        const links = container.querySelectorAll('a[href]');
        links.forEach(link => {
            // Ensure external links open in new tab
            if (link.href.startsWith('http') && !link.href.includes(window.location.hostname)) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }
        });
    },

    /**
     * Process images to ensure they load safely
     * @param {Element} container - Container element
     */
    processImages: function (container) {
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            // Add error handling for broken images
            img.onerror = function () {
                this.style.display = 'none';
            };
        });
    },

    /**
     * Create a safe error message
     * @param {string} message - Error message
     * @returns {string} HTML error message
     */
    createErrorMessage: function (message) {
        const timestamp = new Date().toLocaleTimeString();
        return `
            <div style="background:#FEF2F2;color:#DC2626;padding:15px;border-radius:8px;border:1px solid #FCA5A5;text-align:center;">
                <h4 style="margin:0 0 8px 0;">⚠️ Rendering Error</h4>
                <p style="margin:0;font-size:14px;">${this.escapeHtml(message)}</p>
                <p style="margin:8px 0 0 0;font-size:12px;opacity:0.8;">Time: ${timestamp} (JavaScript Renderer)</p>
            </div>
        `;
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml: function (text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Test the renderer with sample content
     * @returns {Promise<boolean>} Test result
     */
    test: async function () {
        console.log('[DEBUG-WORKITEM:signalcomm:impl] Testing JavaScript HTML renderer');

        // Create a test container
        const testContainer = document.createElement('div');
        testContainer.id = 'html-renderer-test';
        testContainer.style.display = 'none';
        document.body.appendChild(testContainer);

        try {
            // Test with complex CSS that causes Blazor issues
            const testHtml = `
                <div style="background: linear-gradient(45deg, rgba(255,0,0,0.5), rgba(0,255,0,0.5)); padding: 20px; font-family: 'Arial', sans-serif;">
                    <h3>Test Content</h3>
                    <p style="color: rgba(0,0,0,0.8);">This content has complex CSS that might fail in Blazor.</p>
                </div>
            `;

            const result = await this.renderHtml('html-renderer-test', testHtml);

            // Clean up
            document.body.removeChild(testContainer);

            console.log('[DEBUG-WORKITEM:signalcomm:impl] JavaScript HTML renderer test result:', result);
            return result;

        } catch (error) {
            console.error('[DEBUG-WORKITEM:signalcomm:impl] JavaScript HTML renderer test failed:', error);
            if (testContainer.parentNode) {
                document.body.removeChild(testContainer);
            }
            return false;
        }
    }
};

// Auto-test the renderer when loaded (in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(() => {
            window.NoorCanvas.HtmlRenderer.test();
        }, 1000);
    });
}