# Phase 8: Development Workflow & Quality Gates

**Version**: 1.0  
**Last Updated**: December 2024

## Table of Contents

1. [Overview](#overview)
2. [What Was Implemented](#what-was-implemented)
3. [Quick Start Guide](#quick-start-guide)
4. [How It Works](#how-it-works)
5. [Visual Workflow Diagrams](#visual-workflow-diagrams)
6. [Configuration Details](#configuration-details)
7. [Testing the Setup](#testing-the-setup)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Phase 8 implements **automated quality gates** for the Sihat TCM medical application, balancing strict medical safety requirements with development speed. The system includes:

- ✅ **Local Quality Gates** - Pre-commit hooks that run before every commit
- ✅ **CI/CD Pipeline** - Automated checks on every push and Pull Request
- ✅ **Code Formatting** - Automatic code formatting with Prettier
- ✅ **Type Safety** - TypeScript type checking
- ✅ **Security Audits** - Dependency vulnerability scanning

---

## What Was Implemented

### 1. Local Quality Gates (Pre-commit Hooks)

#### Installed Tools

- **Husky** v9.1.7 - Git hooks manager
- **lint-staged** v16.2.7 - Run linters on staged files only
- **Prettier** v3.7.4 - Code formatter

#### Configuration Files Created

1. **`.prettierrc.json`** - Prettier configuration
   - Semi-colons: enabled
   - Quote style: double quotes
   - Print width: 100 characters
   - Tab width: 2 spaces
   - Trailing commas: ES5 style

2. **`.prettierignore`** - Files to exclude from formatting
   - Dependencies (`node_modules`)
   - Build outputs (`.next`, `out`, `build`)
   - Environment files
   - Generated files

3. **`.lintstagedrc.json`** - Lint-staged configuration
   - Runs `prettier --write` on TypeScript/JavaScript files
   - Runs `eslint --fix` on TypeScript/JavaScript files
   - Runs `prettier --write` on JSON, Markdown, YAML files

4. **`.husky/pre-commit`** - Pre-commit hook
   - Executes `npx lint-staged` (prettier + eslint)
   - Executes `npm run type-check` (TypeScript type checking)
   - **Blocks commit if any check fails** ✅

#### New NPM Scripts

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "prepare": "husky"
}
```

### 2. CI/CD Pipeline (GitHub Actions)

#### New Workflow: `.github/workflows/ci.yml`

**Triggers:**
- Push to `main`, `develop`, `staging` branches
- Pull requests to `main`, `develop` branches

**Quality Gates (runs in order):**

1. **Checkout code** - Gets latest code from repository
2. **Setup Node.js** - Installs Node.js v18 with npm caching
3. **Install dependencies** - Runs `npm ci` for deterministic installs
4. **ESLint** - Runs `npm run lint` to catch syntax/rule errors
5. **TypeScript Type Check** - Runs `npm run type-check` to catch type errors
6. **Build** - Runs `npm run build` to ensure app compiles
7. **Security Audit** - Runs `npm audit --audit-level=moderate` to scan for vulnerabilities
8. **Status Check** - Final job that reports overall pass/fail status

**Behavior:**
- All checks must pass for the workflow to succeed
- Security audit failures are logged but don't block (continue-on-error: true)
- Failed workflows prevent merging (if branch protection is enabled)

---

## Quick Start Guide

### What You Have Now

Your Sihat TCM project now has **automated quality gates** that run:

- ✅ **Locally** - Before every commit (pre-commit hooks)
- ✅ **On GitHub** - On every push and Pull Request (CI workflow)

### Quick Test: Pre-commit Hooks

#### Test 1: Make a small change and commit

```powershell
# Navigate to your project
cd "C:\Users\Jyue\Desktop\Projects\Sihat TCM\sihat-tcm-web"

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

### Available Commands

#### Format Code

```powershell
# Check which files need formatting (doesn't change files)
npm run format:check

# Format all files in the project
npm run format

# Format only specific files
npx prettier --write "src/components/**/*.tsx"
```

#### Lint Code

```powershell
# Check for linting errors
npm run lint

# Auto-fix linting errors
npx eslint --fix .
```

#### Type Check

```powershell
# Check for TypeScript errors
npm run type-check
```

#### Build

```powershell
# Verify the app can build
npm run build
```

#### Security Audit

```powershell
# Check for vulnerable dependencies
npm audit

# Auto-fix vulnerabilities (if possible)
npm audit fix
```

### Initial Setup (One-time)

#### Option 1: Format All Files Now (Recommended)

```powershell
# This will format all files that need formatting
npm run format
```

This may take a few minutes for the first run, but subsequent runs will be faster.

#### Option 2: Format Files Incrementally

Files will be formatted automatically when you commit them. No action needed.

---

## How It Works

### Local Development Flow

1. **Developer makes changes** and stages files with `git add`
2. **Developer runs `git commit`**
3. **Husky triggers pre-commit hook** which:
   - Runs `lint-staged` on only the staged files
   - Prettier formats the code automatically
   - ESLint checks for errors and auto-fixes issues
   - TypeScript compiler checks for type errors
4. **If all checks pass** → Commit succeeds ✅
5. **If any check fails** → Commit is blocked ❌

### CI/CD Flow

1. **Developer pushes to GitHub or opens PR**
2. **GitHub Actions triggers CI workflow**
3. **Workflow runs all quality gates** (lint, type-check, build, audit)
4. **If all gates pass** → Green checkmark on PR ✅
5. **If any gate fails** → Red X on PR, merge blocked ❌

### What Runs Automatically

#### Local Quality Gates (Pre-commit Hooks)

**Trigger:** Every time you run `git commit`

**Checks:**
1. ✅ **Prettier** - Auto-formats code (spacing, quotes, semicolons)
2. ✅ **ESLint** - Checks code quality and fixes auto-fixable issues
3. ✅ **TypeScript** - Checks for type errors (`tsc --noEmit`)

**Result:**
- All checks pass → Commit succeeds ✅
- Any check fails → Commit blocked ❌

**Speed:** ~7-20 seconds per commit

#### CI/CD Pipeline (GitHub Actions)

**Trigger:** Every push to `main`, `develop`, `staging` or any Pull Request

**Checks:**
1. ✅ **Checkout code** - Gets latest code
2. ✅ **Install dependencies** - Runs `npm ci`
3. ✅ **ESLint** - `npm run lint`
4. ✅ **TypeScript** - `npm run type-check`
5. ✅ **Build** - `npm run build`
6. ✅ **Security Audit** - `npm audit --audit-level=moderate`

**Result:**
- All checks pass → Green checkmark ✅
- Any check fails → Red X, blocks merge ❌

**Speed:** ~2-3 minutes per run

---

## Visual Workflow Diagrams

### Quality Gates Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SIHAT TCM QUALITY GATES WORKFLOW                  │
└─────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────┐
│                          LOCAL DEVELOPMENT                              │
└────────────────────────────────────────────────────────────────────────┘

    Developer writes code
           │
           ▼
    ┌─────────────┐
    │  git add .  │
    └──────┬──────┘
           │
           ▼
    ┌────────────────┐
    │  git commit    │
    └────────┬───────┘
             │
             ▼
    ┌────────────────────────────────────────┐
    │  🎣 HUSKY PRE-COMMIT HOOK TRIGGERED    │
    └────────────────┬───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   📝 LINT-STAGED      │
         │   (Staged files only) │
         └─────────┬─────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌─────────┐         ┌──────────┐
   │ Prettier│         │ ESLint   │
   │ Format  │         │ Check    │
   └────┬────┘         └────┬─────┘
        │                   │
        └──────────┬────────┘
                   │
                   ▼
        ┌────────────────────┐
        │  📘 TYPESCRIPT      │
        │  Type Check         │
        └─────────┬──────────┘
                  │
        ┌─────────┴─────────┐
        │                    │
        ▼                    ▼
   ✅ All Pass          ❌ Any Fail
        │                    │
        ▼                    ▼
   Commit Success      Commit Blocked
        │                    │
        ▼                    ▼
   Code Formatted      Fix Errors & Retry


┌────────────────────────────────────────────────────────────────────────┐
│                          CI/CD PIPELINE                                │
└────────────────────────────────────────────────────────────────────────┘

    Developer pushes to GitHub
           │
           ▼
    ┌──────────────────────┐
    │  GitHub Actions      │
    │  Workflow Triggered  │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  1. Checkout Code    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  2. Setup Node.js    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  3. Install Deps     │
    └──────────┬───────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ┌────────┐   ┌──────────┐
   │ ESLint │   │ TypeScript│
   └────┬───┘   └─────┬─────┘
        │             │
        └──────┬──────┘
               │
               ▼
        ┌──────────────┐
        │  5. Build    │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │ 6. Security  │
        │    Audit     │
        └──────┬───────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ✅ All Pass   ❌ Any Fail
        │             │
        ▼             ▼
   Green Check    Red X
   Merge Allowed  Merge Blocked
```

---

## Configuration Details

### Prettier Configuration (`.prettierrc.json`)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Lint-Staged Configuration (`.lintstagedrc.json`)

```json
{
  "*.{ts,tsx,js,jsx}": [
    "prettier --write",
    "eslint --fix"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
```

### Husky Pre-commit Hook (`.husky/pre-commit`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run type-check
```

### GitHub Actions Workflow (`.github/workflows/ci.yml`)

The workflow includes:
- Node.js setup with caching
- Dependency installation
- ESLint check
- TypeScript type check
- Build verification
- Security audit

---

## Testing the Setup

### Test Pre-commit Hooks

1. **Make a small change** to any TypeScript file
2. **Introduce a formatting issue** (e.g., remove a semicolon, add extra spaces)
3. **Stage and commit:**
   ```bash
   git add .
   git commit -m "test: verify pre-commit hooks"
   ```
4. **Expected Result:**
   - Prettier auto-formats your code
   - ESLint checks for errors
   - TypeScript checks types
   - Commit succeeds if no errors

### Test CI/CD Pipeline

1. **Create a new branch:**
   ```bash
   git checkout -b test-quality-gates
   ```
2. **Make a change and push:**
   ```bash
   git add .
   git commit -m "test: CI workflow"
   git push origin test-quality-gates
   ```
3. **Open a Pull Request on GitHub**
4. **Expected Result:**
   - GitHub Actions runs automatically
   - You'll see the "Quality Gates - CI" workflow running
   - All checks should appear green if code is valid

### Manual Testing Commands

```bash
# Format all files
npm run format

# Check if files are formatted correctly (without changing them)
npm run format:check

# Run linting
npm run lint

# Type check
npm run type-check

# Build the application
npm run build

# Security audit
npm audit
```

---

## Troubleshooting

### Pre-commit Hook Not Running

**Problem:** Hooks don't run when committing

**Solutions:**
1. Verify Husky is installed: `ls .husky`
2. Reinstall Husky: `npm run prepare`
3. Check file permissions: Ensure `.husky/pre-commit` is executable

### TypeScript Errors Blocking Commits

**Problem:** Type errors prevent commits

**Solutions:**
1. Fix type errors: `npm run type-check` to see all errors
2. Use `// @ts-ignore` sparingly (only when necessary)
3. Fix types properly for better code quality

### Prettier Formatting Issues

**Problem:** Files not formatting correctly

**Solutions:**
1. Check `.prettierrc.json` configuration
2. Verify file is not in `.prettierignore`
3. Run manually: `npx prettier --write <file>`

### CI Pipeline Failing

**Problem:** GitHub Actions workflow fails

**Solutions:**
1. Check workflow logs in GitHub Actions tab
2. Run checks locally first: `npm run lint && npm run type-check && npm run build`
3. Fix errors before pushing

### Slow Pre-commit Hooks

**Problem:** Commits take too long

**Solutions:**
1. This is normal for the first run (~20 seconds)
2. Subsequent commits are faster (~7 seconds)
3. TypeScript check runs on entire project (necessary for safety)

---

## Benefits

### For Medical Applications

- ✅ **Type Safety** - Catches errors before they reach production
- ✅ **Code Consistency** - Uniform formatting across the codebase
- ✅ **Security** - Automated vulnerability scanning
- ✅ **Quality** - Enforces coding standards

### For Development Team

- ✅ **Faster Reviews** - Code is already formatted and linted
- ✅ **Fewer Bugs** - Type checking catches errors early
- ✅ **Consistent Style** - No more formatting debates
- ✅ **Automated** - No manual steps required

---

## Files Created

### Configuration Files

1. **`.prettierrc.json`** - Prettier code formatter configuration
2. **`.prettierignore`** - Files to exclude from formatting
3. **`.lintstagedrc.json`** - Lint-staged configuration (runs on staged files only)
4. **`.husky/pre-commit`** - Git pre-commit hook script

### CI/CD Workflow

5. **`.github/workflows/ci.yml`** - GitHub Actions workflow for quality gates

### Dependencies Added

```json
{
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^16.2.7",
    "prettier": "^3.7.4"
  }
}
```

---

**Last Updated**: December 2024  
**Version**: 1.0



