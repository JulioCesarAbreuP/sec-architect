#Requires -Version 7.3
<#
.SYNOPSIS
    Validates all Bicep templates in the bicep/ directory.
.DESCRIPTION
    Runs `az bicep build` (lint) and `az deployment group validate` (preflight)
    for the main template.  Exits non-zero if any check fails.
.PARAMETER ResourceGroup
    Resource group used for preflight validation (must exist).
.PARAMETER Location
    Azure region (default: eastus).
.PARAMETER KvAdminObjectId
    AAD Object ID passed to parameters for preflight validation.
.EXAMPLE
    ./validate-bicep.ps1 -ResourceGroup "rg-zerotrust-lab"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$ResourceGroup,

    [string]$Location = 'eastus',
    [string]$KvAdminObjectId = '00000000-0000-0000-0000-000000000000'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$bicepRoot = Join-Path $PSScriptRoot '..' 'bicep'
$failed    = 0

# ---------------------------------------------------------------------------
# Build (lint) every .bicep file
# ---------------------------------------------------------------------------
Write-Host "=== Bicep lint (az bicep build) ===" -ForegroundColor Cyan
Get-ChildItem -Path $bicepRoot -Filter '*.bicep' | ForEach-Object {
    Write-Host "  Linting $($_.Name)..." -NoNewline
    az bicep build --file $_.FullName --stdout 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        $failed++
    }
}

# ---------------------------------------------------------------------------
# Preflight validate main template
# ---------------------------------------------------------------------------
Write-Host "`n=== Preflight validation (az deployment group validate) ===" -ForegroundColor Cyan
$mainBicep = Join-Path $bicepRoot 'main.bicep'

az deployment group validate `
    --resource-group $ResourceGroup `
    --template-file $mainBicep `
    --parameters location=$Location environment=dev prefix=ztlab `
                 kvAdminObjectId=$KvAdminObjectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "Preflight validation FAILED." -ForegroundColor Red
    $failed++
} else {
    Write-Host "Preflight validation passed." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
if ($failed -gt 0) {
    Write-Error "$failed validation check(s) failed."
    exit 1
}
Write-Host "`nAll Bicep validations passed." -ForegroundColor Green
