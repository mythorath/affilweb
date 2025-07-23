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
    
    # Generate the diff using a temp file for better compatibility
    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
        & git diff $lastPushed $currentCommit > $tempFile 2>&1
        $diffContent = Get-Content $tempFile -Raw
        Remove-Item $tempFile
        
        # Check if there are actual changes and no error messages
        if ($diffContent -and $diffContent.Trim() -ne "" -and !$diffContent.Contains("usage: git diff")) {
            Write-Host "Created diff file: $diffFilename"
            
            # Get file changes list
            $changedFiles = @()
            try {
                $changedFiles = & git diff --name-only $lastPushed $currentCommit 2>$null
                if ($LASTEXITCODE -ne 0) {
                    $changedFiles = @()
                }
            } catch {
                $changedFiles = @()
            }
            
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
    } catch {
        if (Test-Path $tempFile) { Remove-Item $tempFile }
        Write-Host "Error generating diff: $_"
    }
} else {
    Write-Host "No previous push found or no changes to create diff for"
}

exit 0
