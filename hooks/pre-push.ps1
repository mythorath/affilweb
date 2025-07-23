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

# Check if remote branch exists and get the last pushed commit
$lastPushed = $null
try {
    $lastPushed = git rev-parse $remoteBranch 2>$null
    if ($LASTEXITCODE -ne 0) {
        $lastPushed = $null
    }
} catch {
    $lastPushed = $null
}

if ($lastPushed -and $lastPushed -ne $currentCommit) {
    # Create diff file name
    $shortCommit = $currentCommit.Substring(0, 7)
    $diffFilename = "diffs/diff_${timestamp}_${shortCommit}.patch"
    
    # Generate the diff
    $diffContent = git diff $lastPushed..$currentCommit
    
    # Check if there are changes
    if ($diffContent -and $diffContent.Trim() -ne "") {
        Write-Host "Created diff file: $diffFilename"
        
        # Get file changes list
        $changedFiles = git diff --name-only $lastPushed..$currentCommit
        
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
        
        $summaryContent += "`n`n"
        
        # Combine summary and diff
        $fullContent = $summaryContent + $diffContent
        
        # Write to file
        $fullContent | Out-File -FilePath $diffFilename -Encoding UTF8
        
        # Add the diff file to git and commit it
        git add $diffFilename
        git commit -m "Add diff file: $diffFilename" --no-verify
    } else {
        Write-Host "No changes to create diff for"
    }
} else {
    # First push or no changes - create diff against empty tree for initial commit
    $shortCommit = $currentCommit.Substring(0, 7)
    $diffFilename = "diffs/diff_${timestamp}_initial_${shortCommit}.patch"
    
    # Generate diff for all files (against empty tree)
    $diffContent = git show --pretty=format: --name-only $currentCommit
    
    if ($diffContent) {
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
        
        $summaryContent += "`n`n"
        
        # Get the actual diff content
        $fullDiff = git show $currentCommit
        
        # Combine summary and diff
        $fullContent = $summaryContent + $fullDiff
        
        # Write to file
        $fullContent | Out-File -FilePath $diffFilename -Encoding UTF8
        
        Write-Host "Created initial diff file: $diffFilename"
        
        # Add the diff file to git and commit it
        git add $diffFilename
        git commit -m "Add initial diff file: $diffFilename" --no-verify
    } else {
        Write-Host "No changes to create diff for"
    }
}

exit 0
