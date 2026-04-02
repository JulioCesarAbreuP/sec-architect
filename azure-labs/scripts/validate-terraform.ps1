#Requires -Version 7.3
<#
.SYNOPSIS
    Validates all Terraform configuration files.
.DESCRIPTION
    Runs `terraform fmt -check`, `terraform validate`, and optionally `tfsec`
    (if installed) against the terraform/ directory.
.PARAMETER SkipTfsec
    Skip tfsec static analysis even if it is installed.
.EXAMPLE
    ./validate-terraform.ps1
    ./validate-terraform.ps1 -SkipTfsec
#>
[CmdletBinding()]
param(
    [switch]$SkipTfsec
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$tfDir = Join-Path $PSScriptRoot '..' 'terraform'
$failed = 0

if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    throw "terraform not found in PATH."
}

Push-Location $tfDir
try {
    # ---------------------------------------------------------------------------
    # Format check
    # ---------------------------------------------------------------------------
    Write-Host "=== terraform fmt -check ===" -ForegroundColor Cyan
    terraform fmt -check -recursive
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Formatting issues found. Run: terraform fmt -recursive" -ForegroundColor Red
        $failed++
    } else {
        Write-Host "Formatting OK" -ForegroundColor Green
    }

    # ---------------------------------------------------------------------------
    # Init (needed for validate)
    # ---------------------------------------------------------------------------
    Write-Host "`n=== terraform init (backend=false) ===" -ForegroundColor Cyan
    terraform init -backend=false -upgrade -input=false
    if ($LASTEXITCODE -ne 0) { throw "terraform init failed." }

    # ---------------------------------------------------------------------------
    # Validate
    # ---------------------------------------------------------------------------
    Write-Host "`n=== terraform validate ===" -ForegroundColor Cyan
    terraform validate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "terraform validate FAILED." -ForegroundColor Red
        $failed++
    } else {
        Write-Host "terraform validate passed." -ForegroundColor Green
    }

    # ---------------------------------------------------------------------------
    # tfsec (optional)
    # ---------------------------------------------------------------------------
    if (-not $SkipTfsec -and (Get-Command tfsec -ErrorAction SilentlyContinue)) {
        Write-Host "`n=== tfsec static analysis ===" -ForegroundColor Cyan
        tfsec . --format lovely
        if ($LASTEXITCODE -ne 0) {
            Write-Host "tfsec reported issues." -ForegroundColor Yellow
            # Treat as warning, not failure, to allow CI to proceed
        }
    } elseif (-not $SkipTfsec) {
        Write-Host "`ntfsec not found — skipping static analysis. Install: https://github.com/aquasecurity/tfsec" -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
if ($failed -gt 0) {
    Write-Error "$failed validation check(s) failed."
    exit 1
}
Write-Host "`nAll Terraform validations passed." -ForegroundColor Green
