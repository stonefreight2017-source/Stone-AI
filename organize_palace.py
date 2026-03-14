import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('169.254.26.30', port=22, username='rush', password='Palace2026!', timeout=10, look_for_keys=False, allow_agent=False)

# Create organize script on OMEN then run it
script_content = r'''
$d = "C:\Users\admin\Desktop"
$b = "$d\BUSINESS"
New-Item -ItemType Directory -Path $b -Force | Out-Null
New-Item -ItemType Directory -Path "$b\Dashboards" -Force | Out-Null
New-Item -ItemType Directory -Path "$b\Legal-Docs" -Force | Out-Null
New-Item -ItemType Directory -Path "$b\Deploy-Ops" -Force | Out-Null
New-Item -ItemType Directory -Path "$b\Credentials" -Force | Out-Null
New-Item -ItemType Directory -Path "$b\Stone-AI-Files" -Force | Out-Null

# Dashboard URL shortcuts
$urls = @(
    @("Stripe Dashboard", "https://dashboard.stripe.com"),
    @("Cloudflare Dashboard", "https://dash.cloudflare.com"),
    @("Clerk Dashboard", "https://dashboard.clerk.com"),
    @("Vercel Dashboard", "https://vercel.com/dashboard"),
    @("GitHub Stone AI", "https://github.com/stonefreight2017-source/Stone-AI"),
    @("Neon Database", "https://console.neon.tech"),
    @("Stone AI Live", "https://stone-ai.net"),
    @("Zoho Mail", "https://mail.zoho.com")
)
foreach ($u in $urls) {
    $path = "$b\Dashboards\$($u[0]).url"
    "[InternetShortcut]`nURL=$($u[1])" | Out-File -FilePath $path -Encoding ASCII
    Write-Host "Created: $($u[0])"
}

# Move business files
$moves = @(
    @("STONE_AI_CREDENTIALS_AND_INFO.txt", "Credentials"),
    @("STONE_AI_LEGAL_CHECKLIST.html", "Legal-Docs"),
    @("Stone_AI_7Day_PreLaunch_Checklist.html", "Stone-AI-Files"),
    @("SOCIAL_MEDIA_HANDLE_CHECKLIST.txt", "Stone-AI-Files"),
    @("Zoho_Forwarding_Setup.html", "Stone-AI-Files"),
    @("CARDINAL_P0_INTELLIGENCE_REPORT.txt", "Stone-AI-Files"),
    @("MASTER_SUMMARY.txt", "Stone-AI-Files"),
    @("OMEN_SETUP_PROGRESS.md", "Deploy-Ops"),
    @("Docker Desktop.lnk", "Deploy-Ops")
)
foreach ($m in $moves) {
    $src = "$d\$($m[0])"
    $dst = "$b\$($m[1])\$($m[0])"
    if (Test-Path $src) { Copy-Item $src $dst -Force; Write-Host "Moved: $($m[0])" }
}

# PERSONAL folder
$p = "$d\PERSONAL"
New-Item -ItemType Directory -Path $p -Force | Out-Null

Write-Host "`n=== BUSINESS ==="
Get-ChildItem $b | ForEach-Object { Write-Host "  $($_.Name)" }
Write-Host "`n=== DASHBOARDS ==="
Get-ChildItem "$b\Dashboards" | ForEach-Object { Write-Host "  $($_.Name)" }
Write-Host "`n=== DESKTOP NOW ==="
Get-ChildItem $d | ForEach-Object { Write-Host "  $($_.Name)" }
Write-Host "`nDone."
'''

# Write script to OMEN via SFTP
sftp = ssh.open_sftp()
with sftp.file('/Users/rush/organize.ps1', 'w') as f:
    f.write(script_content)
sftp.close()

# Run it
stdin, stdout, stderr = ssh.exec_command(r'powershell -ExecutionPolicy Bypass -File C:\Users\rush\organize.ps1')
print(stdout.read().decode().strip())
err = stderr.read().decode().strip()
if err:
    print(err)

ssh.close()
print("\n=== PALACE DESKTOP ORGANIZED ===")
