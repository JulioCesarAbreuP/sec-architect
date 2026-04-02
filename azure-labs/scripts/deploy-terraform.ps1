#Requires -Version 7.3
<#
.SYNOPSIS
    Deploys the Zero Trust lab using Terraform.
.DESCRIPTION
    Initialises Terraform (if needed), then runs plan and apply against the
    specified resource group.
.PARAMETER ResourceGroup
    Target Azure resource group name.
.PARAMETER Location
    Azure region (default: eastus).
.PARAMETER Environment
    dev | staging | prod (default: dev).
.PARAMETER Prefix
    Resource name prefix, 3-8 characters (default: ztlab).
.PARAMETER KvAdminObjectId
    AAD Group Object ID for Key Vault Administrator. Defaults to current user.
.PARAMETER PlanOnly
    Only run terraform plan; do not apply.
.EXAMPLE
    ./deploy-terraform.ps1 -ResourceGroup "rg-zerotrust-lab"
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [string]$ResourceGroup,

    [string]$Location = 'eastus',

    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',

    [ValidatePattern('^[a-z0-9]{3,8}$')]
    [string]$Prefix = 'ztlab',

    [string]$KvAdminObjectId = '',

    [switch]$PlanOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$tfDir = Join-Path $PSScriptRoot '..' 'terraform'

# Verify terraform is available
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    throw "terraform not found in PATH. Install from https://developer.hashicorp.com/terraform/install"
}

# ---------------------------------------------------------------------------
# Resolve KV admin identity
# ---------------------------------------------------------------------------
if (-not $KvAdminObjectId) {
    Write-Host "Resolving current user object ID..." -ForegroundColor Cyan
    $KvAdminObjectId = (az ad signed-in-user show --query id --output tsv 2>$null)
    if (-not $KvAdminObjectId) {
        throw "Could not resolve current user OID. Pass -KvAdminObjectId explicitly."
    }
}

# ---------------------------------------------------------------------------
# Init
# ---------------------------------------------------------------------------
Write-Host "Initialising Terraform..." -ForegroundColor Cyan
Push-Location $tfDir
try {
    terraform init -upgrade
    if ($LASTEXITCODE -ne 0) { throw "terraform init failed." }

    # ---------------------------------------------------------------------------
    # Plan
    # ---------------------------------------------------------------------------
    $planFile = Join-Path $env:TEMP 'ztlab.tfplan'
    $tfVars = @(
        "-var=resource_group_name=$ResourceGroup"
        "-var=location=$Location"
        "-var=environment=$Environment"
        "-var=prefix=$Prefix"
        "-var=kv_admin_object_id=$KvAdminObjectId"
    )

    Write-Host "Running terraform plan..." -ForegroundColor Cyan
    terraform plan @tfVars -out $planFile
    if ($LASTEXITCODE -ne 0) { throw "terraform plan failed." }

    if ($PlanOnly) {
        Write-Host "Plan-only mode. Skipping apply." -ForegroundColor Yellow
        return
    }

    # ---------------------------------------------------------------------------
    # Apply
    # ---------------------------------------------------------------------------
    if ($PSCmdlet.ShouldProcess($ResourceGroup, 'Terraform apply')) {
        Write-Host "Applying plan..." -ForegroundColor Cyan
        terraform apply $planFile
        if ($LASTEXITCODE -ne 0) { throw "terraform apply failed." }
        Write-Host "Terraform deployment complete." -ForegroundColor Green
    }
}
finally {
    Pop-Location
}
