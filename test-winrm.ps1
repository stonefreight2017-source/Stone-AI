$plainPw = $env:OMEN_PW
$pw = ConvertTo-SecureString $plainPw -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("OMEN\admin", $pw)
try {
    $result = Invoke-Command -ComputerName OMEN -Credential $cred -ScriptBlock {
        hostname
        whoami
        Write-Output "--- CONNECTION SUCCESSFUL ---"
    } -ErrorAction Stop
    Write-Output $result
} catch {
    Write-Output "FAILED: $_"
}
