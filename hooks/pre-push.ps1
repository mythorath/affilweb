# Pre-push hook to create diff files for each push (PowerShell version)

# Get the current branch
$currentBranch = git symbolic-ref --short HEAD

# Get the remote branch reference
$remoteBranch = "origin/$currentBranch"

# Create diffs directory if it doesn't exist
if (!(Test-Path "diffs")) {
    New-Item -ItemType Directory -Path "diffs" | Out-Null
}

# Get the current timestamp for unique filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Get the current commit hash
$currentCommit = git rev-parse HEAD

# Check if remote branch exists
$remoteBranchExists = $false
try {
    git rev-parse --verify $remoteBranch 2>$null | Out-Null
    $remoteBranchExists = $true
} catch {
    $remoteBranchExists = $false
}

if ($remoteBranchExists) {
    # Get the last pushed commit
    $lastPushed = git rev-parse $remoteBranch
    
    # Create diff file name
    $shortCommit = $currentCommit.Substring(0, 7)
    $diffFilename = "diffs/diff_${timestamp}_${shortCommit}.patch"
    
    # Generate the diff
    git diff $lastPushed..HEAD | Out-File -FilePath $diffFilename -Encoding UTF8
    
    # Check if diff file has content
    if ((Get-Item $diffFilename).Length -gt 0) {
        Write-Host "Created diff file: $diffFilename"
        
        # Get file changes list
        $changedFiles = git diff --name-only $lastPushed..HEAD
        
        # Create summary content
        $summaryContent = @"
# Diff Summary
# Generated on: $(Get-Date)
# Branch: $currentBranch
# From commit: $lastPushed
# To commit: $currentCommit
# Files changed:
"@
        
        foreach ($file in $changedFiles) {
            $summaryContent += "`n#   $file"
        }
        
        $summaryContent += "`n"
        
        # Read the original diff content
        $diffContent = Get-Content $diffFilename -Raw
        
        # Combine summary and diff
        $fullContent = $summaryContent + $diffContent
        
        # Write back to file
        $fullContent | Out-File -FilePath $diffFilename -Encoding UTF8
        
        # Add the diff file to git and commit it
        git add $diffFilename
        git commit -m "Add diff file: $diffFilename" --no-verify
    } else {
        # Remove empty diff file
        Remove-Item $diffFilename
        Write-Host "No changes to create diff for"
    }
} else {
    # First push - create diff against empty tree
    $shortCommit = $currentCommit.Substring(0, 7)
    $diffFilename = "diffs/diff_${timestamp}_initial_${shortCommit}.patch"
    
    # Generate diff for all files (against empty tree)
    git diff 4b825dc642cb6eb9a060e54bf8d69288fbee4904..HEAD | Out-File -FilePath $diffFilename -Encoding UTF8
    
    # Get all files in the repository
    $allFiles = git ls-tree -r --name-only HEAD
    
    # Create summary content
    $summaryContent = @"
# Initial Diff Summary
# Generated on: $(Get-Date)
# Branch: $currentBranch
# Initial commit: $currentCommit
# Files added:
"@
    
    foreach ($file in $allFiles) {
        $summaryContent += "`n#   $file"
    }
    
    $summaryContent += "`n"
    
    # Read the original diff content
    $diffContent = Get-Content $diffFilename -Raw
    
    # Combine summary and diff
    $fullContent = $summaryContent + $diffContent
    
    # Write back to file
    $fullContent | Out-File -FilePath $diffFilename -Encoding UTF8
    
    Write-Host "Created initial diff file: $diffFilename"
    
    # Add the diff file to git and commit it
    git add $diffFilename
    git commit -m "Add initial diff file: $diffFilename" --no-verify
}

exit 0
