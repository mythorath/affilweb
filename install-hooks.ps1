# Git Hooks Installation Script
# Run this script to install the hooks for automatic diff generation

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
    # Install pre-push hook (for push-time diff generation)
    Copy-Item "hooks\pre-push" "$hooksDir\pre-push" -Force
    Copy-Item "hooks\pre-push.ps1" "$hooksDir\pre-push.ps1" -Force
    Write-Host "✓ Installed pre-push hook"
    
    # Install post-commit hook (for commit-time diff generation)
    Copy-Item "hooks\post-commit" "$hooksDir\post-commit" -Force
    Copy-Item "hooks\post-commit.ps1" "$hooksDir\post-commit.ps1" -Force
    Write-Host "✓ Installed post-commit hook"
    
    # Test if PowerShell execution policy allows running scripts
    $executionPolicy = Get-ExecutionPolicy
    if ($executionPolicy -eq "Restricted") {
        Write-Warning "PowerShell execution policy is Restricted. You may need to run:"
        Write-Warning "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser"
    }
    
    Write-Host ""
    Write-Host "Git hooks installed successfully!"
    Write-Host ""
    Write-Host "How the diff system works:"
    Write-Host "• Post-commit hook: Creates diff files after each commit"
    Write-Host "• Pre-push hook: Creates diff files when pushing to GitHub"
    Write-Host "• Manual script: Create diffs on demand with create-diff.ps1"
    Write-Host ""
    Write-Host "To test the system:"
    Write-Host "1. Make some changes to files"
    Write-Host "2. Commit the changes: git add . && git commit -m 'Test changes'"
    Write-Host "3. Check the 'diffs' directory for the generated diff file"
    Write-Host "4. Push to GitHub: git push"
    
} catch {
    Write-Error "Failed to install hooks: $_"
    exit 1
}
