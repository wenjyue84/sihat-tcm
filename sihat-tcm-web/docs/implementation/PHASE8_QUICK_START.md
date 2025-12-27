# Phase 8 Quality Gates - Quick Start Guide

## 🎯 What You Have Now

Your Sihat TCM project now has **automated quality gates** that run:

- ✅ **Locally** - Before every commit (pre-commit hooks)
- ✅ **On GitHub** - On every push and Pull Request (CI workflow)

---

## 🚀 Quick Test: Pre-commit Hooks

### Test 1: Make a small change and commit

```powershell
# Navigate to your project
cd "c:\Users\Jyue\Desktop\Projects\Sihat TCM\sihat-tcm"

# Make a small change to test
echo "// Test comment" >> src/lib/utils.ts

# Stage the change
git add src/lib/utils.ts

# Try to commit (pre-commit hooks will run automatically)
git commit -m "test: verify pre-commit hooks"
```

**What will happen:**

1. `lint-staged` will run automatically
2. Prettier will format your staged files
3. ESLint will check for errors
4. TypeScript will type-check the entire project

**Expected result:**

- If successful: Commit completes ✅
- If errors: Commit is blocked, you'll see error messages ❌

---

## 📝 Available Commands

### Format Code

```powershell
# Check which files need formatting (doesn't change files)
npm run format:check

# Format all files in the project
npm run format

# Format only specific files
npx prettier --write "src/components/**/*.tsx"
```

### Lint Code

```powershell
# Check for linting errors
npm run lint

# Auto-fix linting errors
npx eslint --fix .
```

### Type Check

```powershell
# Check for TypeScript errors
npm run type-check
```

### Build

```powershell
# Verify the app can build
npm run build
```

### Security Audit

```powershell
# Check for vulnerable dependencies
npm audit

# Auto-fix vulnerabilities (if possible)
npm audit fix
```

---

## 🔧 Initial Setup (One-time)

### Option 1: Format All Files Now (Recommended)

```powershell
# This will format all 500+ files that need formatting
npm run format
```

**Warning:** This will modify many files. Make sure:

1. You've committed or stashed any uncommitted work
2. You're on a separate branch (recommended):
   ```powershell
   git checkout -b format-all-files
   ```

### Option 2: Format Files Gradually

- Don't run `npm run format` on the entire project
- Files will be formatted automatically as you work on them
- Pre-commit hooks will format only the files you change

---

## 🧪 Test the GitHub Actions CI Workflow

### Create a Test PR

1. **Create a test branch:**

   ```powershell
   git checkout -b test-quality-gates
   ```

2. **Make a small change:**

   ```powershell
   echo "// Test CI workflow" >> src/lib/utils.ts
   git add src/lib/utils.ts
   git commit -m "test: CI workflow validation"
   ```

3. **Push to GitHub:**

   ```powershell
   git push origin test-quality-gates
   ```

4. **Open a Pull Request** on GitHub
   - Go to your repository on GitHub
   - Click "Pull requests" → "New pull request"
   - Select your test branch
   - Create the PR

5. **Watch the CI workflow run:**
   - You'll see "Quality Gates - CI" check running
   - It will show ✅ if all checks pass
   - It will show ❌ if any check fails

6. **Clean up:**
   ```powershell
   git checkout main
   git branch -D test-quality-gates
   ```

---

## ⚠️ Troubleshooting

### Pre-commit Hook Fails

**Problem:** "Type check failed"

**Solution:**

```powershell
# See the specific TypeScript errors
npm run type-check

# Fix the errors and try committing again
```

**Problem:** "Prettier check failed"

**Solution:**

```powershell
# Format the staged files
npm run format

# Stage the formatted files
git add .

# Try committing again
git commit -m "your message"
```

**Problem:** "ESLint failed"

**Solution:**

```powershell
# See the specific lint errors
npm run lint

# Auto-fix what can be fixed
npx eslint --fix .

# Stage the fixes
git add .

# Try committing again
git commit -m "your message"
```

---

### Skip Pre-commit Hooks (Emergency Only)

**⚠️ USE WITH CAUTION - Only for emergencies!**

```powershell
# This bypasses all quality checks
git commit --no-verify -m "emergency fix"
```

**Note:** Even if you skip local checks, the CI workflow on GitHub will still run.

---

## 📋 Daily Workflow

### When Starting Work

```powershell
# Pull latest changes
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### While Working

- Write your code normally
- Run `npm run dev` to test locally
- Quality checks will run automatically when you commit

### Before Committing

```powershell
# (Optional) Run checks manually to catch issues early
npm run lint
npm run type-check

# Stage your changes
git add .

# Commit (hooks run automatically)
git commit -m "feat: add new feature"
```

### Before Opening a PR

```powershell
# Ensure everything is clean
npm run format
npm run lint
npm run type-check
npm run build

# If all pass, push to GitHub
git push origin feature/your-feature-name
```

---

## 📊 What Each Check Does

| Check          | Command              | What it catches                             | Speed   |
| -------------- | -------------------- | ------------------------------------------- | ------- |
| **Prettier**   | `npm run format`     | Formatting issues (spacing, quotes, etc.)   | ⚡ Fast |
| **ESLint**     | `npm run lint`       | Code quality issues, unused variables, etc. | ⚡ Fast |
| **Type Check** | `npm run type-check` | TypeScript type errors                      | 🐢 Slow |
| **Build**      | `npm run build`      | Compilation errors, missing imports         | 🐢 Slow |
| **Audit**      | `npm audit`          | Security vulnerabilities in dependencies    | ⚡ Fast |

---

## 🎓 Learning Resources

- **Phase 8 Implementation:** [PHASE8_IMPLEMENTATION_SUMMARY.md](./PHASE8_IMPLEMENTATION_SUMMARY.md)
- **Code Review Guidelines:** [CODE_REVIEW_GUIDELINES.md](./CODE_REVIEW_GUIDELINES.md)
- **Developer Manual:** [DEVELOPER_MANUAL.md](./DEVELOPER_MANUAL.md)
- **Prettier Docs:** https://prettier.io/docs/en/
- **ESLint Docs:** https://eslint.org/docs/latest/
- **Husky Docs:** https://typicode.github.io/husky/

---

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] Pre-commit hooks run when I commit
- [ ] Prettier formats my files automatically
- [ ] ESLint catches errors
- [ ] TypeScript checks types before commit
- [ ] CI workflow runs on GitHub when I push
- [ ] All team members have the same setup

---

## 🚦 Next Steps

1. **Choose your approach:**
   - [ ] Format all files now with `npm run format`
   - [ ] Format files gradually as you work

2. **Test the setup:**
   - [ ] Make a test commit to verify local hooks
   - [ ] Create a test PR to verify CI workflow

3. **Share with your team:**
   - [ ] Ensure all developers run `npm install` to get husky
   - [ ] Share these documentation files
   - [ ] Establish code review practices

---

## 💡 Pro Tips

**Tip 1:** Add this to your VS Code settings for auto-format on save:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

**Tip 2:** Run type-check in watch mode while developing:

```powershell
npm run type-check -- --watch
```

**Tip 3:** Use the format script before big commits:

```powershell
npm run format && git add . && git commit -m "your message"
```

---

## 🎉 You're All Set!

Your Sihat TCM project now has enterprise-grade quality gates. Every commit and every PR will be automatically validated for:

- Code formatting
- Code quality
- Type safety
- Build integrity
- Security

**Happy coding! 🚀**
