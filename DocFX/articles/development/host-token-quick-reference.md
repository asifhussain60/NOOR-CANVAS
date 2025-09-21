# Host Token User Guide

_A simple guide for session hosts and administrators to understand host authentication_

---

## What is Host Authentication?

Host authentication is a security system that verifies you are authorized to manage Islamic content sharing sessions. Think of it like a digital key that proves you have permission to:

- **Create new sessions** for Qur'anic studies, Islamic discussions, or religious content sharing
- **Manage participant access** and session settings
- **Control session flow** including Q&A, annotations, and real-time interactions

---

## How Does It Work?

### 1. **Getting Your Host Access**

When you need to host a session, the system administrator will provide you with:

- A **Host Access Code** (a unique identifier)
- Instructions on how to use it to access your host dashboard

### 2. **Accessing Your Host Dashboard**

Once you have your Host Access Code:

1. Open your web browser
2. Navigate to the NOOR Canvas platform
3. Enter your Host Access Code when prompted
4. Access your personalized host dashboard

### 3. **Managing Your Sessions**

From your host dashboard, you can:

- **Create new sessions** for Islamic content sharing
- **View participant lists** and manage access
- **Start and end sessions** as needed
- **Monitor Q&A activity** and participant engagement

---

## Common Scenarios

### **Starting a New Qur'anic Study Session**

1. Access your host dashboard using your Host Access Code
2. Click "Create New Session"
3. Choose your content type (Qur'anic verses, Islamic commentary, etc.)
4. Set session parameters (duration, participant limits)
5. Share the session link with participants
6. Begin your session when ready

### **Managing Participant Q&A**

1. Monitor incoming questions during your session
2. Choose which questions to address publicly
3. Provide answers that appear to all participants
4. Moderate discussions to maintain Islamic etiquette

### **Reviewing Session Activity**

1. Access session transcripts after completion
2. Review participant annotations and contributions
3. Export session content for future reference
4. Plan follow-up sessions based on participant feedback

---

## Getting Help

### **If You Can't Access Your Host Dashboard**

- Contact your system administrator
- Verify you're using the correct Host Access Code
- Check that you're on the correct NOOR Canvas website
- Ensure your internet connection is stable

### **If Participants Can't Join Your Session**

- Verify the session is active and not expired
- Check that you've shared the correct session link
- Confirm participant limits haven't been reached
- Contact technical support if issues persist

### **For Session Management Questions**

- Review the Host Dashboard user guide
- Contact your Islamic content coordinator
- Reach out to technical support for platform issues
- Consult the FAQ section for common questions

---

## Best Practices for Islamic Content Sessions

### **Before Your Session**

- **Prepare your content** in advance with appropriate Islamic references
- **Test your host access** to ensure everything works properly
- **Set clear session objectives** aligned with Islamic educational goals
- **Prepare discussion questions** that encourage thoughtful participation

### **During Your Session**

- **Maintain Islamic etiquette** in all interactions
- **Encourage respectful dialogue** among participants
- **Stay focused** on the session's Islamic educational objectives
- **Monitor time** to ensure adequate coverage of planned material

### **After Your Session**

- **Review session transcripts** for valuable insights
- **Follow up** with participants who had questions
- **Plan future sessions** based on community interest
- **Share session summaries** with appropriate community members

---

## Need Technical Help?

This user guide focuses on understanding and using host authentication from a user perspective. If you need technical implementation details, API references, or troubleshooting code, please refer to the **[Host Token Technical Documentation](../technical/host-token-system.md)**.

For immediate technical support, contact your system administrator or IT support team.

### Generate and Authenticate

```javascript
// Generate new token
const generateResponse = await fetch("/api/hostprovisioner/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sessionId: 100, createdBy: "Web User" }),
});
const { hostGuid } = await generateResponse.json();

// Authenticate token
const authResponse = await fetch("/api/host/authenticate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ hostGuid }),
});
const authData = await authResponse.json();

if (authData.success) {
  localStorage.setItem("sessionToken", authData.sessionToken);
  window.location.href = "/host/session-opener"; // Phase 4 update: Dashboard removed
}
```

## Troubleshooting

### Common Errors

**400 Bad Request: Invalid GUID format**

- Check GUID has correct format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Ensure no extra characters or spaces

**Authentication Error Dialog**

- Verify JSON property naming (camelCase vs PascalCase)
- Check CORS configuration
- Confirm API endpoints are accessible

**500 Internal Server Error**

- Check server logs for detailed error information
- Verify application is running on correct ports (9090/9091)
- Ensure database connection is available

### Logging Keywords

Monitor logs for these NOOR prefixes:

- `NOOR-HOSTPROV:` - Token generation events
- `NOOR-INFO:` - Authentication attempts
- `NOOR-SUCCESS:` - Successful operations
- `NOOR-ERROR:` - Error conditions

## Current Implementation Status

### Phase 2 (Active) ✅

- ✅ GUID generation working
- ✅ HMAC-SHA256 hashing implemented
- ✅ Format validation active
- ✅ Session token creation functional
- ✅ **Accepts any valid GUID format for development**

### Future Phases

- 🔄 Database storage (Phase 3)
- 🔄 Hash verification (Phase 3)
- 🔄 Token expiration (Phase 3)
- 🔄 Administrative revocation (Phase 4)

## Links

- [Complete Documentation](../technical/host-token-system.md)
- [Security Model](../technical/security-model.md)
- [API Reference](../../api/index.md)
