#!/bin/bash
# Setup script for NOOR Canvas Mac aliases

echo "Setting up NOOR Canvas aliases for Mac..."

# Get the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Create alias commands
NC_ALIAS="alias nc='$ROOT_DIR/Workspaces/Global/nc.sh'"
NCB_ALIAS="alias ncb='$ROOT_DIR/Workspaces/Global/ncb.sh'"

# Detect shell configuration file
if [ -f ~/.zshrc ]; then
    SHELL_RC=~/.zshrc
    SHELL_NAME="zsh"
elif [ -f ~/.bashrc ]; then
    SHELL_RC=~/.bashrc
    SHELL_NAME="bash"
else
    SHELL_RC=~/.zshrc
    SHELL_NAME="zsh"
    touch $SHELL_RC
fi

echo "Detected shell: $SHELL_NAME"
echo "Configuration file: $SHELL_RC"

# Check if aliases already exist
if grep -q "alias nc=" "$SHELL_RC" 2>/dev/null; then
    echo "NOOR Canvas aliases already exist in $SHELL_RC"
    echo "Updating existing aliases..."
    # Remove old aliases
    sed -i.bak '/# NOOR Canvas aliases/d' "$SHELL_RC"
    sed -i.bak '/alias nc=/d' "$SHELL_RC"
    sed -i.bak '/alias ncb=/d' "$SHELL_RC"
fi

# Add new aliases
echo "" >> "$SHELL_RC"
echo "# NOOR Canvas aliases for Mac" >> "$SHELL_RC"
echo "$NC_ALIAS" >> "$SHELL_RC"
echo "$NCB_ALIAS" >> "$SHELL_RC"

echo ""
echo "✅ Aliases added successfully!"
echo ""
echo "Added to $SHELL_RC:"
echo "  - nc  → Launch NOOR Canvas with Kestrel"
echo "  - ncb → Build and launch NOOR Canvas"
echo ""
echo "To use these commands, either:"
echo "  1. Run: source $SHELL_RC"
echo "  2. Or restart your terminal"
echo ""
echo "Then you can use:"
echo "  nc     # Launch the application"
echo "  ncb    # Build and launch"
echo ""
