# Network probe script — get dev machine IPs and adapter info
Write-Host "=== DEV MACHINE IP ADDRESSES ==="
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' } | Format-Table InterfaceAlias, IPAddress, PrefixLength -AutoSize

Write-Host "`n=== NETWORK ADAPTER PROFILES ==="
Get-NetConnectionProfile | Format-Table Name, InterfaceAlias, NetworkCategory -AutoSize

Write-Host "`n=== ARP TABLE (who do we know?) ==="
arp -a
