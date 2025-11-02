Asset Detection & Transformation Logic Flow
1. Asset Detection Phase
System scans the session transcript HTML for sharable content (ayah cards, hadith, poetry, etc.)
Uses AssetLookup database definitions with CSS selectors to identify each asset type
Each detected asset gets assigned a unique ID like asset-ayah-card-1, asset-hadith-2, etc.
Assets are counted and categorized by type
2. HTML Transformation Phase
Original transcript HTML is processed by TranscriptProcessingService
Removes host-only elements (delete buttons, internal markers)
Cleans up any leftover data attributes that shouldn't be shared
Media URLs (images, audio, video) are transformed to work for participants
Safe HTML rendering is applied to prevent security issues
3. Share Button Injection Phase
For each detected asset, a card wrapper is created with header and body sections
Wrapper div uses modern, clean styling with subtle colors (soft grays, light borders, rounded corners)
Each wrapper div is assigned a unique ID (e.g., wrapper-asset-ayah-card-1) for mapping purposes
Wrapper header displays the asset type label (left-justified) such as "Ayah Card", "Hadith", "Poetry"
Wrapper body contains the actual detected asset HTML with proper padding and background
FAB-styled share button is positioned on the right side of the wrapper header
Each FAB button has unique ID matching the asset (e.g., btn-asset-ayah-card-1)
Button stores data attributes linking it to both wrapper ID and contained asset ID
Buttons are styled as circular/rounded icons with hover effects and subtle shadows
Buttons are only injected when session status is "Active"
4. Button Click Handler Setup
When host clicks a FAB button, JavaScript captures the click event
JavaScript reads the button's data-asset-id attribute to identify the target asset
Handler traverses from button to wrapper div, then locates the asset div in the wrapper body
System queries the actual asset element (not the wrapper) using the asset ID
Asset HTML is cloned for processing before broadcast
All buttons, clickable elements, and wrapper styling are stripped from the cloned content
JavaScript calls back to C# ShareAsset method with cleaned asset HTML
Event payload includes: asset ID, asset type, and sanitized HTML content
5. Broadcast Preparation
Extracted asset HTML is further transformed for participant view
Host-specific controls are removed completely
Content is wrapped in participant-friendly styling
Asset is packaged with metadata (type, timestamp, session ID)
6. SignalR Broadcast
Host's SignalR connection sends the processed asset to all participants
Broadcast targets the session group (e.g., session_212)
Participants receive the asset and display it on their SessionCanvas
Host sees confirmation toast notification
7. Participant Display
Participants' browsers receive the SignalR message
Asset HTML is rendered in their canvas area
Proper Islamic styling is applied (green gradients, Arabic fonts)
Participants see the same content the host shared, but without host controls
Key Principle: Host sees editing/sharing controls → Transformation removes these → Participants see clean, read-only content

Claude Sonnet 4.5 • 1x