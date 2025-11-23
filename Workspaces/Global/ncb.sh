#!/bin/bash
# NOOR Canvas Build (ncb) - Build and Launch with Kestrel

if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo -e "\033[0;36mNOOR Canvas Build (ncb) - Build and Launch Application\033[0m"
    echo "======================================================"
    echo ""
    echo "DESCRIPTION:"
    echo "  Builds the application and then launches with Kestrel server"
    echo ""
    echo "USAGE:"
    echo "  ncb                    # Build and launch application"
    echo "  ncb --help             # Show this help"
    echo ""
    echo "WORKFLOW:"
    echo "  1. Kill all running NOOR Canvas and dotnet processes"
    echo "  2. Clear processes using ports 9090/9091"
    echo "  3. Build the NOOR Canvas application in Release mode"
    echo "  4. Launch with Kestrel server on ports 9090/9091"
    echo ""
    exit 0
fi

clear

echo -e "\033[0;36mNOOR Canvas Build (ncb) - Starting...\033[0m"
echo "===================================="

# Get project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"
PROJECT_DIR="$ROOT_DIR/SPA/NoorCanvas"

echo "Project directory: $PROJECT_DIR"

# Step 1: Kill running processes
echo -e "\033[0;33mCleaning up running NOOR Canvas processes...\033[0m"

# Kill by process name
pkill -f "NoorCanvas" 2>/dev/null || true
pkill -f "dotnet.*NoorCanvas" 2>/dev/null || true

# Kill by port usage (anything using 9090/9091)
for port in 9090 9091; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "  Killing process $pid using port $port"
        kill -9 $pid 2>/dev/null || true
    fi
done

echo "  Waiting for processes to terminate..."
sleep 3

# Step 2: Build the application
echo -e "\033[0;36mBuilding NOOR Canvas application (Release mode)...\033[0m"
cd "$PROJECT_DIR"

# Clean previous build to ensure fresh executable
echo "  Cleaning previous build..."
dotnet clean --configuration Release --verbosity quiet

# Build fresh executable
dotnet build --configuration Release --verbosity minimal

if [ $? -ne 0 ]; then
    echo -e "\033[0;31mBuild failed!\033[0m"
    exit 1
fi

echo -e "\033[0;32mBuild completed successfully! Fresh executable ready.\033[0m"

# Step 3: Launch application with Kestrel
echo -e "\033[0;36mLaunching ASP.NET Core application with Kestrel...\033[0m"

NC_SCRIPT="$ROOT_DIR/Workspaces/Global/nc.sh"

if [ -f "$NC_SCRIPT" ]; then
    bash "$NC_SCRIPT"
else
    echo -e "\033[0;33mWARNING: nc.sh not found, running directly...\033[0m"
    export ASPNETCORE_URLS="https://localhost:9091;http://localhost:9090"
    dotnet run --configuration Release --no-build --urls "https://localhost:9091;http://localhost:9090"
fi

echo -e "\033[0;32mNCB completed!\033[0m"
