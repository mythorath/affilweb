# Git Hooks Installation Script
# Run this script to install the pre-push hook for automatic diff generation

Write-Host "Installing Git hooks for automatic diff generation..."

# Check if we're in a git repository
if (!(Test-Path ".git")) {
    Write-Error "Not in a git repository. Please run this script from the repository root."
    exit 1
}

# Create .git/hooks directory if it doesn't exist
$hooksDir = ".git\hooks"
if (!(Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir | Out-Null
}

# Copy hooks from the tracked hooks directory
try {
    Copy-Item "hooks\pre-push" "$hooksDir\pre-push" -Force
    Copy-Item "hooks\pre-push.ps1" "$hooksDir\pre-push.ps1" -Force
    
    Write-Host "✓ Installed pre-push hook"
    Write-Host "✓ Installed pre-push.ps1 script"
    
    # Test if PowerShell execution policy allows running scripts
    $executionPolicy = Get-ExecutionPolicy
    if ($executionPolicy -eq "Restricted") {
        Write-Warning "PowerShell execution policy is Restricted. You may need to run:"
        Write-Warning "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser"
    }
    
    Write-Host ""
    Write-Host "Git hooks installed successfully!"
    Write-Host "The pre-push hook will now automatically create diff files when you push to GitHub."
    Write-Host ""
    Write-Host "To test the system:"
    Write-Host "1. Make some changes to files"
    Write-Host "2. Commit the changes: git add . && git commit -m 'Test changes'"
    Write-Host "3. Push to GitHub: git push"
    Write-Host "4. Check the 'diffs' directory for the generated diff file"
    
} catch {
    Write-Error "Failed to install hooks: $_"
    exit 1
}
