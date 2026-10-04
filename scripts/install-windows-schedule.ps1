param(
  [string]$ProjectPath = (Get-Location).Path,
  [string]$TaskName = "Octave Daily Job Search"
)

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d `"$ProjectPath`" && npm run automation:daily"
$trigger = New-ScheduledTaskTrigger -Daily -At 9:00PM
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Description "Run Octave daily job search at 9 PM." -Force
Write-Host "Octave daily job search scheduled for 9:00 PM."
