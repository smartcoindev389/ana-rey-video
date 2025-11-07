# PowerShell script to check if port 3000 is open and listening
# Run this script to verify your server configuration

Write-Host "Checking port 3000 status..." -ForegroundColor Green
Write-Host ""

# Check if port 3000 is listening
$listening = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($listening) {
    Write-Host "✓ Port 3000 is listening!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Listening connections:" -ForegroundColor Yellow
    $listening | Format-Table LocalAddress, LocalPort, State, OwningProcess -AutoSize
    
    # Get process name
    foreach ($conn in $listening) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "✗ Port 3000 is NOT listening" -ForegroundColor Red
    Write-Host "Make sure your Vite dev server is running!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Firewall rules for port 3000:" -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object { 
    $portFilter = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $_ -ErrorAction SilentlyContinue
    if ($portFilter) {
        $portFilter.LocalPort -eq 3000
    }
}

if ($firewallRules) {
    $firewallRules | Format-Table DisplayName, Direction, Action, Enabled -AutoSize
} else {
    Write-Host "No firewall rules found for port 3000" -ForegroundColor Red
    Write-Host "Run open-port-3000.ps1 as Administrator to open the port" -ForegroundColor Yellow
}

# Get VPS IP addresses
Write-Host ""
Write-Host "Your VPS IP addresses:" -ForegroundColor Yellow
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" } | Format-Table IPAddress, InterfaceAlias -AutoSize

