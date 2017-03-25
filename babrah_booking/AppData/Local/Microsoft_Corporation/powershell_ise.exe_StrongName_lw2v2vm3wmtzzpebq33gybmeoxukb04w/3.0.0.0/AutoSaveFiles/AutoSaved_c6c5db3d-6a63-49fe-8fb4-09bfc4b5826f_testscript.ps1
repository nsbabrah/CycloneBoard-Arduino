param ($Step="A")
$script = $myInvocation.MyCommand.Definition
$scriptPath = Split-Path -parent $script
. (Join-Path $scriptpath functions.ps1)


Clear-Any-Restart

if (Should-Run-Step "A") 
{
    Write-Host "A"
    Start-Process "c:\Windows\SysWOW64\dfc.exe deepcom55 /THAWNEXTBOOT" 
    Restart-And-Resume $script "B"
}

if (Should-Run-Step "B") 
{
	Start-Process "c:\Windows\script\CC2015License\AdobeSerialization.exe"
	Write-Host "B"
	Start-Process "c:\Windows\SysWOW64\dfc.exe deepcom55 /BOOTFROZEN"
}


e:




