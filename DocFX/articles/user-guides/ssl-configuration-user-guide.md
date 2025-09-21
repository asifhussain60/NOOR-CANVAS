# SSL Configuration Issues - User Guide

**Purpose:** User-friendly guide for resolving connection problems in NOOR CANVAS

**Audience:** Session hosts, content administrators, platform users

**Last Updated:** September 13, 2025

---

## 🎯 **What This Guide Helps With**

### **Common Symptoms You Might See**

- "Access Dashboard" button doesn't work when clicked
- Error messages about "authentication failed"
- Application appears to load but features don't work
- Messages about "database connection" or "certificate" errors

### **When This Happens**

These issues typically occur when:

- Setting up NOOR CANVAS for the first time on a new computer
- After Windows updates or security software changes
- When moving between different network environments
- After reinstalling or updating the application

---

## 🚨 **Quick Problem Check**

### **Is This Your Issue?**

You likely have an SSL configuration problem if:

1. **Application Starts Successfully** ✅
   - Browser opens to NOOR CANVAS welcome page
   - You can see "I am a Host" and "Join as Participant" sections
   - No obvious error messages on the main page

2. **But Authentication Fails** ❌
   - Clicking "I am a Host" button works
   - You can enter your Host GUID
   - Clicking "Access Dashboard" shows error message
   - Error mentions "authentication failed" or similar

### **What's Actually Happening**

The application interface works fine, but it can't connect to the database to verify your identity. This is usually caused by security settings that prevent the application from communicating with its database.

---

## 🛠 **How to Fix This Issue**

### **For Technical Users**

If you're comfortable with configuration files:

1. **Find the Configuration File**
   - Location: `D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Development.json`
   - This file controls how the application connects to its database

2. **Update Database Connection Settings**
   - Look for lines that start with `"DefaultConnection"`
   - Add these parameters to the connection text:
     - `TrustServerCertificate=true`
     - `Encrypt=false`
   - Save the file

3. **Restart the Application**
   - Close NOOR CANVAS completely
   - Restart using your normal method (NC command or Visual Studio)

### **For Non-Technical Users**

If configuration files seem complicated:

1. **Contact Your Technical Support**
   - Explain you're getting "authentication failed" errors
   - Mention that the main page loads but login doesn't work
   - Ask them to "check SSL certificate bypass configuration"

2. **Provide This Information**
   - What operating system you're using (Windows 10, Windows 11, etc.)
   - Whether this worked before and when it stopped
   - The exact error message you see (take a screenshot if possible)

---

## ✅ **How to Know It's Fixed**

### **Test Your Fix**

1. **Open NOOR CANVAS** in your browser (usually https://localhost:9091)
2. **Click "I am a Host"**
3. **Enter a Host GUID** (ask your administrator for a test GUID if needed)
4. **Click "Access Dashboard"**
5. **Success:** You should be taken to the host dashboard, not see an error

### **Signs Everything is Working**

- ✅ No error dialogs appear
- ✅ "Access Dashboard" button responds immediately
- ✅ You're redirected to a new page (the host dashboard)
- ✅ You can see session management options

---

## 🔍 **Understanding the Problem**

### **Why This Happens**

Think of it like a security checkpoint:

1. **Your Computer** wants to verify the identity of the **Database Server**
2. **Database Server** shows an ID card (certificate)
3. **Your Computer** doesn't recognize who issued the ID card
4. **Your Computer** refuses to connect for security reasons

### **What the Fix Does**

The configuration change tells your computer:

- "For development purposes, accept this server's ID even if you don't recognize who issued it"
- "Don't require encrypted communication for this local development setup"

### **Is This Safe?**

- **For Development:** Yes, this is completely safe for local development
- **For Production:** No, production systems should use proper certificates
- **Your Data:** This only affects how your local NOOR CANVAS connects to its local database

---

## 🆘 **Still Having Problems?**

### **Double-Check These Things**

1. **Application is Actually Running**
   - Can you access https://localhost:9091 in your browser?
   - Do you see the NOOR CANVAS welcome page?

2. **You Have the Right GUID**
   - Host GUIDs are provided by administrators
   - They look like: `XQmUFUnFdjvsWq4IJhUU9b9mRSn7YHuZql/JMWaxFrM=`
   - Or: `6d752e72-93a1-456c-bc2d-d27af095882a`

3. **Configuration Was Applied Correctly**
   - Did you restart the application after making changes?
   - Are you using the Development environment?

### **Get More Help**

If you're still stuck:

1. **Collect This Information**
   - Screenshot of the error message
   - What you were trying to do when it happened
   - Whether you made any recent changes to your computer

2. **Contact Support With**
   - "I'm getting SSL certificate authentication errors in NOOR CANVAS"
   - "The application loads but I can't authenticate as a host"
   - "I need help with Issue-25 SSL certificate bypass configuration"

### **Emergency Workaround**

If you need to demonstrate or use the system immediately:

- Ask your administrator for alternative access methods
- Use a different computer where NOOR CANVAS is already working
- Request a remote session with technical support

---

## 📚 **Additional Resources**

### **For Administrators**

- **Technical Reference:** [SSL Certificate Configuration Technical Guide](../technical/ssl-certificate-configuration.md)
- **Issue Details:** [Issue-25 Resolution Documentation](../../../IssueTracker/COMPLETED/Issue-25-host-authentication-failure-valid-guid.md)
- **Test Procedures:** [SSL Configuration Test Suite](../../../Tests/NoorCanvas.Core.Tests/Infrastructure/SslConfigurationTestHarness.cs)

### **For Users**

- **Host User Guide:** [Complete Host Authentication Guide](host-authentication-guide.md)
- **Troubleshooting:** [Common NOOR CANVAS Issues](troubleshooting-common-issues.md)
- **Getting Started:** [First Time Setup Guide](getting-started-guide.md)

---

## 📞 **Quick Reference**

### **Key Information for Support**

- **Issue Type:** SSL Certificate Trust Configuration
- **Symptoms:** Authentication fails, "Access Dashboard" doesn't work
- **Solution:** TrustServerCertificate=true configuration in development environment
- **Files:** appsettings.Development.json connection strings
- **Test:** Host authentication with valid GUID should work after fix

### **Common Questions**

**Q: Will this affect security?**  
A: No, this only affects local development connections. Production security is maintained separately.

**Q: Do I need to do this on every computer?**  
A: Only on computers where you're running NOOR CANVAS in development mode.

**Q: Will this fix automatically update?**  
A: Once configured correctly, this should continue working unless the configuration files are changed.

**Q: Can I break anything by making these changes?**  
A: No, these changes only affect how the application connects to its development database. You can't damage your system or other applications.
