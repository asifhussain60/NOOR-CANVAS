# Host Authentication Guide

Complete guide for NOOR Canvas session hosts on authentication and session management.

## Overview for Hosts

As a NOOR Canvas session host, you'll facilitate Islamic content sharing sessions with participants worldwide. This guide covers authentication, session creation, and participant management.

## Authentication System

### Host Token System
NOOR Canvas uses a simple token-based system designed for Islamic content sessions:

**Host Token**: A special GUID that authorizes you to create and manage sessions
**Session GUID**: Unique identifier for each session you create
**No Passwords**: System designed for ease of use in Islamic learning contexts

### Getting Your Host Token

#### For Development Environment
1. **Open PowerShell or Terminal**
2. **Generate Token**:
   ```powershell
   nct  # This generates your host token
   ```
3. **Start Application**:
   ```powershell
   nc   # This starts the server with your token
   ```

#### For Production Environment
Host tokens will be provided by your Islamic content administrator.

## Creating Sessions

### Step-by-Step Session Creation

#### 1. Start the Application
```powershell
nc  # Automatically includes token generation
```

#### 2. Navigate to Host Interface
- Open your browser to: https://localhost:9091 (development)
- Click "Host Session" or navigate to host dashboard

#### 3. Select Content
Choose your Islamic content:
- **Album**: Select from available Islamic content collections
- **Category**: Choose specific category within album  
- **Session**: Select individual session or lesson

#### 4. Session Configuration
- **Session Name**: Descriptive name for participants
- **Duration**: Expected session length
- **Participant Limit**: Maximum number of participants (default: 50)
- **Privacy Settings**: Public or private session

#### 5. Session Creation
- Click "Create Session"
- System generates unique Session GUID
- Share this GUID with your participants

### Session Information for Participants
Once created, provide participants with:
```
Session GUID: [Generated GUID like: 123e4567-e89b-12d3-a456-426614174000]
Session URL: https://yourserver.com/participate
Session Name: [Your session name]
```

## Managing Active Sessions

### Host Dashboard Features
- **Participant List**: See who has joined your session
- **Real-time Annotations**: View participant annotations and comments
- **Q&A Management**: Receive and respond to participant questions
- **Content Control**: Navigate through Islamic content during session

### During Sessions
- **Monitor Participation**: Keep track of active participants
- **Moderate Content**: Ensure appropriate Islamic discussion
- **Guide Learning**: Use annotation tools to highlight key points
- **Answer Questions**: Respond to participant inquiries in real-time

### Ending Sessions
- **Graceful Closure**: Announce session ending to participants
- **Save Annotations**: Export session annotations if needed
- **Session Summary**: Review participation and engagement metrics

## Troubleshooting Authentication

### Common Host Issues

#### "Invalid Host Token"
**Problem**: Token rejected or expired
**Solutions**:
```powershell
# Generate new token
nct

# Restart application with new token  
nc
```

#### "Cannot Create Session"
**Problem**: Session creation fails
**Solutions**:
1. Verify host token is valid
2. Check internet connection
3. Ensure development server is running
4. Try refreshing the page

#### "Participants Cannot Join"
**Problem**: Session GUID issues
**Solutions**:
1. Double-check GUID provided to participants
2. Verify session is still active
3. Check participant limit not exceeded
4. Ensure session hasn't expired

### Getting Support

#### Development Environment
```powershell
# Check application status
nc -Help

# Verify server is running
# Navigate to: https://localhost:9091/healthz

# Generate fresh token
nct
```

#### For Technical Issues
1. Check the terminal/console for error messages
2. Verify development server is running on port 9091
3. Use `iiskill` to stop stuck processes and retry
4. Consult technical documentation for advanced issues

## Best Practices for Islamic Content Hosts

### Session Preparation
- **Content Selection**: Choose appropriate Islamic materials for your audience
- **Technical Setup**: Test token and session creation before participants join
- **Participant Communication**: Clearly communicate session GUID and join instructions
- **Islamic Etiquette**: Prepare to maintain respectful Islamic learning environment

### During Sessions  
- **Respectful Moderation**: Ensure discussions maintain Islamic values and respect
- **Inclusive Participation**: Encourage questions and annotations from all participants
- **Content Focus**: Keep discussions focused on Islamic learning objectives
- **Technical Assistance**: Help participants with technical difficulties

### After Sessions
- **Session Closure**: Properly end sessions and thank participants
- **Content Preservation**: Save valuable annotations and discussions if appropriate
- **Feedback Collection**: Gather feedback for improving future sessions
- **Follow-up**: Provide additional resources or schedule follow-up sessions

## Security Considerations

### Protecting Islamic Content
- **Session Privacy**: Use private sessions for sensitive Islamic discussions
- **Participant Verification**: Monitor participant list for unauthorized access
- **Content Respect**: Ensure Islamic content is treated with appropriate reverence
- **Access Control**: End sessions immediately if inappropriate behavior occurs

### Technical Security
- **Token Protection**: Keep host tokens confidential and secure
- **Session Isolation**: Each session is isolated from others
- **Secure Communications**: All communications use HTTPS encryption
- **Regular Token Rotation**: Generate new tokens regularly for enhanced security

## Advanced Features

### Multi-Session Management
- **Concurrent Sessions**: Host multiple sessions simultaneously (if system allows)
- **Session Scheduling**: Plan and schedule future Islamic learning sessions
- **Participant Groups**: Manage different groups with separate sessions
- **Content Libraries**: Organize Islamic content for easy session creation

### Integration with Islamic Content
- **Beautiful Islam Integration**: Access existing Islamic content libraries
- **Quranic References**: Link to specific Quranic verses and commentary
- **Hadith Integration**: Include relevant Hadith in session discussions
- **Islamic Calendar**: Schedule sessions according to Islamic calendar events

## Frequently Asked Questions

### Q: How long do host tokens last?
**A**: Tokens are session-based and remain valid during your development session. Generate new tokens for each development session.

### Q: Can I host multiple sessions at once?  
**A**: Yes, you can create and manage multiple sessions simultaneously with the same host token.

### Q: What happens if I lose my Session GUID?
**A**: Check your host dashboard for active sessions and their GUIDs. If needed, create a new session.

### Q: How many participants can join my session?
**A**: Default limit is 50 participants, configurable based on your system capacity and requirements.

### Q: Can participants join after the session has started?
**A**: Yes, participants can join ongoing sessions using the Session GUID.

### Q: How do I handle inappropriate participant behavior?
**A**: You can remove participants from the session through the host dashboard and end the session if necessary.

## Related Documentation

- [Authentication Guide](~/articles/development/authentication-guide.md) - Technical authentication details
- [Getting Started Guide](getting-started-guide.md) - Initial setup and configuration
- [SSL Configuration](ssl-configuration-user-guide.md) - HTTPS setup for secure sessions
- [Troubleshooting Guide](troubleshooting-common-issues.md) - Common issues and solutions

*This host authentication guide is updated automatically as authentication features are enhanced.*
