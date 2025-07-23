# Diff System Documentation

This repository is configured to automatically create unique diff files for every push to GitHub. This helps maintain a history of changes and makes it easy to review what was modified in each update.

## How It Works

### Automatic Diff Generation
- **Pre-push Hook**: Every time you push changes to GitHub, a pre-push Git hook automatically runs
- **Unique Files**: Each diff gets a unique filename with timestamp and commit hash
- **Complete History**: Diff files are committed to the repository, creating a permanent record

### File Naming Convention
```
diffs/diff_YYYYMMDD_HHMMSS_[commit-hash].patch
diffs/diff_YYYYMMDD_HHMMSS_initial_[commit-hash].patch  (for first push)
```

Example: `diffs/diff_20250723_143022_a1b2c3d.patch`

## Diff File Contents

Each diff file includes:
- **Header Summary**: Date, branch, commit information
- **File List**: All files that were changed
- **Full Diff**: Complete diff showing all changes

Example header:
```
# Diff Summary
# Generated on: 7/23/2025 2:30:22 PM
# Branch: main
# From commit: abc123...
# To commit: def456...
# Files changed:
#   src/app.py
#   README.md
```

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
│   ├── diff_20250723_143022_a1b2c3d.patch
│   ├── diff_20250723_151030_e4f5g6h.patch
│   └── ...
├── .git/
│   └── hooks/
│       ├── pre-push                # Main hook (calls PowerShell)
│       └── pre-push.ps1           # PowerShell implementation
├── create-diff.ps1                 # Manual diff creation script
└── ...
```

## Benefits

1. **Change Tracking**: Easy to see what changed in each push
2. **Code Review**: Simplified review process for team members
3. **Rollback Reference**: Quick reference for reverting changes
4. **Documentation**: Automatic documentation of development progress
5. **Debugging**: Easier to identify when issues were introduced

## Configuration

The system is pre-configured and should work automatically. The hooks are designed to:
- Work on Windows with PowerShell
- Handle both initial and subsequent pushes
- Only create diffs when there are actual changes
- Automatically commit diff files to maintain history

## Troubleshooting

If diffs aren't being created:

1. **Check Hook Permissions**: Ensure the pre-push hook is executable
2. **PowerShell Execution Policy**: Make sure PowerShell can run scripts
3. **Git Configuration**: Verify hooks are enabled in your Git configuration

To manually test the hook:
```powershell
# Run the PowerShell script directly
.\.git\hooks\pre-push.ps1
```

## Customization

You can modify the hook behavior by editing `.git\hooks\pre-push.ps1`:
- Change diff format options
- Modify filename patterns
- Add additional metadata
- Change commit message format

## Notes

- Diff files are tracked in Git and will be pushed to the remote repository
- Empty diffs (no changes) are automatically discarded
- The system uses Git's built-in diff functionality for accuracy
- All diff files use UTF-8 encoding for proper character support
