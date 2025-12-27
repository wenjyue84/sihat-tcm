---
description: How to run the Sihat TCM development server
---

# Running the Development Server

## Default Port: 3100

> **Note**: The development server runs on port **3100** (not 3000) to avoid port conflicts. This only affects local development and does not impact production deployments.

## Quick Start

1. Navigate to the web app directory:

   ```bash
   cd "c:\Users\Jyue\Desktop\Projects\Sihat TCM\sihat-tcm"
   ```

2. Start the development server:
   // turbo

   ```bash
   npm run dev
   ```

3. Open your browser to:
   - **Local**: http://localhost:3100
   - **Network**: http://192.168.0.5:3100 (accessible from other devices on your network)

## Available Dev Commands

- `npm run dev` - Start development server on port 3100
- `npm run dev-https` - Start with HTTPS on port 3100
- `npm run dev:tina` - Start with Tina CMS editor
- `npm run build` - Build for production
- `npm start` - Start production server on port 3100

## Deployment Notes

### Production Deployment

The port 3100 setting **only affects local development**. When deployed to production (Vercel, etc.):

- The hosting platform assigns its own port automatically
- Your production URL remains unchanged (e.g., `https://your-app.vercel.app`)
- Environment variable `NEXT_PUBLIC_APP_URL` should be set to your production domain, not localhost:3100

### Mobile App Configuration

- **Development**: Point mobile app to `http://localhost:3100` or your local network IP
- **Production**: Point mobile app to your production web app URL (e.g., `https://your-app.vercel.app`)

## Troubleshooting

### Port Already in Use

If you see "EADDRINUSE" error:

1. Find the process using port 3100:
   ```powershell
   Get-NetTCPConnection -LocalPort 3100 | Select-Object -Property LocalPort, OwningProcess
   ```
2. Kill the process:
   ```powershell
   Stop-Process -Id <process-id> -Force
   ```
3. Restart the dev server
