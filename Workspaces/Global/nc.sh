#!/bin/bash
# NOOR Canvas (nc) - Simple Kestrel launcher for ASP.NET Core Blazor Server

if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo -e "\033[0;36mNOOR Canvas (nc) - ASP.NET Core Kestrel Launcher\033[0m"
    echo "================================================"
    echo ""
    echo "DESCRIPTION:"
    echo "  Launches NOOR Canvas ASP.NET Core Blazor Server application with Kestrel"
    echo "  Automatically kills existing NOOR Canvas processes and clears ports 9090/9091"
    echo ""
    echo "USAGE:"
    echo "  nc                     # Launch with Kestrel server"
    echo "  nc --help              # Show this help"
    echo ""
    echo "PORTS:"
    echo "  HTTP:  http://localhost:9090"
    echo "  HTTPS: https://localhost:9091"
    echo ""
    exit 0
fi

echo -e "\033[0;36mNOOR Canvas - ASP.NET Core Kestrel Launcher\033[0m"
echo "==========================================="

# Get project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"
PROJECT_DIR="$ROOT_DIR/SPA/NoorCanvas"

echo -e "Project directory: $PROJECT_DIR"

# Kill any existing processes for this project
echo -e "\033[0;33mCleaning up existing NOOR Canvas processes...\033[0m"

# Kill processes by name
pkill -f "NoorCanvas" 2>/dev/null || true
pkill -f "dotnet.*NoorCanvas" 2>/dev/null || true

# Kill processes using ports 9090 and 9091
for port in 9090 9091; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "  Killing process $pid using port $port"
        kill -9 $pid 2>/dev/null || true
    fi
done

sleep 2

# Set up the URLs
HTTP_URL="http://localhost:9090"
HTTPS_URL="https://localhost:9091"

echo -e "\033[0;32mLaunching ASP.NET Core application with Kestrel:\033[0m"
echo -e "\033[0;32m  HTTP:  $HTTP_URL\033[0m"
echo -e "\033[0;32m  HTTPS: $HTTPS_URL\033[0m"
echo ""
echo -e "\033[0;33mPress Ctrl+C to stop the server\033[0m"
echo ""

# Change to project directory and run with dotnet
cd "$PROJECT_DIR"

# Set environment variable for URLs
export ASPNETCORE_URLS="$HTTPS_URL;$HTTP_URL"

# Always build to ensure latest code is running
echo -e "\033[0;36mBuilding latest code...\033[0m"
dotnet build --configuration Release --verbosity minimal

if [ $? -ne 0 ]; then
    echo -e "\033[0;31mBuild failed!\033[0m"
    exit 1
fi

echo -e "\033[0;32mBuild completed successfully!\033[0m"
echo ""

# Launch the ASP.NET Core application with fresh build
dotnet run --configuration Release --no-build --urls "$HTTPS_URL;$HTTP_URL"
