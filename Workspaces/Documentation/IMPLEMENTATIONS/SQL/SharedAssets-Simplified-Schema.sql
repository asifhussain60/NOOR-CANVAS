-- =============================================
-- NOOR Canvas SharedAssets Simplified Schema & Sample Data
-- Generated: September 19, 2025 (REFINED VERSION)
-- Purpose: Selector-based asset storage instead of full HTML blobs
-- Context: Content assets only (etymology, ahadees, ayah, images, tables)
-- =============================================

-- =============================================
-- Updated SharedAssets Table Schema
-- =============================================
-- Run this after the initial migration to add new columns
ALTER TABLE [canvas].[SharedAssets] 
ADD [AssetSelector] nvarchar(500) NULL,
    [AssetPosition] int NULL,
    [AssetMetadata] nvarchar(max) NULL;

-- Create index for efficient selector lookups
CREATE INDEX [IX_SharedAssets_TypeSelector] ON [canvas].[SharedAssets] ([AssetType], [AssetSelector]);

-- =============================================
-- Simplified Sample Data (Selector-Based)
-- =============================================

-- 1. Etymology Derivative Card Assets (1 total)
INSERT INTO [canvas].[SharedAssets] (SessionId, SharedAt, AssetType, AssetSelector, AssetPosition, AssetMetadata) VALUES 
(212, '2025-09-19 19:07:21.313', 'etymology-derivative-card', 'etymology-card-1', 1, '{"arabicWord": "رسول", "root": "ر-س-ل", "meaning": "messenger"}');

-- 2. Ahadees Container Assets (2 total)
INSERT INTO [canvas].[SharedAssets] (SessionId, SharedAt, AssetType, AssetSelector, AssetPosition, AssetMetadata) VALUES 
(212, '2025-09-19 19:07:21.610', 'ahadees-container', 'hadees-130', 1, '{"collection": "unknown", "hadithId": "130", "theme": "character"}'),
(212, '2025-09-19 19:07:21.535', 'ahadees-container', 'hadees-129', 2, '{"collection": "bukhari", "hadithId": "129", "theme": "guidance"}');

-- 3. Ayah Card Assets (7 total) 
INSERT INTO [canvas].[SharedAssets] (SessionId, SharedAt, AssetType, AssetSelector, AssetPosition, AssetMetadata) VALUES 
(212, '2025-09-19 19:07:21.588', 'ayah-card', 'ayah-card-14-34', 1, '{"surah": 14, "ayah": 34, "theme": "messengers"}'),
(212, '2025-09-19 19:07:21.566', 'ayah-card', 'ayah-card-30-7', 2, '{"surah": 30, "ayah": 7, "theme": "universal-guidance"}'),
(212, '2025-09-19 19:07:21.545', 'ayah-card', 'ayah-card-3-83', 3, '{"surah": 3, "ayah": 83, "theme": "religion-of-allah"}'),
(212, '2025-09-19 19:07:21.524', 'ayah-card', 'ayah-card-57-11', 4, '{"surah": 57, "ayah": 11, "theme": "belief"}'),
(212, '2025-09-19 19:07:21.513', 'ayah-card', 'ayah-card-82-6', 5, '{"surah": 82, "ayah": 6, "theme": "human-nature"}'),
(212, '2025-09-19 19:07:21.502', 'ayah-card', 'ayah-card-6-160', 6, '{"surah": 6, "ayah": 160, "theme": "good-deeds"}'),
(212, '2025-09-19 19:07:21.491', 'ayah-card', 'ayah-card-82-6-duplicate', 7, '{"surah": 82, "ayah": 6, "theme": "human-nature", "duplicate": true}');

-- 4. Image Assets (Sample - would be detected when present)
INSERT INTO [canvas].[SharedAssets] (SessionId, SharedAt, AssetType, AssetSelector, AssetPosition, AssetMetadata) VALUES 
(212, '2025-09-19 19:08:15.123', 'image-asset', 'img-calligraphy-1', 1, '{"src": "/content/calligraphy/basmala.png", "alt": "Basmala Calligraphy", "type": "calligraphy"}'),
(212, '2025-09-19 19:09:22.456', 'image-asset', 'img-map-1', 2, '{"src": "/content/maps/mecca-medina.jpg", "alt": "Mecca to Medina Route", "type": "historical-map"}');

-- 5. Table Assets (Sample - would be detected when present)  
INSERT INTO [canvas].[SharedAssets] (SessionId, SharedAt, AssetType, AssetSelector, AssetPosition, AssetMetadata) VALUES 
(212, '2025-09-19 19:10:33.789', 'table-asset', 'table-prophets-comparison', 1, '{"class": "comparison-table", "topic": "prophets-comparison", "columns": 4}'),
(212, '2025-09-19 19:11:44.012', 'table-asset', 'table-prayer-times', 2, '{"class": "islamic-table", "topic": "prayer-schedule", "columns": 3}');

-- =============================================
-- Asset Type Summary (Refined)
-- =============================================
-- Total Records: 13 (headers removed, images/tables added)
-- Asset Types:
--   - etymology-derivative-card: 1 record
--   - ahadees-container: 2 records  
--   - ayah-card: 7 records
--   - image-asset: 2 records (NEW)
--   - table-asset: 2 records (NEW)
--   - headers: REMOVED (not content assets)
-- 
-- Benefits of Selector-Based Approach:
--   - Storage: 50-500 chars vs 2000+ char HTML blobs  
--   - Performance: Faster queries and network transfers
--   - Flexibility: Dynamic styling without stored data updates
--   - Uniqueness: Smart selectors handle multiple instances
-- =============================================

-- =============================================
-- Asset Selector Patterns Explained
-- =============================================
/*
ETYMOLOGY CARDS:
- Pattern: etymology-card-{position}
- Example: "etymology-card-1"
- Detection: class="etymology-derivative-card"

AHADEES CONTAINERS:  
- Pattern: hadees-{data-id} or hadees-{position}
- Example: "hadees-130" (using data-id="130")
- Detection: class="inserted-hadees ks-ahadees-container" with data-id extraction

AYAH CARDS:
- Pattern: ayah-card-{surah}-{ayah} (existing IDs)  
- Example: "ayah-card-14-34" 
- Detection: class="ayah-card" id="ayah-card-14-34"

IMAGE ASSETS:
- Pattern: img-{type}-{position}
- Example: "img-calligraphy-1", "img-map-1"  
- Detection: <img> tags with src attribute
- Metadata: Stores src, alt, image type

TABLE ASSETS:
- Pattern: table-{topic} or table-{class}-{position}
- Example: "table-prophets-comparison"
- Detection: class="islamic-table|comparison-table|content-table"  
- Metadata: Stores table class, topic, column count
*/

-- =============================================
-- JavaScript Client-Side Highlighting Logic
-- =============================================
/*
function highlightSharedAsset(assetType, assetSelector) {
    let targetElement = null;
    
    switch (assetType) {
        case 'etymology-derivative-card':
            // Find by position in etymology cards
            const etymologyCards = document.querySelectorAll('.etymology-derivative-card');
            const etymologyIndex = parseInt(assetSelector.replace('etymology-card-', '')) - 1;
            targetElement = etymologyCards[etymologyIndex];
            break;
            
        case 'ahadees-container':
            // Find by data-id or position
            if (assetSelector.startsWith('hadees-')) {
                const hadeesId = assetSelector.replace('hadees-', '');
                targetElement = document.querySelector(`[data-id="${hadeesId}"]`) ||
                              document.querySelectorAll('.inserted-hadees')[parseInt(hadeesId) - 1];
            }
            break;
            
        case 'ayah-card':
            // Find by existing ID
            targetElement = document.getElementById(assetSelector);
            break;
            
        case 'image-asset':
            // Find by position in images
            const images = document.querySelectorAll('img');
            const imageIndex = parseInt(assetSelector.match(/\d+$/)[0]) - 1;
            targetElement = images[imageIndex];
            break;
            
        case 'table-asset':
            // Find by class or position
            const tables = document.querySelectorAll('table.islamic-table, table.comparison-table, table.content-table');
            const tableIndex = parseInt(assetSelector.match(/\d+$/)?.[0] || '1') - 1;
            targetElement = tables[tableIndex];
            break;
    }
    
    if (targetElement) {
        // Apply highlighting
        targetElement.style.outline = '3px solid #ff6b6b';
        targetElement.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
*/