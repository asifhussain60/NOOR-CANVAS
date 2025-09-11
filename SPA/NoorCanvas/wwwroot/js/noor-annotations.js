// NOOR Canvas - Annotation System JavaScript Module
// Handles SVG-based real-time annotations for session content

window.NoorAnnotations = (function() {
    'use strict';

    let currentTool = 'select';
    let currentColor = '#ffff00';
    let isDrawing = false;
    let currentPath = '';
    let startPoint = null;
    let svgElement = null;
    let contentElement = null;

    // Initialize annotation system
    function initialize(containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('NOOR-ANNOTATION: Container not found:', containerId);
                return false;
            }

            svgElement = container.querySelector('.annotation-overlay');
            contentElement = container.querySelector('.content-container');

            if (!svgElement) {
                console.error('NOOR-ANNOTATION: SVG overlay not found in container');
                return false;
            }

            setupEventListeners();
            console.log('NOOR-ANNOTATION: Annotation system initialized for container:', containerId);
            return true;
        } catch (error) {
            console.error('NOOR-ANNOTATION: Error initializing annotation system:', error);
            return false;
        }
    }

    // Setup event listeners for annotation interactions
    function setupEventListeners() {
        if (!svgElement) return;

        // Mouse events for desktop
        svgElement.addEventListener('mousedown', handlePointerStart);
        svgElement.addEventListener('mousemove', handlePointerMove);
        svgElement.addEventListener('mouseup', handlePointerEnd);

        // Touch events for mobile
        svgElement.addEventListener('touchstart', handlePointerStart, { passive: false });
        svgElement.addEventListener('touchmove', handlePointerMove, { passive: false });
        svgElement.addEventListener('touchend', handlePointerEnd, { passive: false });

        // Selection events for highlight tool
        if (contentElement) {
            contentElement.addEventListener('mouseup', handleTextSelection);
        }

        console.log('NOOR-ANNOTATION: Event listeners setup complete');
    }

    // Handle pointer start (mouse down / touch start)
    function handlePointerStart(event) {
        if (currentTool === 'select') return;

        event.preventDefault();
        const point = getPointerPosition(event);
        startPoint = point;

        if (currentTool === 'drawing') {
            isDrawing = true;
            currentPath = `M${point.x},${point.y}`;
        } else if (currentTool === 'note') {
            createNoteAnnotation(point);
        }

        console.log('NOOR-ANNOTATION: Pointer start at', point, 'with tool', currentTool);
    }

    // Handle pointer move (mouse move / touch move)
    function handlePointerMove(event) {
        if (currentTool === 'select' || !isDrawing) return;

        event.preventDefault();
        const point = getPointerPosition(event);

        if (currentTool === 'drawing' && isDrawing) {
            currentPath += ` L${point.x},${point.y}`;
            updateDrawingPreview();
        }
    }

    // Handle pointer end (mouse up / touch end)
    function handlePointerEnd(event) {
        if (currentTool === 'select') return;

        event.preventDefault();
        const point = getPointerPosition(event);

        if (currentTool === 'highlight' && startPoint) {
            createHighlightAnnotation(startPoint, point);
        } else if (currentTool === 'drawing' && isDrawing) {
            createDrawingAnnotation();
        }

        // Reset drawing state
        isDrawing = false;
        currentPath = '';
        startPoint = null;
        removePreviewElements();

        console.log('NOOR-ANNOTATION: Pointer end, annotation created');
    }

    // Handle text selection for highlight tool
    function handleTextSelection(event) {
        if (currentTool !== 'highlight') return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = svgElement.getBoundingClientRect();

            const annotation = {
                type: 'highlight',
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top,
                width: rect.width,
                height: rect.height,
                color: currentColor,
                text: selection.toString(),
                createdAt: new Date().toISOString()
            };

            createAnnotation(annotation);
            selection.removeAllRanges();
            
            console.log('NOOR-ANNOTATION: Text selection highlight created:', annotation);
        } catch (error) {
            console.error('NOOR-ANNOTATION: Error creating highlight from selection:', error);
        }
    }

    // Get pointer position relative to SVG
    function getPointerPosition(event) {
        const rect = svgElement.getBoundingClientRect();
        const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
        const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // Create highlight annotation
    function createHighlightAnnotation(start, end) {
        const annotation = {
            type: 'highlight',
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
            color: currentColor,
            createdAt: new Date().toISOString()
        };

        createAnnotation(annotation);
    }

    // Create drawing annotation
    function createDrawingAnnotation() {
        if (!currentPath) return;

        const annotation = {
            type: 'drawing',
            path: currentPath,
            color: currentColor,
            strokeWidth: 2,
            createdAt: new Date().toISOString()
        };

        createAnnotation(annotation);
    }

    // Create note annotation
    function createNoteAnnotation(point) {
        const annotation = {
            type: 'note',
            x: point.x,
            y: point.y,
            color: currentColor,
            text: 'Note', // TODO: Add note editing dialog
            createdAt: new Date().toISOString()
        };

        createAnnotation(annotation);
    }

    // Generic annotation creation
    function createAnnotation(annotationData) {
        try {
            // Call C# method via DotNet interop
            if (window.DotNet && window.DotNet.invokeMethodAsync) {
                window.DotNet.invokeMethodAsync('NoorCanvas', 'CreateAnnotation', annotationData)
                    .then(result => {
                        console.log('NOOR-ANNOTATION: Annotation created successfully:', result);
                    })
                    .catch(error => {
                        console.error('NOOR-ANNOTATION: Error creating annotation:', error);
                    });
            } else {
                console.warn('NOOR-ANNOTATION: DotNet interop not available, annotation not persisted');
            }

            // Broadcast via SignalR if available
            if (window.NoorSignalR && window.NoorSignalR.broadcastAnnotation) {
                window.NoorSignalR.broadcastAnnotation(annotationData);
            }

        } catch (error) {
            console.error('NOOR-ANNOTATION: Error in createAnnotation:', error);
        }
    }

    // Update drawing preview
    function updateDrawingPreview() {
        removePreviewElements();

        const preview = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        preview.setAttribute('d', currentPath);
        preview.setAttribute('stroke', currentColor);
        preview.setAttribute('stroke-width', '2');
        preview.setAttribute('fill', 'none');
        preview.setAttribute('class', 'annotation-preview');
        preview.setAttribute('opacity', '0.7');

        svgElement.appendChild(preview);
    }

    // Remove preview elements
    function removePreviewElements() {
        const previews = svgElement.querySelectorAll('.annotation-preview');
        previews.forEach(preview => preview.remove());
    }

    // Set current annotation tool
    function setTool(tool) {
        currentTool = tool;
        console.log('NOOR-ANNOTATION: Tool changed to:', tool);
        
        // Update SVG pointer events
        if (svgElement) {
            svgElement.style.pointerEvents = tool === 'select' ? 'none' : 'auto';
        }
    }

    // Set current annotation color
    function setColor(color) {
        currentColor = color;
        console.log('NOOR-ANNOTATION: Color changed to:', color);
    }

    // Clear all annotations
    function clearAll() {
        try {
            const annotations = svgElement.querySelectorAll('[data-annotation-id]');
            annotations.forEach(annotation => annotation.remove());
            
            console.log('NOOR-ANNOTATION: All annotations cleared');
            
            // Notify C# component
            if (window.DotNet && window.DotNet.invokeMethodAsync) {
                window.DotNet.invokeMethodAsync('NoorCanvas', 'ClearAllAnnotations');
            }
        } catch (error) {
            console.error('NOOR-ANNOTATION: Error clearing annotations:', error);
        }
    }

    // Public API
    return {
        initialize: initialize,
        setTool: setTool,
        setColor: setColor,
        clearAll: clearAll,
        createAnnotation: createAnnotation
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('NOOR-ANNOTATION: JavaScript module loaded and ready');
});
