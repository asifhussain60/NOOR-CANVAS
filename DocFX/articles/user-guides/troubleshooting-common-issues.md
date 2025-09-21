# Troubleshooting Common Issues

Common problems and solutions for NOOR Canvas users and hosts.

## Connection and Access Issues

### Cannot Access Application

#### Problem: "This site can't be reached"

**Symptoms**: Browser shows connection error when accessing NOOR Canvas
**Solutions**:

1. **Check URL**: Ensure you're using the correct address
   - Development: `https://localhost:9091`
   - Production: Provided by your administrator

2. **Check Server Status**:

   ```powershell
   # For development environment
   nc  # Start the development server
   ```

3. **Verify Network Connection**: Test internet connectivity with other websites

4. **Clear Browser Cache**: Clear browser cache and cookies, then retry

#### Problem: "SSL Certificate Error"

**Symptoms**: Browser warns about unsafe certificate
**Solutions**:

1. **Development Environment**: Click "Advanced" → "Proceed to localhost (unsafe)"
2. **Production Environment**: Contact administrator about SSL certificate issues
3. **Browser Settings**: Ensure browser accepts the certificate

### Session Access Issues

#### Problem: "Session Not Found"

**Symptoms**: Error when entering Session GUID
**Solutions**:

1. **Verify GUID**: Double-check Session GUID with session host
2. **Check Session Status**: Confirm session is still active
3. **Try Again**: Session may have been temporarily unavailable

#### Problem: "Session Full"

**Symptoms**: Cannot join because session has reached participant limit
**Solutions**:

1. **Contact Host**: Ask host to increase participant limit if possible
2. **Wait for Slot**: Someone may leave, creating space
3. **Alternative Session**: Ask host about additional sessions

## Authentication and Host Issues

### Host Authentication Problems

#### Problem: "Invalid Host Token"

**Symptoms**: Cannot create sessions, authentication fails
**Solutions**:

1. **Generate New Token**:

   ```powershell
   nct  # Generate fresh host token
   nc   # Restart with new token
   ```

2. **Check Token Format**: Ensure token is valid GUID format
3. **Restart Application**: Stop and restart development server

#### Problem: "Cannot Create Session"

**Symptoms**: Session creation fails after authentication
**Solutions**:

1. **Check Database Connection**: Ensure database is accessible
2. **Verify Content Selection**: Make sure Album/Category/Session are selected
3. **Clear Application Data**: Clear browser data and retry

### Participant Registration Issues

#### Problem: "Registration Failed"

**Symptoms**: Cannot complete participant registration
**Solutions**:

1. **Check Required Fields**: Ensure name is provided (minimum requirement)
2. **Session Capacity**: Verify session isn't full
3. **Browser Compatibility**: Try different browser if issues persist

## Performance and Technical Issues

### Application Running Slowly

#### Problem: Slow Loading or Response

**Symptoms**: Application takes long time to load or respond to actions
**Solutions**:

1. **Close Other Applications**: Free up system memory and CPU
2. **Check Internet Speed**: Ensure stable broadband connection
3. **Browser Performance**:
   - Close unnecessary browser tabs
   - Disable browser extensions
   - Clear browser cache

4. **Network Optimization**:
   - Use wired connection instead of Wi-Fi if possible
   - Check for network interference or bandwidth limitations

### Real-time Features Not Working

#### Problem: Annotations Not Syncing

**Symptoms**: Cannot see other participants' annotations in real-time
**Solutions**:

1. **WebSocket Connection**: Check if browser supports WebSockets
2. **Firewall Settings**: Ensure firewall allows WebSocket connections
3. **Network Configuration**: Check if network blocks real-time protocols
4. **Browser Refresh**: Refresh page to re-establish connection

#### Problem: SignalR Connection Errors

**Symptoms**: Console shows SignalR connection failures
**Solutions**:

1. **Check Network**: Verify stable internet connection
2. **Browser Compatibility**: Ensure browser supports WebSockets
3. **Proxy Settings**: Check if corporate proxy blocks WebSocket connections
4. **Retry Connection**: Refresh page to attempt reconnection

## Development Environment Issues

### Build and Startup Problems

#### Problem: "Build Failed"

**Symptoms**: dotnet build command fails with errors
**Solutions**:

1. **Check Error Messages**: Read compiler errors carefully
2. **Clean Solution**:

   ```powershell
   dotnet clean
   dotnet restore
   dotnet build
   ```

3. **Dependencies**: Ensure all NuGet packages are restored
4. **Check .NET Version**: Verify .NET 8.0 SDK is installed

#### Problem: "Port Already in Use"

**Symptoms**: Cannot start server because port 9091 is busy
**Solutions**:

1. **Kill Existing Processes**:

   ```powershell
   iiskill  # Stop all IIS Express processes
   nc       # Restart server
   ```

2. **Check Port Usage**:

   ```powershell
   netstat -ano | findstr ":9091"
   ```

3. **Process Management**:
   ```powershell
   taskkill /F /IM "NoorCanvas.exe" /T
   taskkill /F /IM "dotnet.exe" /T
   ```

### Database Connection Issues

#### Problem: "Database Connection Failed"

**Symptoms**: Application cannot connect to KSESSIONS_DEV database
**Solutions**:

1. **Check Connection String**: Verify database server and credentials
2. **Database Server**: Ensure SQL Server is running on AHHOME
3. **Network Access**: Test network connectivity to database server:

   ```powershell
   sqlcmd -S AHHOME -U sa -P [password] -Q "SELECT 1"
   ```

4. **Credentials**: Verify sa account password is correct

#### Problem: "Canvas Schema Not Found"

**Symptoms**: Application starts but cannot find canvas tables
**Solutions**:

1. **Run Migrations**:

   ```powershell
   dotnet ef database update --context CanvasDbContext
   ```

2. **Check Database**: Verify KSESSIONS_DEV database exists
3. **Schema Creation**: Ensure canvas schema exists in database

## Browser-Specific Issues

### Chrome Issues

- **Problem**: WebSocket connection failures
- **Solution**: Check Chrome's WebSocket settings and disable interfering extensions

### Firefox Issues

- **Problem**: SSL certificate warnings in development
- **Solution**: Add security exception for localhost development certificate

### Edge Issues

- **Problem**: Authentication cookies not persisting
- **Solution**: Check Edge privacy settings and allow cookies for localhost

### Safari Issues

- **Problem**: Real-time features not working on mobile Safari
- **Solution**: Ensure WebSocket support is enabled in Safari settings

## Mobile Device Issues

### Touch Interface Problems

- **Problem**: Annotation tools difficult to use on mobile
- **Solutions**:
  - Use landscape orientation for better screen space
  - Zoom in on content before annotating
  - Use mobile-optimized annotation tools when available

### Performance on Mobile

- **Problem**: Slow performance on smartphones/tablets
- **Solutions**:
  - Close other mobile applications
  - Use Wi-Fi instead of cellular data
  - Clear mobile browser cache
  - Restart browser application

## Error Messages and Codes

### Common Error Messages

#### "NOOR-ERROR: Authentication failed"

**Cause**: Invalid host token or session authentication
**Solution**: Generate new host token with `nct` command

#### "NOOR-ERROR: Database timeout"

**Cause**: Database connection timeout (usually network-related)
**Solution**: Check database server connectivity and network stability

#### "SignalR connection closed"

**Cause**: WebSocket connection interrupted
**Solution**: Refresh page to re-establish real-time connection

#### "Session expired"

**Cause**: Session exceeded its configured timeout limit
**Solution**: Host needs to create new session, or extend existing session if possible

## Getting Additional Help

### Self-Diagnosis Steps

1. **Check Browser Console**: Press F12 and look for error messages
2. **Test Basic Connectivity**: Try accessing other websites
3. **Clear Browser Data**: Clear cache, cookies, and local storage
4. **Try Different Browser**: Test with Chrome, Firefox, or Edge
5. **Restart Computer**: Sometimes resolves underlying system issues

### Information to Collect Before Seeking Help

- **Error Message**: Exact text of any error messages
- **Browser and Version**: Which browser and version you're using
- **Operating System**: Windows, macOS, Linux, etc.
- **Network Environment**: Home, work, school network
- **Session GUID**: If joining a specific session
- **Steps to Reproduce**: What actions led to the problem

### Documentation Resources

- [Getting Started Guide](getting-started-guide.md) - Basic usage instructions
- [Host Authentication Guide](host-authentication-guide.md) - Hosting-specific help
- [SSL Configuration Guide](ssl-configuration-user-guide.md) - Security setup
- [Technical Reference](~/articles/technical/) - Advanced technical information

### Contact Information

- **Session Host**: Contact your session host for session-specific issues
- **Technical Administrator**: Contact your organization's technical support
- **Development Team**: For bug reports and feature requests
- **Documentation Issues**: Report documentation problems for improvement

## Prevention Tips

### For Regular Users

- **Keep Browser Updated**: Use latest browser versions for best compatibility
- **Stable Connection**: Use reliable internet connection for sessions
- **Test Before Sessions**: Join test sessions to verify everything works
- **Bookmark URLs**: Save session URLs and GUIDs securely

### For Session Hosts

- **Regular Testing**: Test host functionality before important sessions
- **Backup Plans**: Have alternative communication methods ready
- **Participant Support**: Provide clear joining instructions and technical support
- **Documentation**: Keep troubleshooting guides available for participants

### For Developers

- **Regular Maintenance**: Keep development environment updated
- **Automated Testing**: Run test suite regularly to catch issues early
- **Log Monitoring**: Check application logs for early warning signs
- **Backup Database**: Regular backups of development database

_This troubleshooting guide is updated automatically as new issues are identified and solutions developed._
