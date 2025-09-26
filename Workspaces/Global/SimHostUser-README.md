# NOOR Canvas - Host & User Experience Simulator

A sophisticated web-based tool for simulating both host and user experiences in NOOR Canvas, enabling comprehensive testing of SignalR functionality with multiple simultaneous user instances.

## 🚀 Features

### Host Simulation
- **Token Generation**: Generate valid host tokens with one click
- **URL Creation**: Automatically generates proper host control panel URLs
- **Direct Access**: Open host interface in new window/tab
- **Configuration Persistence**: Save and restore host settings

### User Simulation  
- **Token Generation**: Generate valid user/session tokens
- **Multiple Instances**: Create 1-8 simultaneous user session instances
- **Live Preview**: Real-time iframe views of user sessions
- **Instance Management**: Individual refresh, open in tab, and remove controls

### Advanced Features
- **Base URL Configuration**: Support for different environments (localhost, staging, production)
- **Configuration Export/Import**: Save and share testing configurations
- **Quick Demo**: One-click setup for demonstration purposes
- **Toast Notifications**: Real-time feedback for all operations
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 📁 Files

- `SimHostUser.html` - Main simulation interface (standalone HTML file)
- `SimHostUser.ps1` - PowerShell launcher script with HTTP server
- `SimHostUser-README.md` - This documentation file

## 🛠️ Usage

### Method 1: PowerShell Launcher (Recommended)
```powershell
# Launch with default settings
.\SimHostUser.ps1

# Launch with specific browser
.\SimHostUser.ps1 -Browser chrome

# Launch on custom port
.\SimHostUser.ps1 -Port 8080

# Show help
.\SimHostUser.ps1 -Help
```

### Method 2: Direct HTML Access
Simply open `SimHostUser.html` in your browser. Note that some features may be limited due to browser security policies when accessing local files.

## 🎯 Quick Start Guide

1. **Launch the Simulator**
   ```powershell
   .\SimHostUser.ps1
   ```

2. **Generate Tokens**
   - Click "Generate" next to Host Token field
   - Click "Generate" next to User Token field
   
3. **Create User Instances**
   - Set "Number of User Instances" (1-8)
   - Click "Create Instances"

4. **Test SignalR Functionality**
   - Open host window using the external link button
   - Use the host control panel to share assets
   - Watch real-time updates in user instance iframes

## 🔧 Configuration

### Base URL Settings
The simulator supports different NOOR Canvas environments:
- **Development**: `https://localhost:9091` (default)
- **Staging**: `https://staging.noorcanvas.com`
- **Production**: `https://noorcanvas.com`

Change the base URL using the settings panel (gear icon in header).

### URL Patterns
The simulator generates URLs following NOOR Canvas routing conventions:
- **Host URL**: `{baseUrl}/host/control-panel/{hostToken}`
- **User URL**: `{baseUrl}/session/canvas/{userToken}`

## 🎪 Demo Scenarios

### Scenario 1: Basic Host-User Communication
1. Generate host and user tokens
2. Create 2 user instances
3. Open host window
4. Use "Test Share Asset" in host panel
5. Observe real-time updates in user instances

### Scenario 2: Multi-User Session Testing
1. Use "Quick Demo" button for rapid setup
2. Create 4-6 user instances
3. Test asset sharing across all instances
4. Verify SignalR group broadcasting

### Scenario 3: Cross-Environment Testing
1. Change base URL to staging/production
2. Use existing session tokens
3. Test functionality across environments
4. Export configuration for team sharing

## 🔍 Troubleshooting

### Common Issues

**Issue**: "Failed to load instance"
- **Cause**: Invalid tokens or NOOR Canvas not running
- **Solution**: Verify NOOR Canvas is running and tokens are valid

**Issue**: "No URL to copy"
- **Cause**: Missing host or user tokens
- **Solution**: Generate tokens using the "Generate" buttons

**Issue**: Browser security warnings
- **Cause**: Mixed content (HTTPS simulator accessing HTTP NOOR Canvas)
- **Solution**: Use PowerShell launcher or configure NOOR Canvas for HTTPS

### Port Conflicts
If the default port (8090) is in use, the launcher will automatically find the next available port.

## 🚀 Advanced Usage

### Configuration Export/Import
Export current configuration for sharing:
```javascript
// Configuration includes:
{
  "baseUrl": "https://localhost:9091",
  "hostToken": "SAMPLE01",
  "userToken": "USER001", 
  "instanceCount": 3,
  "timestamp": "2025-09-25T19:00:00.000Z"
}
```

### Custom Token Patterns
While the generator creates 8-character alphanumeric tokens, you can manually enter any valid NOOR Canvas token format.

### Multiple Environment Testing
1. Open multiple browser windows/tabs
2. Configure different base URLs in each
3. Test cross-environment compatibility

## 🎨 Technical Details

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Font Awesome 6.4.0 (CDN)
- **Server**: Python HTTP server (via PowerShell launcher)

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

### Security Features
- Local storage for configuration persistence  
- Input validation for URLs and tokens
- CSRF protection through SameSite policies
- No external data transmission

## 📈 Performance Considerations

### Instance Limits
- **Recommended**: 2-4 instances for testing
- **Maximum**: 8 instances (to prevent browser performance issues)
- **Memory Usage**: ~50MB per instance (varies by content)

### Optimization Tips
- Use "lazy loading" for iframe content
- Close unused instances to free memory
- Use "Open in Tabs" for detailed testing of specific instances

## 🤝 Integration with NOOR Canvas

### Required NOOR Canvas State
- Application running on configured base URL
- SignalR hubs active (`/hub/session`, `/hub/qa`, `/hub/annotation`)
- Valid tokens in database (or test tokens accepted)

### API Endpoints Used
- `GET /host/control-panel/{hostToken}` - Host interface
- `GET /session/canvas/{userToken}` - User interface  
- `WebSocket /hub/session` - SignalR communication

## 📝 Development Notes

### Extending the Simulator
The HTML file is structured for easy modification:
- Configuration object for settings management
- Modular functions for each feature
- Event-driven architecture for UI updates
- CSS Grid for responsive instance layout

### Adding New Features
Example: Add annotation testing
```javascript
// Add to configuration object
annotationToken: '',

// Add UI controls
// Add URL generation logic
// Add instance creation for annotation interface
```

## 🔄 Version History

- **v1.0** (2025-09-25): Initial release with core simulation features
- **v1.1** (Planned): Enhanced token validation and error handling
- **v1.2** (Planned): Session recording and playback capabilities

## 📞 Support

For issues or feature requests related to this simulator:
1. Check this README for common solutions
2. Verify NOOR Canvas is running correctly
3. Test with "Quick Demo" to isolate configuration issues
4. Review browser console for JavaScript errors

---

**Note**: This simulator is designed for testing and development purposes. For production usage, use the actual NOOR Canvas interfaces directly.