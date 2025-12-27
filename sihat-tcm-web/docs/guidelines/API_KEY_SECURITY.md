# 🔐 API Key Security Guide

## ⚠️ CRITICAL: Never Commit API Keys to Git!

Your Gemini API key is stored in `.env.local` and should **NEVER** be committed to version control.

### Current Protection Status

✅ `.env.local` is in `.gitignore`
✅ `.env*` pattern blocks all env files
✅ API key is only used server-side

### How Your Key Was Leaked Before

Common causes:

1. ❌ Accidentally committed `.env.local` to Git
2. ❌ Shared screenshots containing the key
3. ❌ Pasted key in public chat/forum
4. ❌ Deployed to Vercel without using environment variables

### Prevention Checklist

#### 1. Git Protection (Already Configured ✅)

- `.gitignore` includes `.env*`
- Run `git status` before committing to verify `.env.local` is not tracked

#### 2. Vercel Deployment

When deploying to Vercel:

- **DO NOT** commit `.env.local`
- **DO** add `GOOGLE_GENERATIVE_AI_API_KEY` in Vercel Dashboard:
  1. Go to Project Settings → Environment Variables
  2. Add key: `GOOGLE_GENERATIVE_AI_API_KEY`
  3. Add value: `[YOUR_KEY]`
  4. Select all environments (Production, Preview, Development)

#### 3. Screenshot Safety

- Never take screenshots of:
  - `.env.local` file
  - Vercel environment variables page
  - Google AI Studio API keys page
  - Terminal output showing the full key

#### 4. Code Review

Before committing, check:

```bash
git diff
```

Look for any hardcoded API keys in:

- Source code files
- Configuration files
- Documentation

#### 5. API Key Restrictions (Recommended)

In Google AI Studio:

1. Go to your API key settings
2. Add "Application restrictions":
   - HTTP referrers: `localhost:3000`, `*.vercel.app`
3. Add "API restrictions":
   - Only allow "Generative Language API"

### What to Do If Key Leaks Again

1. **Immediately** go to [Google AI Studio](https://aistudio.google.com/apikey)
2. **Delete** the compromised key
3. **Generate** a new key
4. **Update** `.env.local` locally
5. **Update** Vercel environment variables
6. **Restart** your dev server: `npm run dev`

### Current Key Location

- **Local Development**: `sihat-tcm-web/.env.local` (Git-ignored ✅)
- **Production (Vercel)**: Environment Variables in Vercel Dashboard
- **Mobile App**: Uses the same backend API (no key needed in mobile code)

### Testing Key Security

Run this command to verify your key is NOT in Git:

```bash
git log --all --full-history --source --pretty=format:"%h %s" -- .env.local
```

If this returns nothing, you're safe ✅

---

**Remember**: The `.env.local` file is your secret vault. Treat it like a password!
