# Issue-41: Entity Framework Intermittent Timeout in Host Provisioner

**Priority**: 🟡 **MEDIUM** (Functional but intermittent behavior)  
**Category**: 🐛 **Bug**  
**Status**: ⚠️ **In Progress**

## **Problem Statement**

Host Provisioner console application shows intermittent Entity Framework timeout issues during DbContext operations, despite successful database connectivity and properly standardized connection strings.

## **Evidence of Success vs. Failure**

### **✅ Successful Executions Confirmed**

- **Session ID 1**: Created Host GUID `cd66d6f7-11a3-4101-be91-3a85c0da792a` (Host Session ID 10)
- **Session ID 4**: Execution completed with proper logging and database persistence
- **Database Records**: Verified 2 Host Sessions exist in KSESSIONS_DEV.canvas.HostSessions
- **Configuration**: Connection strings properly standardized across applications

### **❌ Intermittent Failures**

- Some executions hang during Entity Framework DbContext initialization
- Process stops after "PROVISIONER: Testing database connectivity..." log message
- No error messages generated - process simply hangs indefinitely
- Requires process termination via `taskkill` or process manager

## **Technical Investigation**

### **Connection String Configuration (Verified Working)**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false"
  }
}
```

### **Entity Framework Configuration (Updated)**

```csharp
services.AddDbContext<CanvasDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
        sqlOptions.CommandTimeout(3600))); // Command timeout matches connection timeout
```

### **Database Connectivity (Verified Working)**

Direct SQL connectivity via mssql tools works consistently:

- ✅ Connection to AHHOME/KSESSIONS_DEV successful
- ✅ Canvas schema access confirmed
- ✅ Host Sessions table accessible and writable
- ✅ sa account permissions verified

## **Root Cause Hypotheses**

### **1. Entity Framework Service Provider Initialization**

**Theory**: DbContext service provider creation may have threading or dependency injection issues
**Evidence**: Hanging occurs during `GetRequiredService<CanvasDbContext>()` call
**Testing Approach**: Add more granular logging around service provider operations

### **2. Connection Pool Exhaustion**

**Theory**: Previous failed connections may be holding connections in pool
**Evidence**: Intermittent nature suggests connection state issues
**Testing Approach**: Add connection pool monitoring and explicit disposal

### **3. Entity Framework Model Validation**

**Theory**: DbContext model validation may timeout on complex schemas
**Evidence**: Long pause during initial DbContext access
**Testing Approach**: Test with minimal DbContext configuration

### **4. SQL Server Lock Contention**

**Theory**: Concurrent database operations may cause locks
**Evidence**: Some executions succeed while others hang
**Testing Approach**: Monitor SQL Server activity during hangs

## **Troubleshooting Steps Completed**

### **✅ Configuration Standardization**

- Updated Host Provisioner connection string to match main application
- Added Entity Framework command timeout (3600 seconds)
- Verified appsettings.json configuration consistency

### **✅ Database Connectivity Validation**

- Confirmed database server access via mssql tools
- Verified canvas schema permissions for sa account
- Validated Host Sessions table structure and accessibility

### **✅ Build Verification**

- Host Provisioner builds without errors
- All dependencies properly resolved
- Entity Framework packages properly referenced

## **Next Investigation Steps**

### **1. Enhanced Logging (High Priority)**

Add detailed logging around Entity Framework operations:

```csharp
Log.Information("PROVISIONER: Creating service scope...");
using var scope = serviceProvider.CreateScope();

Log.Information("PROVISIONER: Service scope created, getting service provider...");
var scopedProvider = scope.ServiceProvider;

Log.Information("PROVISIONER: Getting CanvasDbContext from DI...");
var context = scopedProvider.GetRequiredService<CanvasDbContext>();

Log.Information("PROVISIONER: DbContext obtained, checking model state...");
// Add model validation logging
```

### **2. Connection Pool Monitoring (Medium Priority)**

Add connection pool diagnostics and explicit cleanup:

```csharp
Log.Information("PROVISIONER: Clearing connection pools...");
SqlConnection.ClearAllPools();

Log.Information("PROVISIONER: Testing database connectivity with fresh connection...");
var canConnect = await context.Database.CanConnectAsync();
```

### **3. Timeout Detection (Medium Priority)**

Implement operation timeouts with cancellation tokens:

```csharp
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
var canConnect = await context.Database.CanConnectAsync(cts.Token);
```

### **4. Alternative DbContext Pattern (Low Priority)**

Test direct DbContext instantiation instead of dependency injection:

```csharp
var options = new DbContextOptionsBuilder<CanvasDbContext>()
    .UseSqlServer(connectionString)
    .Options;

using var context = new CanvasDbContext(options);
```

## **Workaround Strategy**

For immediate development needs:

1. **Retry Logic**: Attempt Host Provisioner execution multiple times
2. **Direct SQL Fallback**: Use mssql tools for Host Session creation when needed
3. **Process Monitoring**: Kill hanging processes and retry execution

## **Success Criteria**

- Consistent Host Provisioner execution without hangs
- Proper error handling for timeout conditions
- Enhanced logging for troubleshooting future issues
- Documented best practices for Entity Framework timeout handling

## **Impact Assessment**

- **Severity**: Medium (functional workarounds exist)
- **Frequency**: Intermittent (approximately 50% failure rate observed)
- **Blocking**: Not blocking development (direct SQL operations work)
- **User Experience**: Affects Host Session provisioning workflow reliability

## **Related Issues**

- Issue-40: Mandatory SQL Connectivity Testing (parent issue)
- Implementation Tracker: Database standardization documentation

---

**Created**: September 13, 2025  
**Last Updated**: September 13, 2025  
**Next Review**: Implement enhanced logging and timeout detection
