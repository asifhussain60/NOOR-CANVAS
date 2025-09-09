# NOOR CANVAS — Final Journeys + Canonical Asset & Self-Contained Styles

## HOST Journey (Host = Admin, single operator)

### 1) Select & Begin
- Open **NOOR-CANVAS** → pick **Album → Category → Session** (loads the full HTML transcript from `KSESSIONS_DEV.SessionTranscripts.Transcript`).
- Click **BEGIN SESSION**:
  - System mints a **session GUID** (valid ≤ **3 hours** or until you end).
  - A **Host capability token** is issued and scoped to this session.
  - Participants land in **Waiting**; you go directly to the **Host Console** (Transcript + Toolbar). You can still see waiting stats in a small panel.

### 2) Share from the Transcript (no pre-parsing)
- The original HTML **does not** contain Share controls; the app **injects** a **“Share” overlay button (centered at the top)** on each recognizable asset block (`.ayah-card`, hadith, etymology, poetry, image, etc.).
- On **Share**:
  1) We capture that block’s `outerHTML`.
  2) Sanitize server-side.
  3) Broadcast to all participants via SignalR.
- Participants see the **exact styled block** (our local, bundled CSS reproduces the Beautiful Islam look — no runtime dependency).

### 3) Share Timer (host-only)
- A **per-share timer** starts (default **3 minutes**).  
- You can **override on the fly** (No timer / 30s / 1m / 3m / 5m).  
- **Timer is not shown to participants.**  
- On expiry, participants switch to **Waiting** (minimal, unobtrusive).

### 4) Live Annotations (how it works on the web)
- **Overlay architecture:** render the shared HTML; mount an **SVG overlay** above it (Canvas as fallback).
- **Tools:** Laser pointer (transient dots), Underline, Box, Arrow, Pen, **Text Highlight** (RTL-aware via DOM Range serialization: XPath + offsets).  
- **UX details:** Shift = straight lines; Ctrl+Z / Ctrl+Y undo/redo; Eraser/clear; theme-aware colors (2–3) and two weights.  
- **Sync:** Vector ops are throttled/coalesced and sent via SignalR (~45 Hz while drawing); round-trip target ≤**100ms** median.  
- **Lifecycle:** Annotations exist **only while that asset is shared**; they clear on Next/Waiting.

### 5) Q&A moderation (with reorder)
- Q&A panel (host view): **pin**, **hide**, **mark answered**, and **drag-to-reorder** questions.
- Asker identity visible to Host; anonymized for participants.
- All questions (text + who asked) are **saved in the DB**.

### 6) Roster & Join Control
- Host-only roster shows name, country, join time.
- **Kick** (can rejoin) or **Ban** (cannot rejoin during this session, even with the valid GUID). Logged to `AuditLog`.
- Ban keys off `registration_id` + fingerprint/IP hashes to prevent trivial rejoin.

### 7) End Session → Conclusion
- Click **End Session** (confirm).  
- Participants transition to a **Conclusion** screen: *“Thank you for attending”* + a short, reflective Islamic text (calm, minimal), with optional next steps.  
- The session GUID becomes invalid; late joiners see the error page.

---

## USER Journey (Participant)

### 1) Registration → Waiting
- Follows the session link → **Registration** (name, country, optional city) → **Waiting**.  
- Waiting is **subtle and calm** (soft background; minimal text). No quotes/rotators here to avoid distraction.

### 2) Canvas (Live Session)
- When the Host begins, the user **exits Waiting** into the **Canvas screen**:
  - A header with **session metadata** (title, short description, status).  
  - A **whiteboard/canvas area** — visually styled like a gentle whiteboard/card where shared assets appear.
- When the Host shares, the asset fades into this area, styled exactly as intended (via our local bundle).
- Host **highlights/marks** appear in real time.

### 3) Between Shares
- If the Host clears or timer expires, the whiteboard shows a **small, unobtrusive “Waiting…” card** (respecting prefers-reduced-motion). No quotes here.

### 4) Q&A (persisted with asker)
- Participant can submit and upvote.  
- **DB persistence:** store question + `registration_id` (asker).  
- Anonymized in the participant list; identity visible only to Host.

### 5) Conclusion
- Smooth transition to **“Thank you for attending”** with a short, reflective line; optional link(s) as configured.

---

## Canonical Asset HTML (what the Host shares)

```html

<div class="ayah-card" id="ayah-card-4-30">
    <div class="golden-surah-header clickable-ayah-header" data-ayats="30" data-original-token="Q|4:30" data-surah="4" id="ayah-header-4-30"><span>Women (4:30)</span></div>
    <p class="ayah-arabic">&rlm; &rlm;وَمَن يَفْعَلْ ذَلكَ عُدْوَنًۭا وَظُلْمًۭا فَسَوْفَ نُصْليه نَارًۭا وَكَانَ ذَلكَ عَلَى ٱللَّه يَسيرًا &lrm; <img class="ayah-number-img fr-fic fr-dii" src="https://myislam.sfo3.digitaloceanspaces.com/assets/2024/03/ayat/ayah-30.png" alt="30">&nbsp;&lrm;</p>
    <div class="translation-header">Translation:.</div>
    <p class="ayah-translation">And whoever does that in aggression and injustice-then we will drive him into a fire. And that, for Allah, is [always] easy.</p>
</div>
<div class="ayah-card" id="ayah-card-5-30-32">
    <div class="golden-surah-header clickable-ayah-header" data-ayats="30-32" data-original-token="Q|5:30-32" data-surah="5" id="ayah-header-5-30-32"><span>The Table Spread (5:30-32).</span></div>
    <p class="ayah-arabic">&rlm; &rlm;فَطَوَّعَتْ لَهُ نَفْسُهُ قَتْلَ أَخيه فَقَتَلَهُ فَأَصْبَحَ منَ ٱلْخَسرينَ &lrm; <img class="ayah-number-img fr-fic fr-dii" src="https://myislam.sfo3.digitaloceanspaces.com/assets/2024/03/ayat/ayah-30.png" alt="30"> &rlm;فَبَعَثَ ٱللَّهُ غُرَابًۭا يَبْحَثُ فى ٱلْأَرْض ليُريَهُ كَيْفَ يُوَرى سَوْءَةَ أَخيه قَالَ يَوَيْلَتَىٰ أَعَجَزْتُ أَنْ أَكُونَ مثْلَ هَذَا ٱلْغُرَاب فَأُوَرىَ سَوْءَةَ أَخى ۖ فَأَصْبَحَ منَ ٱلنَّدمينَ &lrm; <img class="ayah-number-img fr-fic fr-dii" src="https://myislam.sfo3.digitaloceanspaces.com/assets/2024/03/ayat/ayah-31.png" alt="31"> &rlm;منْ أَجْل ذَلكَ كَتَبْنَا عَلَىٰ بَنى إسْرَءيلَ أَنَّهُ مَن قَتَلَ نَفْسًۢا بغَيْر نَفْسٍ أَوْ فَسَادٍۢ فى ٱلْأَرْض فَكَأَنَّمَا قَتَلَ ٱلنَّاسَ جَميعًۭا وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا ٱلنَّاسَ جَميعًۭا وَلَقَدْ جَاءَتْهُمْ رُسُلُنَا بٱلْبَيّنَت ثُمَّ إنَّ كَثيرًۭا مّنْهُم بَعْدَ ذَلكَ فى ٱلْأَرْض لَمُسْرفُونَ &lrm; <img class="ayah-number-img fr-fic fr-dii" src="https://myislam.sfo3.digitaloceanspaces.com/assets/2024/03/ayat/ayah-32.png" alt="32">&nbsp;&lrm;</p>
    <div class="translation-header">Translation:.</div>
    <p class="ayah-translation">And his soul permitted to him the murder of his brother, so he killed him and became among the losers. (30) Then Allah sent a crow searching in the ground to show him how to hide the disgrace of his brother. He said, &quot;O woe to me! Have I failed to be like this crow and hide the body of my brother?&quot; And he became of the regretful. (31) Because of that, We decreed upon the Children of Israel that whoever kills a soul unless for a soul or for corruption [done] in the land-it is as if he had slain mankind entirely. And whoever saves one-it is as if he had saved mankind entirely. And our messengers had certainly come to them with clear proofs. Then indeed many of them, [even] after that, throughout the land, were transgressors. (32).</p>
</div>
<p>
    <br>
</p>
<div class="inserted-hadees ks-ahadees-container" data-collection="unknown" data-id="128" data-token="H|128" data-type="hadees" id="ahadees-1757439211286-522">
    <button class="delete-hadees-btn ks-ahadees-delete-btn" data-ahadees-id="ahadees-1757439211286-522" title="Delete this hadees">✕</button>
    <div class="hadees-header ks-ahadees-header">
        <h4><i class="fa fa-comment ks-ahadees-header-icon" aria-hidden="true"></i>Ali Ibn Abu Talib<span class="ks-ahadees-subject">- Human Potential, Universe, Macrocosm</span></h4>
    </div>
    <div class="hadees-arabic ks-ahadees-arabic">وَ تَحْسَبُ أَنَّكَ&rlm; جِرْمٌ&rlm; صَغِيرٌ وَ فِيكَ انْطَوَى الْعَالَمُ الْأَكْبَرُ</div>
    <div class="hadees-english ks-ahadees-english">You may see yourself as insignificant, but inside you lies the most incredible universe.</div>
</div>
<p>
    <br>
</p>
<div class="etymology-derivative-card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #7dd3fc; border-radius: 12px; padding: 16px; margin: 12px 0; text-align: center; max-width: 400px; display: inline-block;">
    <div class="derivative-root-reference" style="margin-bottom: 12px; padding: 8px; background: rgba(125, 211, 252, 0.2); border-radius: 8px;">
        <div style="font-size: 14px; color: #0284c7; font-weight: 600; margin-bottom: 4px;">Root: علم</div>
        <div style="font-size: 12px; color: #0369a1; font-style: italic;">knowledge</div>
    </div>
    <div class="derivative-main-display" style="margin-bottom: 12px;">
        <h3 style="font-size: 32px; color: #0c4a6e; margin: 0 0 8px 0; font-family: 'Amiri', serif; font-weight: 700;">عالم</h3>
        <p style="font-size: 14px; color: #0369a1; margin: 0 0 4px 0; font-style: italic;">(ALIM)</p>
        <p style="font-size: 16px; color: #075985; margin: 0; font-family: 'Lora', serif; font-weight: 500; line-height: 1.4;">One having knowledge, scholar</p>
    </div>
    <div style="font-size: 11px; color: #0284c7; font-style: italic;">Etymology &bull; 9/9/2025</div>
</div>
<p>
    <br>
</p>
<div class="poetry-wrapper" data-content-type="poetry" data-id="d2cc2e99588a4f1c887f62fafe4dc936" data-language="bilingual" data-poet="Anonymous" data-type="poetry">
    <div class="poetry-section froala-poetry-container" data-original-text="وما توفيق إلا باللّٰہ
And my success/divine help is only with Allah">
        <div class="poetry-poet-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; color: #722727; font-weight: bold; font-size: 1.2em;"><i class="fa fa-feather" style="margin-right: 8px; color: #5c726a;" aria-hidden="true"></i>Anonymous</h4>
            <button class="btn btn-sm btn-primary poetry-restore-btn froala-only-btn" title="Remove poetry formatting and restore plain text" type="button">&nbsp;<i class="fa fa-undo" style="margin-right: 5px;" aria-hidden="true"></i>Plain Text&nbsp;</button>
        </div>
        <div class="row">
            <div class="col-xs-12">
                <div class="poetry-couplet">
                    <p class="h3 arabic-text text-center text-maroon" dir="rtl" style="margin-bottom: 5px;">وما توفيق إلا باللّٰہ</p>
                    <p class="text-center text-muted" dir="ltr" style="font-size: 2rem; margin: 0;">And my success/divine help is only with Allah</p>
                </div>
            </div>
        </div>
    </div>
</div>
<p>
    <br>
</p>
<p><img src="Resources/IMAGES/211/51ab58b2-8ccb-4c74-8a4d-4e55078cea62.jpg" style="width: 300px;" class="fr-fic fr-dib imgResponsive fr-bordered" data-type="image" data-image-id="51ab58b2-8ccb-4c74-8a4d-4e55078cea62" data-session-id="211" data-insertion-id="e872f3d9-591a-4b32-969e-cbdc3d6c1b7d" data-content-type="image"></p>
<p>
    <br>
</p>
<table style="width: 100%;">
    <thead>
        <tr>
            <th>
                <br>
            </th>
            <th>
                <br>
            </th>
            <th>
                <br>
            </th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="width: 33.3333%;">TEST</td>
            <td style="width: 33.3333%;">
                <br>
            </td>
            <td style="width: 33.3333%;">
                <br>
            </td>
        </tr>
        <tr>
            <td style="width: 33.3333%;">
                <br>
            </td>
            <td style="width: 33.3333%;">
                <br>
            </td>
            <td style="width: 33.3333%;">
                <br>
            </td>
        </tr>
    </tbody>
</table>

```

---

## Self-Contained Styling (no dependency on Beautiful Islam at runtime)

### What we will extract and localize
- **Source (one-time migration):**  
  `D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Content\styles\`
- **Selectors to support** (from the canonical sample & other known assets):
  - **Qur’an/ayah:** `.ayah-card`, `.golden-surah-header`, `.clickable-ayah-header`, `.ayah-arabic`, `.ayah-translation`, `.translation-header`, `.ayah-number-img`
  - **Hadith:** `.inserted-hadees`, `.ks-ahadees-container`, `.ks-ahadees-header`, `.ks-ahadees-subject`, `.ks-ahadees-arabic`, `.ks-ahadees-english`, `.ks-ahadees-header-icon`
  - **Etymology:** `.etymology-derivative-card`, `.derivative-root-reference`, `.derivative-main-display`
  - **Poetry:** `.poetry-wrapper`, `.froala-poetry-container`, `.poetry-poet-header`, `.poetry-couplet`, `.arabic-text`, `.text-maroon`
  - **Editor leftovers & utilities:** `.fr-fic`, `.fr-dii`, `.fr-dib`, `.imgResponsive`, `.fr-bordered`, `.row`, `.col-xs-12`, `.btn`, `.btn-sm`, `.btn-primary`, `.text-center`, `.text-muted`, `.h3`

### Local bundles in NOOR CANVAS (example layout)
- `web/styles/noor-core.css`
- `web/styles/noor-ayah.css`
- `web/styles/noor-hadith.css`
- `web/styles/noor-etymology.css`
- `web/styles/noor-poetry.css`
- `web/styles/noor-editor-compat.css`
- `web/styles/noor-share-overlay.css`

### Fonts, icons, images
- Bundle **Amiri**, **Noto Naskh**, **Inter** locally.  
- Replace CDN icon refs with local (or lucide SVG).  
- Copy CSS-referenced images into `/public/assets/...`.

### Acceptance criteria (styling)
1. Pixel-faithful render of sample HTML **without** loading any CSS/JS from the legacy app.  
2. No external calls for fonts/icons/images.  
3. Arabic text renders correctly (ligatures, spacing).  
4. Injected **Share** overlays and Host toolbar styled by local bundle.

---

## Real-Time & Persistence (essentials)
- **SignalR events:**  
  - `whiteboard:update { mode:'shared'|'waiting'|'ended', assetId?, html?, transition?, timerMs? }`  
  - `annotation:ops { ops: AnnotationOp[] }`
- **SignalR Host ops:**  
  - `host:share { assetId, html, timerMs?, transition? }`  
  - `host:annotation { ops: AnnotationOp[] }`  
  - `host:clearAnnotations {}`  
  - `host:kick { registrationId }`, `host:ban { registrationId, reason? }`
- **DB persistence:** `Question(id, session_id, registration_id, text, status, upvotes, order_index, created_at)`

---

## Performance, Accessibility, and UX Targets
- Share → participant render ≤ **200ms P95**  
- Annotation round-trip ≤ **100ms median**  
- Timer host-only; participants see asset or minimal waiting  
- WCAG 2.2 AA, keyboardable, ARIA live regions, `prefers-reduced-motion` honored

---
