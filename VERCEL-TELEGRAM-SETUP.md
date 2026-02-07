# Vercel Telegram Bot Setup Guide

## Problem
The Telegram notification works on localhost but not on Vercel because the environment variables (`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`) are not configured in Vercel.

## Solution

### Step 1: Add Environment Variables to Vercel

1. **Go to your Vercel project dashboard**
   - Navigate to https://vercel.com/dashboard
   - Click on your `sihat-tcm` project

2. **Open Settings**
   - Click on the "Settings" tab at the top

3. **Navigate to Environment Variables**
   - In the left sidebar, click on "Environment Variables"

4. **Add the Bot Token**
   - Click "Add New" button
   - **Name:** `TELEGRAM_BOT_TOKEN`
   - **Value:** `8470302676:AAFbqtwue9F003mGK5kOrflhAFZ2s8N_FyU`
   - **Environments:** Check all boxes (Production, Preview, Development)
   - Click "Save"

5. **Add the Chat ID**
   - Click "Add New" button again
   - **Name:** `TELEGRAM_CHAT_ID`
   - **Value:** `792361727`
   - **Environments:** Check all boxes (Production, Preview, Development)
   - Click "Save"

### Step 2: Redeploy Your Application

After adding the environment variables, you need to redeploy:

1. Go to the "Deployments" tab
2. Click on the "..." menu next to the latest deployment
3. Click "Redeploy"
4. Confirm the redeployment

**OR** simply push a new commit to trigger automatic deployment:
```bash
git add .
git commit -m "Add Telegram notification status display"
git push
```

### Step 3: Test the Integration

1. Visit https://sihat-tcm.vercel.app
2. Complete a diagnosis flow
3. When you reach the processing/report step, you should see:
   - ✓ "Report notification sent to professional doctor via P2P encrypted Telegram" (if successful)
   - ⚠ Error message with details (if failed)

4. Check your Telegram bot (@SihatTCM_bot) to confirm the message was received

## What Changed in the Code

### 1. API Route Enhancement (`/api/notifications/report-viewed/route.ts`)
- Now returns detailed status including:
  - `sent`: boolean indicating success
  - `message`: descriptive message for user
  - Checks if credentials are configured before attempting to send

### 2. DiagnosisReport Component
- Added `telegramStatus` state to track notification status
- Displays status message at the bottom of the report
- Shows success (green) or warning (amber) based on result
- Only appears when `notifyOnFirstView={true}` is set

### 3. User-Facing Message
The status message serves dual purposes:
- **User communication**: "Report will be sent to a professional doctor via P2P encrypted way"
- **Debugging**: Shows exact error if Telegram fails (credentials missing, API error, etc.)

## Environment Variables Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `TELEGRAM_BOT_TOKEN` | `8470302676:AAFbqtwue9F003mGK5kOrflhAFZ2s8N_FyU` | Bot authentication token from @BotFather |
| `TELEGRAM_CHAT_ID` | `792361727` | Your Telegram user ID to receive messages |

## Security Note

⚠️ **Important**: The `.env.local` file containing these credentials should NEVER be committed to Git. It's already in `.gitignore`. Always use Vercel's environment variables UI for production deployment.

## Troubleshooting

### Message: "Telegram credentials not configured"
- The environment variables are not set in Vercel
- Follow Step 1 above to add them

### Message: "Failed to send notification: [error details]"
- Bot token or chat ID is incorrect
- Telegram API is down (rare)
- Network issues from Vercel servers

### No status message appears
- `notifyOnFirstView` prop is not set to `true` in ProcessingStep
- JavaScript error prevented the fetch call (check browser console)

## Bot Information

- **Bot Username**: @SihatTCM_bot
- **Bot Token**: `8470302676:AAFbqtwue9F003mGK5kOrflhAFZ2s8N_FyU`
- **Your Chat ID**: `792361727`
- **API Endpoint**: `https://api.telegram.org/bot{token}/sendMessage`

## Testing Locally

To test locally, ensure your `.env.local` file has:
```env
TELEGRAM_BOT_TOKEN=8470302676:AAFbqtwue9F003mGK5kOrflhAFZ2s8N_FyU
TELEGRAM_CHAT_ID=792361727
```

Then run:
```bash
npm run dev
```

Navigate to http://localhost:3100 and complete a diagnosis to test the notification.
