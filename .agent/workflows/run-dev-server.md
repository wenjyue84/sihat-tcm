---
description: How to run the Sihat TCM development server
---

# Running the Development Server

## Port Configuration

> [!IMPORTANT]
> **Always use `localhost:3000` for this app.**
> 
> **DO NOT use `localhost:5000`** - Port 5000 is reserved for another application.

## Starting the Dev Server

1. Navigate to the project directory:
   ```bash
   cd c:\Users\Jyue\Desktop\Projects\Sihat TCM\sihat-tcm
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` by default.

## If Port 3000 is Occupied

If port 3000 is already in use, Next.js will automatically try the next available port (e.g., 3001). This is acceptable, but **never manually configure the app to use port 5000**.

## Testing on Mobile Devices

To access the dev server from a mobile device on the same WiFi network:

1. Find your PC's IP address:
   ```powershell
   ipconfig | findstr /i "IPv4"
   ```
   Look for the `192.168.x.x` address (e.g., `192.168.0.5`)

2. On your mobile browser, go to: `http://192.168.0.5:3000`

### ⚠️ If Mobile Device Can't Connect

If your phone suddenly can't reach the dev server (but previously could):

> **Most likely cause:** The USB WiFi adapter (TP-Link Wireless MU-MIMO USB Adapter) has a connectivity issue.
> 
> **Quick Fix:** Restart the WiFi adapter:
> ```powershell
> # Run as Administrator
> Disable-NetAdapter -Name "Wi-Fi" -Confirm:$false; Start-Sleep 3; Enable-NetAdapter -Name "Wi-Fi"
> ```
> Or simply unplug and re-plug the USB WiFi adapter.

For detailed troubleshooting, see: `.agent/fixes/network-connectivity-issue.md`
