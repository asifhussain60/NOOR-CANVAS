using Microsoft.AspNetCore.Components;
using HtmlAgilityPack;
using System.Text;

namespace NoorCanvas.Services
{
    /// <summary>
    /// [DEBUG-WORKITEM:hostcanvas:continue] Safe HTML rendering service inspired by AngularJS $sce.trustAsHtml() ;CLEANUP_OK
    /// Provides secure HTML content rendering for large transcript content to avoid appendChild issues.
    /// Based on the KSESSIONS implementation pattern.
    /// </summary>
    public class SafeHtmlRenderingService
    {
        private readonly ILogger<SafeHtmlRenderingService> _logger;

        public SafeHtmlRenderingService(ILogger<SafeHtmlRenderingService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Safely renders HTML content using Blazor's MarkupString, similar to AngularJS $sce.trustAsHtml()
        /// This approach avoids appendChild JavaScript errors by using Blazor's native rendering.
        /// </summary>
        /// <param name="htmlContent">Raw HTML content to render</param>
        /// <returns>MarkupString that can be safely rendered in Blazor</returns>
        public MarkupString RenderSafeHtml(string htmlContent)
        {
            try
            {
                if (string.IsNullOrEmpty(htmlContent))
                {
                    _logger.LogDebug("[DEBUG-WORKITEM:hostcanvas:continue] Empty HTML content provided ;CLEANUP_OK");
                    return new MarkupString("<p>No content available.</p>");
                }

                _logger.LogDebug("[DEBUG-WORKITEM:hostcanvas:continue] Processing HTML content - length: {Length} chars ;CLEANUP_OK", htmlContent.Length);

                // Parse HTML using HtmlAgilityPack for safe processing
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(htmlContent);

                // Process the HTML to ensure it's safe for Blazor rendering
                var processedHtml = ProcessHtmlForBlazorRendering(htmlDoc);

                _logger.LogDebug("[DEBUG-WORKITEM:hostcanvas:continue] HTML processed successfully - output length: {Length} chars ;CLEANUP_OK", processedHtml.Length);

                // Return as MarkupString which Blazor can render safely without appendChild issues
                return new MarkupString(processedHtml);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:hostcanvas:continue] Error processing HTML content ;CLEANUP_OK");
                return new MarkupString($"<div class='error'>Error rendering content: {ex.Message}</div>");
            }
        }

        /// <summary>
        /// Process HTML content to ensure it's compatible with Blazor rendering
        /// Based on KSESSIONS pattern of safe HTML processing
        /// </summary>
        private string ProcessHtmlForBlazorRendering(HtmlDocument htmlDoc)
        {
            // Remove potentially problematic elements that could cause appendChild issues
            RemoveProblematicElements(htmlDoc);
            
            // Sanitize attributes that could cause JavaScript conflicts
            SanitizeAttributes(htmlDoc);
            
            // Optimize for Blazor rendering
            OptimizeForBlazorRendering(htmlDoc);

            return htmlDoc.DocumentNode.OuterHtml;
        }

        private void RemoveProblematicElements(HtmlDocument htmlDoc)
        {
            // Remove script tags to prevent JavaScript conflicts
            var scriptNodes = htmlDoc.DocumentNode.SelectNodes("//script");
            if (scriptNodes != null)
            {
                foreach (var script in scriptNodes)
                {
                    script.Remove();
                }
                _logger.LogDebug("[DEBUG-WORKITEM:hostcanvas:continue] Removed {Count} script elements for safety ;CLEANUP_OK", scriptNodes.Count);
            }

            // Remove potentially problematic inline event handlers
            var nodesWithEvents = htmlDoc.DocumentNode.SelectNodes("//*[@onclick or @onload or @onerror]");
            if (nodesWithEvents != null)
            {
                foreach (var node in nodesWithEvents)
                {
                    node.Attributes.Remove("onclick");
                    node.Attributes.Remove("onload");
                    node.Attributes.Remove("onerror");
                }
                _logger.LogDebug("[DEBUG-WORKITEM:hostcanvas:continue] Cleaned {Count} elements with event handlers ;CLEANUP_OK", nodesWithEvents.Count);
            }
        }

        private void SanitizeAttributes(HtmlDocument htmlDoc)
        {
            // Clean up any Blazor-conflicting attributes
            var allNodes = htmlDoc.DocumentNode.SelectNodes("//*");
            if (allNodes != null)
            {
                foreach (var node in allNodes)
                {
                    // Remove attributes that could conflict with Blazor
                    var attributesToRemove = new List<string>();
                    
                    foreach (var attr in node.Attributes)
                    {
                        // Remove javascript: URLs
                        if (attr.Value?.StartsWith("javascript:") == true)
                        {
                            attributesToRemove.Add(attr.Name);
                        }
                    }

                    foreach (var attrName in attributesToRemove)
                    {
                        node.Attributes.Remove(attrName);
                    }
                }
            }
        }

        private void OptimizeForBlazorRendering(HtmlDocument htmlDoc)
        {
            // Add classes that help with Blazor rendering performance
            var bodyNode = htmlDoc.DocumentNode.SelectSingleNode("//body") ?? htmlDoc.DocumentNode;
            
            // Ensure the content has a proper container structure for Blazor
            if (bodyNode.ChildNodes.Count > 0)
            {
                // Wrap content in a div if it's not already properly contained
                var hasContainerDiv = bodyNode.SelectSingleNode("./div[@class='transcript-content']") != null;
                
                if (!hasContainerDiv)
                {
                    var wrapper = htmlDoc.CreateElement("div");
                    wrapper.SetAttributeValue("class", "transcript-content blazor-safe-html");
                    
                    // Move all existing content into the wrapper
                    var existingNodes = bodyNode.ChildNodes.ToList();
                    foreach (var node in existingNodes)
                    {
                        node.Remove();
                        wrapper.AppendChild(node);
                    }
                    
                    bodyNode.AppendChild(wrapper);
                    _logger.LogDebug("[DEBUG-WORKITEM:hostcanvas:continue] Wrapped content in Blazor-safe container ;CLEANUP_OK");
                }
            }
        }

        /// <summary>
        /// Alternative method for chunk-based rendering to handle very large content
        /// Inspired by KSESSIONS approach to content streaming
        /// </summary>
        public IEnumerable<MarkupString> RenderSafeHtmlInChunks(string htmlContent, int chunkSize = 10000)
        {
            if (string.IsNullOrEmpty(htmlContent))
            {
                yield return new MarkupString("<p>No content available.</p>");
                yield break;
            }

            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:continue] Rendering large content in chunks - total size: {Size}, chunk size: {ChunkSize} ;CLEANUP_OK", 
                htmlContent.Length, chunkSize);

            var htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(htmlContent);
            ProcessHtmlForBlazorRendering(htmlDoc);

            // Split into manageable chunks while preserving HTML structure
            var content = htmlDoc.DocumentNode.OuterHtml;
            
            for (int i = 0; i < content.Length; i += chunkSize)
            {
                var chunkLength = Math.Min(chunkSize, content.Length - i);
                var chunk = content.Substring(i, chunkLength);
                
                // Ensure we don't break HTML tags
                if (i + chunkLength < content.Length && chunk.LastIndexOf('<') > chunk.LastIndexOf('>'))
                {
                    // Find the last complete tag
                    var lastCompleteTag = chunk.LastIndexOf('>');
                    if (lastCompleteTag > 0)
                    {
                        chunkLength = lastCompleteTag + 1;
                        chunk = content.Substring(i, chunkLength);
                        i = i + chunkLength - chunkSize; // Adjust index for next iteration
                    }
                }

                yield return new MarkupString(chunk);
            }
        }
    }
}