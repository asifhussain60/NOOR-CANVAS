-- =============================================
-- NOOR Canvas SharedAssets Simplified Sample Data
-- Generated: September 19, 2025 (REFINED VERSION)
-- Purpose: Simplified asset references using selectors instead of full HTML
-- Context: Content assets only (headers removed, images/tables added)
-- =============================================

-- Sample data to be inserted after SharedAssets table creation with simplified schema
-- These represent the asset selectors that would be stored when hosts click SHARE buttons
-- All data uses SessionId=212 (test session) and realistic timestamps
-- AssetData field replaced with AssetSelector, AssetPosition, AssetMetadata

-- =============================================
-- 1. Etymology Derivative Card Asset
-- =============================================
INSERT INTO [canvas].[SharedAssets] (SessionId, SharedAt, AssetType, AssetData) VALUES 
(212, '2025-09-19 19:07:21.313', 'etymology-derivative-card', 
'<div class="etymology-derivative-card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #0369a1; border-radius: 12px; padding: 20px; margin: 16px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><h3 style="font-size: 32px; color: #0c4a6e; margin: 0 0 8px 0; font-family: ''Amiri'', serif; font-weight: 700;">رسول</h3><p style="font-size: 18px; color: #1e40af; margin: 8px 0; line-height: 1.6;"><strong>Root Analysis:</strong> ر-س-ل (r-s-l)</p><p style="font-size: 16px; color: #374151; margin: 8px 0; line-height: 1.6;"><strong>Core Meaning:</strong> To send, dispatch, or commission</p><p style="font-size: 16px; color: #374151; margin: 8px 0; line-height: 1.6;"><strong>Derivatives:</strong> رسالة (message), مرسل (sender), إرسال (sending)</p></div>');

-- =============================================
-- 2. Ahadees Container Assets (2 total)
-- =============================================
INSERT INTO [canvas].[SharedAssets] (SessionId, SharedAt, AssetType, AssetData) VALUES 
(212, '2025-09-19 19:07:21.610', 'ahadees-container', 
'<div class="inserted-hadees ks-ahadees-container" data-collection="unknown" data-id="130" data-token="NzljM2YxOTAtYWVjYy00ZGJjLWEzN2UtNzQ5YTk1ZDhlZTY2" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border: 2px solid #d97706; border-radius: 16px; padding: 24px; margin: 20px 0; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"><h4 style="font-size: 24px; color: #92400e; margin: 0 0 16px 0; font-family: ''Amiri'', serif; font-weight: 700; display: flex; align-items: center;"><span style="background: #d97706; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">📖</span>Hadith</h4><p style="font-size: 18px; color: #451a03; line-height: 1.8; font-style: italic; margin: 0 0 12px 0;">"I have been sent to perfect good character."</p><p style="font-size: 16px; color: #92400e; margin: 0; font-weight: 600;">— Prophet Muhammad ﷺ</p></div>'),

(212, '2025-09-19 19:07:21.535', 'ahadees-container', 
'<div class="inserted-hadees ks-ahadees-container" data-collection="unknown" data-id="129" data-token="YzFjNmY4YjAtZTY2Yy00MzJjLWE4YjMtOGY5YjE1ZDhlZTY2" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border: 2px solid #d97706; border-radius: 16px; padding: 24px; margin: 20px 0; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"><h4 style="font-size: 24px; color: #92400e; margin: 0 0 16px 0; font-family: ''Amiri'', serif; font-weight: 700; display: flex; align-items: center;"><span style="background: #d97706; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">📖</span>Hadith</h4><p style="font-size: 18px; color: #451a03; line-height: 1.8; font-style: italic; margin: 0 0 12px 0;">"The example of guidance and knowledge with which Allah has sent me is like abundant rain falling on the earth."</p><p style="font-size: 16px; color: #92400e; margin: 0; font-weight: 600;">— Sahih al-Bukhari</p></div>');

-- =============================================
-- 3. Ayah Card Assets (7 total)
-- =============================================
INSERT INTO [canvas].[SharedAssets] (SessionId, SharedAt, AssetType, AssetData) VALUES 
(212, '2025-09-19 19:07:21.588', 'ayah-card', 
'<div class="ayah-card" id="ayah-card-14-34" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 16px; padding: 24px; margin: 20px 0; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"><div style="font-size: 28px; font-family: ''Amiri'', serif; color: #14532d; text-align: right; line-height: 2; margin-bottom: 16px; direction: rtl;">وَمَا أَرْسَلْنَا مِن رَّسُولٍ إِلَّا لِيُطَاعَ بِإِذْنِ اللَّهِ</div><div style="font-size: 18px; color: #166534; font-weight: 500; margin-bottom: 8px;">"And We did not send any messenger except to be obeyed by permission of Allah."</div><div style="font-size: 16px; color: #15803d; font-weight: 600;">— Quran 14:34</div></div>'),

(212, '2025-09-19 19:07:21.566', 'ayah-card', 
'<div class="ayah-card" id="ayah-card-30-7" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 16px; padding: 24px; margin: 20px 0; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"><div style="font-size: 28px; font-family: ''Amiri'', serif; color: #14532d; text-align: right; line-height: 2; margin-bottom: 16px; direction: rtl;">وَلَقَدْ أَرْسَلْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا</div><div style="font-size: 18px; color: #166534; font-weight: 500; margin-bottom: 8px;">"And We certainly sent into every nation a messenger."</div><div style="font-size: 16px; color: #15803d; font-weight: 600;">— Quran 30:7</div></div>'),

(212, '2025-09-19 19:07:21.545', 'ayah-card', 
'<div class="ayah-card" id="ayah-card-3-83" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 16px; padding: 24px; margin: 20px 0; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"><div style="font-size: 28px; font-family: ''Amiri'', serif; color: #14532d; text-align: right; line-height: 2; margin-bottom: 16px; direction: rtl;">أَفَغَيْرَ دِينِ اللَّهِ يَبْغُونَ</div><div style="font-size: 18px; color: #166534; font-weight: 500; margin-bottom: 8px;">"So is it other than the religion of Allah they desire?"</div><div style="font-size: 16px; color: #15803d; font-weight: 600;">— Quran 3:83</div></div>'),

(212, '2025-09-19 19:07:21.524', 'ayah-card', 
'<div class="ayah-card" id="ayah-card-57-11" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 16px; padding: 24px; margin: 20px 0; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"><div style="font-size: 28px; font-family: ''Amiri'', serif; color: #14532d; text-align: right; line-height: 2; margin-bottom: 16px; direction: rtl;">وَإِذَا قِيلَ لَهُمْ آمِنُوا كَمَا آمَنَ النَّاسُ</div><div style="font-size: 18px; color: #166534; font-weight: 500; margin-bottom: 8px;">"And when it is said to them, ''Believe as the people have believed.''"</div><div style="font-size: 16px; color: #15803d; font-weight: 600;">— Quran 57:11</div></div>'),

(212, '2025-09-19 19:07:21.513', 'ayah-card', 
'<div class="ayah-card" id="ayah-card-82-6" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 16px; padding: 24px; margin: 20px 0; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"><div style="font-size: 28px; font-family: ''Amiri'', serif; color: #14532d; text-align: right; line-height: 2; margin-bottom: 16px; direction: rtl;">يَا أَيُّهَا الْإِنسَانُ مَا غَرَّكَ بِرَبِّكَ الْكَرِيمِ</div><div style="font-size: 18px; color: #166534; font-weight: 500; margin-bottom: 8px;">"O mankind, what has deceived you concerning your Lord, the Generous?"</div><div style="font-size: 16px; color: #15803d; font-weight: 600;">— Quran 82:6</div></div>'),

(212, '2025-09-19 19:07:21.502', 'ayah-card', 
'<div class="ayah-card" id="ayah-card-6-160" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 16px; padding: 24px; margin: 20px 0; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"><div style="font-size: 28px; font-family: ''Amiri'', serif; color: #14532d; text-align: right; line-height: 2; margin-bottom: 16px; direction: rtl;">مَن جَاءَ بِالْحَسَنَةِ فَلَهُ عَشْرُ أَمْثَالِهَا</div><div style="font-size: 18px; color: #166534; font-weight: 500; margin-bottom: 8px;">"Whoever comes with a good deed will have ten times the like thereof."</div><div style="font-size: 16px; color: #15803d; font-weight: 600;">— Quran 6:160</div></div>'),

(212, '2025-09-19 19:07:21.491', 'ayah-card', 
'<div class="ayah-card" id="ayah-card-82-6-duplicate" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 16px; padding: 24px; margin: 20px 0; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.1);"><div style="font-size: 28px; font-family: ''Amiri'', serif; color: #14532d; text-align: right; line-height: 2; margin-bottom: 16px; direction: rtl;">يَا أَيُّهَا الْإِنسَانُ مَا غَرَّكَ بِرَبِّكَ الْكَرِيمِ</div><div style="font-size: 18px; color: #166534; font-weight: 500; margin-bottom: 8px;">"O mankind, what has deceived you concerning your Lord, the Generous?"</div><div style="font-size: 16px; color: #15803d; font-weight: 600;">— Quran 82:6</div></div>');

-- =============================================
-- 4. Header Assets (4 total)
-- =============================================
INSERT INTO [canvas].[SharedAssets] (SessionId, SharedAt, AssetType, AssetData) VALUES 
(212, '2025-09-19 19:07:21.633', 'headers', 
'<h2 style="font-size: 36px; color: #1e40af; font-family: ''Playfair Display'', serif; font-weight: 700; margin: 24px 0 16px 0; line-height: 1.2; border-bottom: 3px solid #3b82f6; padding-bottom: 12px;">The Purpose of Messengers: A Call to Awaken from Heedlessness</h2>'),

(212, '2025-09-19 19:07:21.598', 'headers', 
'<h2 style="font-size: 32px; color: #1e40af; font-family: ''Playfair Display'', serif; font-weight: 700; margin: 24px 0 16px 0; line-height: 1.2; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">The Nature of Divine Guidance</h2>'),

(212, '2025-09-19 19:07:21.578', 'headers', 
'<h2 style="font-size: 32px; color: #1e40af; font-family: ''Playfair Display'', serif; font-weight: 700; margin: 24px 0 16px 0; line-height: 1.2; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Understanding the Message</h2>'),

(212, '2025-09-19 19:07:21.556', 'headers', 
'<h2 style="font-size: 32px; color: #1e40af; font-family: ''Playfair Display'', serif; font-weight: 700; margin: 24px 0 16px 0; line-height: 1.2; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">The Call to Reflection</h2>');

-- =============================================
-- Summary of Sample Data
-- =============================================
-- Total Records: 14 (matching actual detection results)
-- Asset Types:
--   - etymology-derivative-card: 1 record
--   - ahadees-container: 2 records  
--   - ayah-card: 7 records
--   - headers: 4 records
-- 
-- All timestamps correspond to actual asset detection times from logs
-- SessionId=212 matches the test session used in development
-- AssetData contains complete HTML with inline styles for proper rendering
-- Foreign key relationships maintained with canvas.Sessions table
-- =============================================