# Post-commit hook to create diff files for each commit (PowerShell version)

# Get the current branch
$currentBranch = git symbolic-ref --short HEAD

# Create diffs directory if it doesn't exist
if (!(Test-Path "diffs")) {
    New-Item -ItemType Directory -Path "diffs" | Out-Null
}

# Get the current timestamp for unique filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Get the current commit hash
$currentCommit = git rev-parse HEAD

# Get the previous commit
$previousCommit = $null
try {
    $previousCommit = git rev-parse HEAD~1 2>$null
    if ($LASTEXITCODE -ne 0) {
        $previousCommit = $null
    }
} catch {
    $previousCommit = $null
}

if ($previousCommit) {
    # Create diff file name
    $shortCommit = $currentCommit.Substring(0, 7)
    $diffFilename = "diffs/commit_diff_${timestamp}_${shortCommit}.patch"
    
    # Generate the diff using a temp file for better compatibility
    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
        & git diff $previousCommit $currentCommit > $tempFile 2>&1
        $diffContent = Get-Content $tempFile -Raw
        Remove-Item $tempFile
        
        # Check if there are actual changes and no error messages
        if ($diffContent -and $diffContent.Trim() -ne "" -and !$diffContent.Contains("usage: git diff")) {
            # Get file changes list
            $changedFiles = @()
            try {
                $changedFiles = & git diff --name-only $previousCommit $currentCommit 2>$null
                if ($LASTEXITCODE -ne 0) {
                    $changedFiles = @()
                }
            } catch {
                $changedFiles = @()
            }
            
            # Get commit message
            $commitMessage = git log -1 --pretty=format:"%s" $currentCommit
            
            # Create summary content
            $summaryContent = @"
# Commit Diff Summary
# Generated on: $(Get-Date)
# Branch: $currentBranch
# Commit: $currentCommit
# Previous: $previousCommit
# Message: $commitMessage
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
            
            Write-Host "Created commit diff file: $diffFilename"
        }
    } catch {
        if (Test-Path $tempFile) { Remove-Item $tempFile }
        Write-Host "Error generating commit diff: $_"
    }
} else {
    # First commit - create initial diff
    $shortCommit = $currentCommit.Substring(0, 7)
    $diffFilename = "diffs/commit_diff_${timestamp}_initial_${shortCommit}.patch"
    
    # Create diff showing all current files
    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
        & git show $currentCommit > $tempFile 2>&1
        $diffContent = Get-Content $tempFile -Raw
        Remove-Item $tempFile
        
        if ($diffContent -and !$diffContent.Contains("fatal:")) {
            # Get all files in the repository
            $allFiles = git ls-tree -r --name-only HEAD
            
            # Get commit message
            $commitMessage = git log -1 --pretty=format:"%s" $currentCommit
            
            # Create summary content
            $summaryContent = @"
# Initial Commit Diff Summary
# Generated on: $(Get-Date)
# Branch: $currentBranch
# Initial commit: $currentCommit
# Message: $commitMessage
# Files added:
"@
            
            foreach ($file in $allFiles) {
                $summaryContent += "`n#   $file"
            }
            
            $summaryContent += "`n`n"
            
            # Combine summary and diff
            $fullContent = $summaryContent + $diffContent
            
            # Write to file
            $fullContent | Out-File -FilePath $diffFilename -Encoding UTF8
            
            Write-Host "Created initial commit diff file: $diffFilename"
        }
    } catch {
        if (Test-Path $tempFile) { Remove-Item $tempFile }
        Write-Host "Error generating initial commit diff: $_"
    }
}

exit 0
