# Network Connectivity Issue - Mobile Devices Can't Access Dev Server

**Date:** 2024-12-14 (Verified again: 2025-12-19)
**Status:** Resolved

## Problem

Mobile devices (Android/iPhone) on the same WiFi network couldn't access the development server at `192.168.0.5:3000`. The error message was "This site can't be reached".

**Symptoms:**
- Phone browser shows "site can't be reached" for `http://192.168.0.5:3000`
- Fing app on phone couldn't see the PC (192.168.0.5) in network scan
- Ping from phone to PC: 100% packet loss
- Ping from PC to phone: 100% packet loss
- **Previously worked** - this was an intermittent issue

## Root Cause

**TP-Link USB WiFi Adapter connectivity issue** - The external USB WiFi adapter (TP-Link Wireless MU-MIMO USB Adapter) was connected to WiFi but had a communication breakdown with other devices on the network. The PC could see its own IP (192.168.0.5) but couldn't communicate with other devices on the same subnet.

This is a known issue with USB WiFi adapters where the adapter can lose proper network communication while still appearing "connected".

## Solution

**Restart the WiFi adapter** by disabling and re-enabling it:

### Option 1: PowerShell (Admin)
```powershell
Disable-NetAdapter -Name "Wi-Fi" -Confirm:$false
Start-Sleep -Seconds 3
Enable-NetAdapter -Name "Wi-Fi" -Confirm:$false
```

### Option 2: GUI Method
1. Press `Win + X` → Select "Device Manager"
2. Expand "Network adapters"
3. Right-click "TP-Link Wireless MU-MIMO USB Adapter"
4. Click "Disable device" → Wait 3 seconds
5. Right-click again → Click "Enable device"

### Option 3: Physical Method
1. Unplug the USB WiFi adapter
2. Wait 5 seconds
3. Plug it back in

## Additional Fixes Applied (Not the root cause, but good to have)

During troubleshooting, we also applied these settings which are useful:

1. **Changed network profile to Private** (allows network discovery):
   ```powershell
   Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
   ```

2. **Added firewall rule for port 3000**:
   ```powershell
   netsh advfirewall firewall add rule name="Node.js Dev Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000
   ```

3. **Added firewall rule for ping (ICMP)**:
   ```powershell
   netsh advfirewall firewall add rule name="Allow Ping (ICMPv4)" protocol=icmpv4:8,any dir=in action=allow
   ```

## Prevention

- If mobile devices suddenly can't connect to the dev server, **try restarting the WiFi adapter first** before investigating other causes
- Consider using an Ethernet connection for more stable development if this issue recurs frequently
- Keep this USB adapter's drivers updated

## Diagnostic Commands

```powershell
# Check WiFi adapter status
Get-NetAdapter -Name "Wi-Fi" | Select-Object Name, Status, LinkSpeed

# Check current IP addresses
ipconfig | findstr /i "IPv4"

# Check network profile (should be Private for local dev)
Get-NetConnectionProfile

# Check if dev server is listening
netstat -an | findstr ":3000"

# Ping test to another device
ping 192.168.0.41 -n 4
```

## Tools for Troubleshooting (Phone)

- **Fing** - Network scanner, device discovery
- **PingTools Network Utilities** - Ping, port scan, traceroute
- **Network Analyzer** - Comprehensive network testing
