# Port 3100 - Development Server Configuration

**Date Changed**: December 26, 2025  
**Changed From**: Port 3000 → **Port 3100**  
**Reason**: To avoid port conflicts during local development

---

## Impact Summary

### ✅ Local Development
- Development server now runs on `http://localhost:3100`
- All `npm run dev` commands use port 3100
- Tina CMS editor accessible at `http://localhost:3100/tina-admin/index.html`

### ✅ Production Deployment
**NO IMPACT** - This change only affects local development:
- Vercel and other hosting platforms assign their own ports
- Production URLs remain unchanged (e.g., `https://your-app.vercel.app`)
- `NEXT_PUBLIC_APP_URL` in production should still point to your production domain

### ⚠️ Mobile App Development
When testing mobile app with local dev server:
- Update mobile app's `API_BASE_URL` to `http://localhost:3100` (or your local network IP with port 3100)
- In production, mobile app should still connect to production web app URL

---

## Files Updated
- ✅ `package.json` - All dev/start scripts now use port 3100
- ✅ `README.md` - Updated localhost URL
- ✅ `DEVELOPER_MANUAL.md` - Updated all port references
- ✅ `.agent/workflows/run-dev-server.md` - Created workflow documentation

---

## Environment Variables

### Development (.env.local)
```env
NEXT_PUBLIC_APP_URL=http://localhost:3100
```

### Production (Vercel/Deployment Platform)
```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

**Note**: The `NEXT_PUBLIC_APP_URL` variable is used by the application to generate URLs. Make sure it's set correctly for each environment.

---

## Important Reminders

1. **Port 3100 is for local development only** - Production deployments are not affected
2. **Check mobile app config** when switching between dev and production  
3. **Update team members** if they're also developing locally
4. **CI/CD pipelines** are not affected - they use production builds

For detailed instructions, see: `.agent/workflows/run-dev-server.md`
