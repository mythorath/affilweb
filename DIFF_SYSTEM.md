# Diff System Documentation

This repository is configured to automatically create unique diff files for every commit and push to GitHub. This helps maintain a complete history of changes and makes it easy to review what was modified in each update.

## How It Works

### Automatic Diff Generation
- **Post-commit Hook**: Creates diff files immediately after each commit
- **Pre-push Hook**: Creates additional diff files when pushing to GitHub  
- **Unique Files**: Each diff gets a unique filename with timestamp and commit hash
- **Complete History**: Diff files can be committed to maintain a permanent record

### File Naming Convention
```
diffs/commit_diff_YYYYMMDD_HHMMSS_[commit-hash].patch      (post-commit)
diffs/commit_diff_YYYYMMDD_HHMMSS_initial_[commit-hash].patch  (first commit)
diffs/diff_YYYYMMDD_HHMMSS_[commit-hash].patch             (pre-push)
diffs/manual_diff_YYYYMMDD_HHMMSS_[commit-hash].patch      (manual creation)
```

Examples: 
- `diffs/commit_diff_20250723_143022_a1b2c3d.patch`
- `diffs/diff_20250723_151030_e4f5g6h.patch`

## Diff File Contents

Each diff file includes:
- **Header Summary**: Date, branch, commit information, commit message
- **File List**: All files that were changed
- **Full Diff**: Complete diff showing all changes

Example header:
```
# Commit Diff Summary
# Generated on: 7/23/2025 2:30:22 PM
# Branch: main
# Commit: def456...
# Previous: abc123...
# Message: Add new feature
# Files changed:
#   src/app.py
#   README.md
```

## Hook Types

### Post-Commit Hook
- **Triggers**: After every `git commit`
- **Purpose**: Track all committed changes
- **Files**: Creates `commit_diff_*.patch` files
- **Benefits**: Immediate diff creation, no network dependency

### Pre-Push Hook  
- **Triggers**: Before `git push` to remote
- **Purpose**: Track changes being shared
- **Files**: Creates `diff_*.patch` files
- **Benefits**: Focuses on published changes

## Manual Diff Creation

You can also create diff files manually using the provided script:

```powershell
# Create a diff from last commit to current
.\create-diff.ps1

# Create a diff from specific commit/branch
.\create-diff.ps1 -CompareWith "origin/main"

# Save to custom directory
.\create-diff.ps1 -OutputDir "my-diffs"
```

## Directory Structure

```
AffiliateWeb/
├── diffs/                          # Auto-generated diff files
│   ├── commit_diff_20250723_143022_a1b2c3d.patch    # Post-commit
│   ├── diff_20250723_151030_e4f5g6h.patch           # Pre-push
│   ├── manual_diff_20250723_160000_i7j8k9l.patch    # Manual
│   └── ...
├── .git/
│   └── hooks/
│       ├── post-commit             # Commit-time hook
│       ├── post-commit.ps1         # PowerShell implementation
│       ├── pre-push                # Push-time hook
│       └── pre-push.ps1           # PowerShell implementation
├── hooks/                          # Tracked hook templates
│   ├── post-commit
│   ├── post-commit.ps1
│   ├── pre-push
│   └── pre-push.ps1
├── create-diff.ps1                 # Manual diff creation script
├── install-hooks.ps1               # Hook installation script
└── ...
```

## Installation

1. **Clone the repository**
2. **Install hooks**: Run `.\install-hooks.ps1`
3. **Start working**: Hooks will automatically generate diffs

## Benefits

1. **Comprehensive Tracking**: Both commit-level and push-level diffs
2. **Change History**: Complete record of all modifications
3. **Code Review**: Simplified review process for team members
4. **Rollback Reference**: Quick reference for reverting changes
5. **Documentation**: Automatic documentation of development progress
6. **Debugging**: Easier to identify when issues were introduced
7. **Offline Capability**: Post-commit diffs work without network access

## Configuration

The system is pre-configured and should work automatically. The hooks are designed to:
- Work on Windows with PowerShell
- Handle both initial and subsequent commits/pushes
- Only create diffs when there are actual changes
- Provide detailed metadata in diff headers

## Managing Diff Files

### Committing Diff Files
You can choose to commit diff files to track them in your repository:
```powershell
git add diffs/
git commit -m "Add generated diff files"
```

### Excluding Diff Files  
To exclude diff files from tracking, add to `.gitignore`:
```
diffs/
```

### Cleaning Up Old Diffs
Remove old diff files periodically:
```powershell
# Remove diffs older than 30 days
Get-ChildItem diffs -Name "*.patch" | Where-Object {
    $_.CreationTime -lt (Get-Date).AddDays(-30)
} | Remove-Item
```

## Troubleshooting

If diffs aren't being created:

1. **Check Hook Installation**: Run `.\install-hooks.ps1` again
2. **PowerShell Execution Policy**: 
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. **Test Hooks Manually**:
   ```powershell
   # Test post-commit hook
   .\.git\hooks\post-commit.ps1
   
   # Test pre-push hook  
   .\.git\hooks\pre-push.ps1
   ```

## Customization

You can modify the hook behavior by editing the PowerShell scripts in `.git\hooks\`:
- Change diff format options
- Modify filename patterns
- Add additional metadata
- Change commit message format
- Customize file output locations

## Notes

- Diff files use UTF-8 encoding for proper character support
- Empty diffs (no changes) are automatically discarded
- The system uses Git's built-in diff functionality for accuracy
- Post-commit hooks run locally and don't require network access
- Pre-push hooks may add a slight delay to push operations
