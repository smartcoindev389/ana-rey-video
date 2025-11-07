# PowerShell script to open port 3000 in Windows Firewall
# Run this script as Administrator

Write-Host "Opening port 3000 in Windows Firewall..." -ForegroundColor Green

# Check if rule already exists
$existingRule = Get-NetFirewallRule -DisplayName "Vite Dev Server Port 3000" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "Firewall rule already exists. Removing old rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Vite Dev Server Port 3000"
}

# Create new firewall rule for inbound traffic on port 3000
New-NetFirewallRule -DisplayName "Vite Dev Server Port 3000" `
    -Direction Inbound `
    -LocalPort 3000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any

Write-Host "Port 3000 has been opened in Windows Firewall!" -ForegroundColor Green
Write-Host "You can now access your app from other devices using: http://YOUR_VPS_IP:3000" -ForegroundColor Cyan

# Display current firewall rules for port 3000
Write-Host "`nCurrent firewall rules for port 3000:" -ForegroundColor Yellow
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*3000*" } | Format-Table DisplayName, Direction, Action, Enabled

