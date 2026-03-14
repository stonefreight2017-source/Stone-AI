# Cardinal Inbox Manager Poller
# Runs every 5 minutes via Windows Task Scheduler
# Hits the inbox-manager endpoint to trigger:
#   - Email triage & routing
#   - Content approval reminders (1hr before posting windows)
#   - Hold-and-roll for missed windows
#   - Daily digest at 7:00 AM ET

$ErrorActionPreference = "SilentlyContinue"

$secret = "896ef52e412952f82c9543867fdae28a43599f85d5abd49e802517304c27acee"
$logFile = "$env:USERPROFILE\palace-logs\cardinal\inbox-poller.log"

# Ensure log directory exists
$logDir = Split-Path $logFile
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Try production first, fall back to localhost
$urls = @(
    "https://stone-ai.net/api/internal/inbox-manager",
    "http://localhost:3000/api/internal/inbox-manager"
)

$success = $false

foreach ($url in $urls) {
    try {
        $headers = @{ "x-alert-secret" = $secret }
        $response = Invoke-RestMethod -Uri $url -Headers $headers -Method GET -TimeoutSec 25 -ErrorAction Stop

        if ($response.success -eq $true) {
            $msgs = $response.messagesRead
            $reminders = if ($response.contentReminders) { $response.contentReminders.remindersSent } else { 0 }
            $rolled = if ($response.contentReminders.batchesRolled) { ($response.contentReminders.batchesRolled | Measure-Object).Count } else { 0 }
            $digest = if ($response.digestSent) { "YES" } else { "no" }
            $dur = $response.durationMs

            $logLine = "[$timestamp] OK | $url | msgs=$msgs reminders=$reminders rolled=$rolled digest=$digest dur=${dur}ms"
            Add-Content -Path $logFile -Value $logLine
            $success = $true
            break
        }
    }
    catch {
        $err = $_.Exception.Message
        Add-Content -Path $logFile -Value "[$timestamp] FAIL | $url | $err"
    }
}

if (-not $success) {
    Add-Content -Path $logFile -Value "[$timestamp] ALL ENDPOINTS FAILED - inbox-manager not reachable"
}
