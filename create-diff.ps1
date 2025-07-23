# Manual Diff Generator Script
# Run this script to manually create a diff file for current changes

param(
    [string]$OutputDir = "diffs",
    [string]$CompareWith = "HEAD~1"
)

# Ensure we're in a git repository
if (!(Test-Path ".git")) {
    Write-Error "Not in a git repository. Please run this script from the repository root."
    exit 1
}

# Create output directory if it doesn't exist
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "Created directory: $OutputDir"
}

# Get current information
$currentBranch = git symbolic-ref --short HEAD
$currentCommit = git rev-parse HEAD
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$shortCommit = $currentCommit.Substring(0, 7)

# Create diff filename
$diffFilename = "$OutputDir/manual_diff_${timestamp}_${shortCommit}.patch"

Write-Host "Generating diff from $CompareWith to HEAD..."

# Test if the comparison commit exists
try {
    git rev-parse --verify "$CompareWith" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Commit '$CompareWith' not found"
        exit 1
    }
} catch {
    Write-Error "Commit '$CompareWith' not found"
    exit 1
}

# Generate the diff using git diff-tree or git show for better compatibility
$tempFile = [System.IO.Path]::GetTempFileName()
try {
    # Use git show to get changes if comparing with a single commit
    if ($CompareWith -eq "HEAD~1" -or $CompareWith -match "^[a-f0-9]+$") {
        & git diff "$CompareWith" HEAD > $tempFile 2>&1
    } else {
        & git diff "$CompareWith..HEAD" > $tempFile 2>&1
    }
    
    $diffContent = Get-Content $tempFile -Raw
    Remove-Item $tempFile
    
    if ([string]::IsNullOrWhiteSpace($diffContent) -or $diffContent.Contains("usage: git diff")) {
        Write-Host "No changes found between $CompareWith and HEAD"
        exit 0
    }
} catch {
    Write-Error "Failed to generate diff: $_"
    if (Test-Path $tempFile) { Remove-Item $tempFile }
    exit 1
}

# Get changed files
$changedFiles = @()
try {
    $changedFiles = & git diff --name-only "$CompareWith" HEAD 2>$null
    if ($LASTEXITCODE -ne 0) {
        $changedFiles = @()
    }
} catch {
    $changedFiles = @()
}

# Create summary content
$summaryContent = @"
# Manual Diff Summary
# Generated on: $(Get-Date)
# Branch: $currentBranch
# From: $CompareWith
# To: HEAD ($currentCommit)
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

Write-Host "Diff file created: $diffFilename"
Write-Host "Changed files count: $($changedFiles.Count)"

# Ask if user wants to add to git
$response = Read-Host "Add this diff file to git? (y/N)"
if ($response -eq "y" -or $response -eq "Y") {
    git add $diffFilename
    Write-Host "Added $diffFilename to git staging area"
    
    $commitResponse = Read-Host "Commit the diff file? (y/N)"
    if ($commitResponse -eq "y" -or $commitResponse -eq "Y") {
        git commit -m "Add manual diff file: $diffFilename"
        Write-Host "Committed diff file to repository"
    }
}
