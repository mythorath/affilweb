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

# Generate the diff
$diffOutput = git diff $CompareWith..HEAD

if ([string]::IsNullOrWhiteSpace($diffOutput)) {
    Write-Host "No changes found between $CompareWith and HEAD"
    exit 0
}

# Get changed files
$changedFiles = git diff --name-only $CompareWith..HEAD

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
$fullContent = $summaryContent + $diffOutput

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
