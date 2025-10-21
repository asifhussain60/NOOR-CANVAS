# NoorCanvas Host Provisioner - Production

This tool generates host and user tokens for NoorCanvas sessions in the **KSESSIONS production database**.

## Quick Start

### Generate Token for a Session

```cmd
create-token.bat <SESSION_ID> [CREATED_BY]
```

**Examples:**
```cmd
create-token.bat 212
create-token.bat 212 "Admin"
create-token.bat 212 "John Doe"
```

### Interactive Mode

For menu-driven token management:
```cmd
token-manager.bat
```

## What It Does

1. ✅ Validates the session exists in KSESSIONS database
2. ✅ Checks the session has transcripts available
3. ✅ Generates unique 8-character friendly tokens (Host + User)
4. ✅ Creates canvas.Sessions record with embedded tokens
5. ✅ Outputs the access URLs

## Output Example

```
Host Token: EYMX5TQJ
User Token: 8NZRSDWM
Host URL: https://localhost:9091/host/EYMX5TQJ
Participant URL: https://localhost:9091/user/landing/8NZRSDWM
```

## Database Connection

- **Environment**: Production
- **Database**: KSESSIONS (Server: AHHOME)
- **Schema**: Simplified (tokens embedded in canvas.Sessions table)

## Files

- `create-token.bat` - Command-line token generator
- `token-manager.bat` - Interactive menu interface
- `HostProvisioner.dll` - Main application
- `appsettings.Production.json` - Production database configuration

## Requirements

- .NET 8.0 Runtime
- Access to AHHOME SQL Server (KSESSIONS database)
- Valid session ID with transcripts

## Troubleshooting

**"Session ID not found"**
- Verify the session exists in KSESSIONS.dbo.Sessions table

**"No transcripts available"**
- Check KSESSIONS.dbo.SessionTranscripts has records for this session

**"Database connection failed"**
- Verify AHHOME server is accessible
- Check SQL Server credentials in appsettings.Production.json

## Notes

- Tokens are **permanent** (no expiration unless manually set)
- Each session can only have one host token and one user token
- Running the tool again for the same session will regenerate new tokens
- Old tokens will be invalidated when new ones are generated

---

**Last Updated**: October 12, 2025  
**Version**: 1.0  
**Database**: KSESSIONS (Production)
