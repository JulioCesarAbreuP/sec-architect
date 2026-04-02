#Requires -Version 7.3
<#
.SYNOPSIS
    Deploys the Zero Trust lab using Bicep templates.
.DESCRIPTION
    Validates the Bicep deployment in what-if mode, then executes the deployment
    against the specified resource group.
.PARAMETER ResourceGroup
    Target resource group name. Created if it does not exist.
.PARAMETER Location
    Azure region (default: eastus).
.PARAMETER Environment
    dev | staging | prod (default: dev).
.PARAMETER Prefix
    Resource name prefix, 3-8 characters (default: ztlab).
.PARAMETER KvAdminObjectId
    AAD Group Object ID for the Key Vault Administrator role assignment.
    Defaults to the currently logged-in user's object ID.
.PARAMETER LogAnalyticsWorkspaceId
    Optional. Resource ID of an existing Log Analytics Workspace.
.PARAMETER WhatIf
    Run in what-if mode without making changes.
.EXAMPLE
    ./deploy-bicep.ps1 -ResourceGroup "rg-zerotrust-lab" -Location "eastus"
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

    [string]$LogAnalyticsWorkspaceId = '',

    [switch]$WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$bicepRoot  = Join-Path $scriptDir '..' 'bicep'
$mainBicep  = Join-Path $bicepRoot 'main.bicep'

# ---------------------------------------------------------------------------
# Resolve KV admin identity
# ---------------------------------------------------------------------------
if (-not $KvAdminObjectId) {
    Write-Host "Resolving current user object ID..." -ForegroundColor Cyan
    $KvAdminObjectId = (az ad signed-in-user show --query id --output tsv 2>$null)
    if (-not $KvAdminObjectId) {
        throw "Could not resolve current user OID. Pass -KvAdminObjectId explicitly."
    }
    Write-Host "Using OID: $KvAdminObjectId" -ForegroundColor Cyan
}

# ---------------------------------------------------------------------------
# Ensure resource group exists
# ---------------------------------------------------------------------------
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq 'false') {
    Write-Host "Creating resource group '$ResourceGroup' in '$Location'..." -ForegroundColor Yellow
    if ($PSCmdlet.ShouldProcess($ResourceGroup, 'Create resource group')) {
        az group create --name $ResourceGroup --location $Location --output none
    }
}

# ---------------------------------------------------------------------------
# Build parameter overrides
# ---------------------------------------------------------------------------
$params = @(
    "location=$Location"
    "environment=$Environment"
    "prefix=$Prefix"
    "kvAdminObjectId=$KvAdminObjectId"
)
if ($LogAnalyticsWorkspaceId) {
    $params += "logAnalyticsWorkspaceId=$LogAnalyticsWorkspaceId"
}

# ---------------------------------------------------------------------------
# What-if / deploy
# ---------------------------------------------------------------------------
$deployCmd = @(
    'deployment', 'group'
    if ($WhatIf) { 'what-if' } else { 'create' }
    '--resource-group', $ResourceGroup
    '--template-file', $mainBicep
    '--parameters'
) + $params

Write-Host "Running: az $($deployCmd -join ' ')" -ForegroundColor Cyan

if ($PSCmdlet.ShouldProcess($ResourceGroup, 'Deploy Bicep')) {
    az @deployCmd
    if ($LASTEXITCODE -ne 0) {
        throw "Bicep deployment failed with exit code $LASTEXITCODE."
    }
    Write-Host "Deployment complete." -ForegroundColor Green
}
