# NOOR Canvas Application Health Checker & Auto-Recovery System

## **Purpose**

Comprehensive test harness to detect, diagnose, and automatically resolve application loading issues, particularly when IIS Express appears to be running but the application is not accessible.

## **Components**

### **1. ApplicationHealthChecker.ps1**

**Location**: `Workspaces\Testing\ApplicationHealthChecker.ps1`

- Comprehensive health detection system
- Multi-layer validation (process, ports, connectivity, endpoints)
- Detailed diagnostic reporting
- Issue classification and severity assessment

### **2. ApplicationRecovery.ps1**

**Location**: `Workspaces\Testing\ApplicationRecovery.ps1`

- Automated issue resolution system
- Smart process management and port conflict resolution
- Clean restart workflow with verification
- Rollback capabilities if resolution fails

### **3. HealthMonitor.ps1**

**Location**: `Workspaces\Testing\HealthMonitor.ps1`

- Continuous monitoring during development
- Real-time issue detection and alerting
- Integration with NC command workflow
- Performance impact monitoring

## **Test Scenarios Covered**

### **Scenario 1: Stale Process Detection**

- **Problem**: IIS Express process running but not bound to correct ports
- **Detection**: Process exists but port binding to different PID
- **Resolution**: Terminate stale process, clean restart

### **Scenario 2: Port Conflicts**

- **Problem**: Ports 9090/9091 bound to wrong processes or in TIME_WAIT state
- **Detection**: Port binding analysis with PID mapping
- **Resolution**: Force port release, restart with proper binding

### **Scenario 3: Certificate Issues**

- **Problem**: HTTPS binding fails due to certificate problems
- **Detection**: HTTPS connectivity test with certificate validation
- **Resolution**: Certificate refresh, fallback to HTTP if needed

### **Scenario 4: Configuration Errors**

- **Problem**: Application starts with wrong URLs or configuration
- **Detection**: Configuration validation and endpoint testing
- **Resolution**: Configuration correction and restart

### **Scenario 5: Complete Application Failure**

- **Problem**: Application process crashed or failed to start
- **Detection**: Process and connectivity tests both fail
- **Resolution**: Full application restart with diagnostics

## **Implementation Status**

- ✅ Issue documented and tracked
- ⏳ Test harness implementation in progress
- ⏳ Auto-recovery system development pending
- ⏳ Integration with NC command pending
- ⏳ Monitoring system pending

## **Integration Points**

### **NC Command Enhancement**

```powershell
# Enhanced nc.ps1 with health checking
nc -HealthCheck    # Run full diagnostic before starting
nc -AutoRecover    # Automatic issue detection and resolution
nc -Monitor        # Start with continuous health monitoring
```

### **Development Workflow**

```powershell
# Pre-development health check
Test-NoorCanvasHealth -Verbose

# Automatic issue resolution
Repair-NoorCanvasApplication -Force

# Continuous monitoring
Start-HealthMonitor -IntervalSeconds 60
```

## **Success Metrics**

- **Detection Time**: < 30 seconds to identify issues
- **Resolution Time**: < 60 seconds to resolve automatically
- **Success Rate**: > 95% automated resolution success
- **False Positives**: < 5% incorrect issue detection
- **Performance Impact**: < 2% overhead during development

## **Test Cases**

### **Unit Tests**

- Process detection accuracy
- Port binding validation
- HTTP/HTTPS connectivity testing
- Health endpoint response validation
- Configuration parsing and validation

### **Integration Tests**

- End-to-end issue simulation and resolution
- NC command integration testing
- Multiple issue scenario handling
- Performance impact assessment
- Rollback and error handling

### **Stress Tests**

- Repeated issue creation and resolution
- Concurrent process management
- Resource usage monitoring
- Long-running monitoring stability

---

**Next Steps**: Implement ApplicationHealthChecker.ps1 with comprehensive diagnostic capabilities
