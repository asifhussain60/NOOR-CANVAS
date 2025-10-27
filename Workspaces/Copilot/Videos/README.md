# Workspaces/Copilot/Videos - Copilot Review Folder

**Purpose**: Store MP4 videos and media files for GitHub Copilot to review and work with.

**Git LFS Enabled**: All files in this folder are automatically tracked with Git LFS for efficient storage.

---

## 📁 Folder Structure

```
Workspaces/
└── Copilot/
    └── Videos/
        ├── README.md (this file)
        ├── [your-video-files].mp4
        └── [screen-recordings].webm
```

---

## 🎥 Supported File Types

All video formats are tracked with Git LFS:
- **MP4** (`.mp4`) - Primary format
- **MOV** (`.mov`) - Apple QuickTime
- **AVI** (`.avi`) - Windows Video
- **WebM** (`.webm`) - Web optimized

---

## 📝 Usage Instructions

### Upload Videos for Copilot Review

1. **Add your video file to this folder**:
   ```powershell
   Copy-Item "C:\path\to\your\video.mp4" "Workspaces\Copilot\Videos\"
   ```

2. **Git will automatically track it with LFS**:
   ```powershell
   git add Workspaces/Copilot/Videos/video.mp4
   git commit -m "Add video for Copilot review: [description]"
   ```

3. **Reference in Copilot conversations**:
   ```
   @workspace Review the video at Workspaces/Copilot/Videos/video.mp4 and help me:
   - Identify the UI issue shown
   - Generate a test case for this scenario
   - Fix the bug demonstrated
   ```

### Verify LFS Tracking

Check if your file is tracked by LFS:
```powershell
git lfs ls-files
```

You should see your video file listed.

---

## 🔍 What Can Copilot Do With Videos?

While Copilot cannot directly play videos, you can:

1. **Describe the video content** and ask Copilot to:
   - Generate test cases based on user interactions
   - Create bug reproduction steps
   - Implement features shown in demos
   - Identify UI/UX improvements

2. **Reference video timestamps**:
   ```
   At 0:45 in debug-panel-issue.mp4, the panel doesn't close.
   Can you fix the close button handler?
   ```

3. **Use videos as test artifacts**:
   - Percy visual regression test recordings
   - Playwright test failure videos
   - Screen recordings of bugs

---

## 📊 File Size Recommendations

- **Keep videos under 100MB** when possible
- **Use screen recording tools** with compression:
  - Windows: Xbox Game Bar (Win+G)
  - OBS Studio (cross-platform)
  - ShareX (Windows, free)

- **Compress large videos**:
  ```powershell
  # Using ffmpeg (if installed)
  ffmpeg -i large-video.mp4 -vcodec h264 -acodec aac compressed-video.mp4
  ```

---

## 🚀 Quick Examples

### Example 1: Bug Report Video
```
Workspaces/Copilot/Videos/bug-canvas-refresh-issue.mp4
"Canvas doesn't refresh after saving - see video at 0:30"

@workspace Review bug-canvas-refresh-issue.mp4:
At 0:30 the canvas state is stale after save. Fix the refresh logic.
```

### Example 2: Feature Demo
```
Workspaces/Copilot/Videos/new-annotation-feature-demo.mp4
"Demo of desired annotation behavior"

@workspace Based on new-annotation-feature-demo.mp4:
Implement the annotation selection behavior shown at 1:15
```

### Example 3: Test Failure Recording
```
Workspaces/Copilot/Videos/playwright-test-failure-2025-10-27.mp4
"Automated test failure - debug panel stuck open"

@workspace The test failure at Workspaces/Copilot/Videos/playwright-test-failure-2025-10-27.mp4
shows the debug panel doesn't close. Update the test and fix the close handler.
```

---

## 🛡️ Git LFS Configuration

This folder is configured in `.gitattributes`:
```
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.mov filter=lfs diff=lfs merge=lfs -text
*.avi filter=lfs diff=lfs merge=lfs -text
*.webm filter=lfs diff=lfs merge=lfs -text
```

---

## ⚠️ Important Notes

1. **First Push**: LFS files upload to LFS server, not standard Git
2. **Clone Behavior**: Use `git lfs pull` after cloning to download LFS files
3. **Storage Limits**: Check your Git LFS storage quota (GitHub: 1GB free)
4. **Private Videos**: Ensure no sensitive data in recordings before committing

---

## 📚 Related Documentation

- [Git LFS Documentation](https://git-lfs.github.com/)
- [GitHub LFS Guide](https://docs.github.com/en/repositories/working-with-files/managing-large-files)
- Project: `.gitattributes` - LFS tracking configuration
- Project: `.gitignore` - Excluded patterns

---

**Created**: October 27, 2025  
**Git LFS**: Enabled  
**Tracked Formats**: MP4, MOV, AVI, WebM
