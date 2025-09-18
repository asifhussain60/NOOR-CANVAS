# NOOR Canvas

> Modern Islamic Education Platform - Blazor Server Application with Real-time Session Management

## 🎯 Project Overview

NOOR Canvas is a comprehensive Islamic education platform built with ASP.NET Core 8.0 Blazor Server, featuring real-time session management, host authentication, and participant engagement tools.

### ✅ Core Features
- **Host Experience**: 2-step authentication, session creation, and participant management
- **Real-time Sessions**: SignalR-powered live updates and interactions
- **Islamic Content**: Integrated with KSESSIONS database (16+ albums, 20+ categories)
- **Security**: GUID-based authentication and token validation
- **Modern UI**: Responsive design with NOOR Canvas branding

## 🚀 Quick Start

### Prerequisites
- .NET 8.0 SDK
- Node.js 16+ (for UI testing)
- SQL Server (KSESSIONS_DEV database)
- VSCode with Playwright extension (for testing)

### Run the Application
```bash
# Start the application
cd "SPA/NoorCanvas"
dotnet run

# Application will be available at:
# HTTP: http://localhost:9090
# HTTPS: https://localhost:9091
```

### Global Commands (Recommended)
```powershell
# Full testing workflow with token generation
ksrun -test

# Simple application launcher
nc

# Host token management
nct create 123 -CreatedBy "YourName"
```

## 📁 Project Structure

```
├── SPA/NoorCanvas/              # Main Blazor Server application
├── Tests/
│   ├── UI/                      # Playwright TypeScript tests
│   ├── NC-ImplementationTests/  # .NET integration tests
│   └── APPLICATION-HEALTH-HARNESS-GUIDE.md
├── IssueTracker/                # Structured issue tracking
├── Documentation/               # Technical documentation
├── Workspaces/                  # Development utilities
├── Tools/HostProvisioner/       # Token management tools
└── .github/prompts/            # GitHub Copilot agents
```

## 🧪 Testing

### UI Testing (Primary Method)
**Use VSCode Test Explorer for all UI testing:**

1. Open VSCode → Activity Bar → Testing (flask icon)
2. Navigate to Playwright section
3. Click "Run All Tests" or run individual tests
4. Test reports automatically generated in `test-results/`

### Test Suites Available
- **Host Authentication Flow**: Landing page and session management
- **Cascading Dropdowns**: Issue-106 validation with 2-second delays
- **User Authentication**: Token validation and routing
- **API Integration**: Backend service validation

### Manual Testing
```powershell
# Complete testing workflow
ksrun -test              # Generates token, starts app, opens test suite

# Host authentication test
curl -k "https://localhost:9091/api/host/albums?guid=JHINFLXN"
```

## 🛠️ Development

### Build & Development
```bash
# Build solution
dotnet build

# Run with file watching
dotnet watch run --project SPA/NoorCanvas/NoorCanvas.csproj

# Format code
dotnet format

# Run TypeScript linting
npm run lint:tests
```

### Database Connection
- **Development**: KSESSIONS_DEV (read-write access to `canvas` schema)
- **Production**: KSESSIONS (read-only, never modify)

### Key APIs
- `GET /api/host/albums?guid={token}` - Retrieve Islamic content albums
- `GET /api/host/categories?guid={token}` - Get content categories
- `POST /api/host/create-session` - Create new teaching session

## 📚 Documentation

### Essential Guides
- [Issue Tracking Usage](IssueTracker/USAGE-GUIDE.MD) - How to use the issue system
- [UI Testing Guide](Tests/UI/README.md) - Comprehensive testing documentation
- [Global Commands](Workspaces/Global/README.md) - Development utilities
- [Health Check Reference](Workspaces/HEALTHCHECK-QUICK-REF.md) - System validation

### Development Status
- [Development Status](NOOR-Canvas-Development-Status.md) - Current progress and roadmap
- [Implementation Tracker](Documentation/) - Technical implementation details

## 🔧 GitHub Copilot Integration

This project includes specialized GitHub Copilot agents:
- **fixissue**: Issue tracking and resolution protocol
- **pwtest**: Playwright testing with continuous improvement
- **cleanup**: Repository maintenance and code quality

## 🏗️ Architecture

- **Backend**: ASP.NET Core 8.0 Blazor Server
- **Frontend**: Razor Components with SignalR real-time updates
- **Database**: SQL Server with Entity Framework Core
- **Testing**: Playwright (TypeScript) + xUnit (.NET)
- **Authentication**: GUID-based tokens with friendly token support
- **Styling**: Custom CSS with NOOR Canvas design system

## 📈 Project Status

**Current Phase**: User Experience Views Implementation
- ✅ Host Experience Complete
- ✅ Core Infrastructure Ready
- ✅ Testing Framework Established
- 🚧 Participant Views (In Progress)

## 🤝 Contributing

1. Review [Development Status](NOOR-Canvas-Development-Status.md) for current priorities
2. Use [Issue Tracker](IssueTracker/ncIssueTracker.MD) for task management
3. Follow testing protocols in [UI Testing Guide](Tests/UI/README.md)
4. Run `ksrun -test` for comprehensive validation

## 📄 License

ISC License - See repository details for full license information.

---

**For detailed technical documentation, see [Documentation/README.md](Documentation/README.md)**