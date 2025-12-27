# 🔐 Git Pre-Commit Security Hook

## Installation Instructions

### For Windows (PowerShell):

1. Open PowerShell as Administrator
2. Navigate to your project:
   ```powershell
   cd "C:\Users\Jyue\Desktop\Projects\Sihat TCM\sihat-tcm"
   ```
3. Run this command to create the hook:
   ```powershell
   @"
   #!/bin/sh
   echo 'Checking for sensitive files...'
   if git diff --cached --name-only | findstr /C:'.env.local'; then
       echo 'ERROR: .env.local should not be committed!'
       exit 1
   fi
   if git diff --cached | findstr /C:'AIzaSy'; then
       echo 'ERROR: API key detected in commit!'
       exit 1
   fi
   echo 'Security check passed'
   "@ | Out-File -FilePath ".git\hooks\pre-commit" -Encoding ASCII
   ```

### For Mac/Linux:

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "Checking for sensitive files..."
if git diff --cached --name-only | grep -q "\.env\.local"; then
    echo "ERROR: .env.local should not be committed!"
    exit 1
fi
if git diff --cached | grep -i "AIzaSy"; then
    echo "ERROR: API key detected in commit!"
    exit 1
fi
echo "Security check passed"
EOF

chmod +x .git/hooks/pre-commit
```

## What This Hook Does

- ❌ Blocks commits containing `.env.local`
- ❌ Blocks commits with hardcoded API keys (pattern: `AIzaSy`)
- ✅ Allows safe commits to proceed

## Testing the Hook

Try to commit `.env.local`:

```bash
git add .env.local
git commit -m "test"
# Should fail with error message
```

## Manual Security Check

Before every commit, run:

```bash
git status
```

Verify that `.env.local` is NOT in the "Changes to be committed" section.
