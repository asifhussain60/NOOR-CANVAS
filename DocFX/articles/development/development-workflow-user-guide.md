# Development Workflow User Guide

## Overview

This guide covers the standard development workflows for NOOR Canvas, from starting development to deploying changes. Following these workflows ensures consistency and quality across the project.

## Getting Started with Development

### First Time Setup
1. **Clone Repository**: Get the latest code from GitHub
2. **Install Dependencies**: Run initial setup commands
3. **Verify Environment**: Ensure all tools are working
4. **Start Development**: Begin your first development session

### Daily Development Workflow
```powershell
# 1. Start your development session
nc

# 2. Make your code changes in VS Code or your preferred editor

# 3. Build and test (automatic)
dotnet build

# 4. Commit your changes (tests run automatically)
git add .
git commit -m "your change description"

# 5. Push to repository
git push origin master
```

## Core Development Commands

### Starting Development
- **`nc`**: Starts the complete development environment
  - Generates required host tokens
  - Builds the application
  - Starts the development server at https://localhost:9091

### Stopping Development
- **Ctrl+C in NC window**: Gracefully stops the development server
- **`iiskill`**: Forces all IIS Express processes to stop (emergency use)

### Documentation
- **`ncdoc`**: Opens the complete project documentation
- All processes and features are automatically documented in DocFX

## Code Quality Workflows

### Automatic Testing
Tests run automatically at two key points:

1. **After Building**: When you run `dotnet build`, tests execute if code changed
2. **Before Committing**: When you run `git commit`, tests validate your changes

### Manual Quality Checks
```powershell
# Run tests manually
.hooks\post-build.ps1 -Verbose

# Force test execution
.hooks\pre-commit-test.ps1 -Force

# Check code formatting
dotnet format --verify-no-changes
```

## Feature Development Workflow

### Adding New Features
1. **Plan the Feature**: Review requirements and design
2. **Create User Documentation**: Write user-friendly guides first
3. **Create Technical Documentation**: Write implementation details
4. **Implement Feature**: Write the actual code
5. **Update Tests**: Ensure comprehensive test coverage
6. **Validate Documentation**: Ensure DocFX builds correctly

### Modifying Existing Features
1. **Update Documentation**: Revise both user and technical docs
2. **Implement Changes**: Modify the code
3. **Update Tests**: Adjust tests for new behavior
4. **Validate Integration**: Ensure changes don't break other features

## Database Development Workflow

### Schema Changes
1. **Development Database**: Always use KSESSIONS_DEV for development
2. **Migration Scripts**: Create Entity Framework migrations for schema changes
3. **Test Data**: Populate with realistic test data
4. **Validation**: Ensure queries work with both development and production schemas

### Cross-Database Integration
- **Read-Only Access**: NOOR Canvas reads from KSESSIONS database tables
- **No Data Duplication**: Reference existing assets, don't copy them
- **Performance Testing**: Ensure queries are efficient

## API Development Workflow

### REST API Endpoints
1. **Design API**: Plan endpoints, request/response formats
2. **Document API**: Create technical reference documentation
3. **Implement Controllers**: Write C# controller code
4. **Add Validation**: Input validation and error handling
5. **Test Endpoints**: Use PowerShell or Postman for testing

### SignalR Hub Development
1. **Plan Real-time Features**: Design hub methods and client interactions
2. **Implement Hub**: Write C# SignalR hub code
3. **Client Integration**: Connect Blazor components to hubs
4. **Test Connections**: Verify real-time communication works

## UI Development Workflow

### Blazor Component Development
1. **McBeatch Theme Integration**: Use existing theme components
2. **Responsive Design**: Ensure mobile and desktop compatibility
3. **RTL Support**: Handle Arabic and Urdu text properly
4. **Accessibility**: Follow web accessibility guidelines

### Styling and Theming
- **Use McBeatch CSS**: Leverage existing theme styling
- **Color Variants**: Support multiple color schemes
- **Custom CSS**: Add project-specific styles carefully

## Testing Workflows

### Unit Testing
```powershell
# Run unit tests
dotnet test Tests/NoorCanvas.Core.Tests/

# Run specific test category
dotnet test --filter Category=Unit
```

### Integration Testing
```powershell
# Run integration tests
dotnet test Tests/NC-ImplementationTests/

# Test specific component
dotnet test --filter FullyQualifiedName~HostController
```

### Manual Testing Scenarios
1. **Happy Path Testing**: Test normal user workflows
2. **Error Scenarios**: Test error handling and edge cases
3. **Cross-Browser Testing**: Verify compatibility
4. **Mobile Testing**: Test responsive behavior

## Debugging Workflows

### Application Debugging
1. **Check Logs**: Review structured logging output
2. **Database Connectivity**: Test connection strings
3. **Port Issues**: Verify nothing else uses ports 9090/9091
4. **Token Issues**: Regenerate tokens with `nct`

### Common Debug Commands
```powershell
# Check running processes
netstat -ano | findstr ":9091"
Get-Process | Where-Object {$_.ProcessName -like "*iisexpress*"}

# Test database connection
# (Use connection test utilities)

# Clear caches
Remove-Item .test-cache -Recurse -Force
Remove-Item .build-cache -Recurse -Force
```

## Deployment Workflows

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Configuration reviewed
- [ ] Database migrations prepared
- [ ] Performance tested

### Production Deployment
1. **Build Release Version**: `dotnet publish -c Release`
2. **Database Migration**: Apply schema changes to production
3. **IIS Configuration**: Update production IIS settings
4. **Verification**: Test production deployment

## Collaboration Workflows

### Working with Team Members
1. **Pull Latest Changes**: `git pull origin master`
2. **Create Feature Branches**: For larger features
3. **Regular Commits**: Small, focused commits with good messages
4. **Code Reviews**: Review team member changes

### Communication Practices
- **Clear Commit Messages**: Describe what changed and why
- **Documentation Updates**: Keep docs current with code changes
- **Issue Tracking**: Use the issue tracker for bugs and enhancements
- **Knowledge Sharing**: Document discoveries and solutions

## Performance Workflows

### Development Performance
- **Smart Caching**: Leverage test caching to speed up development
- **Incremental Builds**: Use `--no-restore` when appropriate
- **Parallel Operations**: Take advantage of parallel test execution

### Application Performance
- **Database Optimization**: Efficient queries and proper indexing
- **SignalR Optimization**: Minimize message size and frequency
- **Asset Optimization**: Efficient loading of CSS, JS, and images

## Troubleshooting Common Issues

### Build Issues
- **Clean and Rebuild**: `dotnet clean` followed by `dotnet build`
- **Package Restore**: `dotnet restore`
- **Clear Caches**: Remove obj/ and bin/ directories

### Development Server Issues
- **Port Conflicts**: Use `iiskill` to stop conflicting processes
- **Certificate Issues**: Check HTTPS certificate configuration
- **Database Connection**: Verify connection strings and server status

### Test Issues
- **Cache Problems**: Clear test caches and retry
- **Environment Issues**: Check database and service availability
- **Timing Issues**: Some tests may need longer timeouts

## Best Practices Summary

### Code Quality
- **Write Tests First**: Consider test-driven development
- **Document Everything**: Both user guides and technical references
- **Small Commits**: Focused, atomic changes
- **Meaningful Names**: Clear, descriptive naming for all code elements

### Workflow Efficiency
- **Use Automation**: Leverage automatic testing and builds
- **Follow Conventions**: Consistent naming and structure
- **Regular Integration**: Commit and push changes frequently
- **Continuous Learning**: Stay updated on tools and techniques

For detailed technical implementation information, see the [Development Workflow Technical Reference](../technical/development-workflow-technical-reference.md).
