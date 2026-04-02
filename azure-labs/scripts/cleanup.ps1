#Requires -Version 7.3
<#
.SYNOPSIS
    Removes all lab resources by deleting the resource group.
.DESCRIPTION
    Prompts for confirmation before permanently deleting the resource group
    and all resources within it.  Passing -Force skips the prompt.
.PARAMETER ResourceGroup
    Name of the resource group to delete.
.PARAMETER Force
    Skip confirmation prompt.
.EXAMPLE
    ./cleanup.ps1 -ResourceGroup "rg-zerotrust-lab"
    ./cleanup.ps1 -ResourceGroup "rg-zerotrust-lab" -Force
#>
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory)]
    [string]$ResourceGroup,

    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Verify resource group exists
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq 'false') {
    Write-Warning "Resource group '$ResourceGroup' does not exist. Nothing to delete."
    return
}

# List resources before deletion
Write-Host "`nResources in '$ResourceGroup':" -ForegroundColor Yellow
az resource list --resource-group $ResourceGroup --query "[].{Type:type, Name:name}" --output table

Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Type the resource group name to confirm deletion"
    if ($confirm -ne $ResourceGroup) {
        Write-Host "Confirmation did not match. Aborting." -ForegroundColor Red
        exit 1
    }
}

if ($PSCmdlet.ShouldProcess($ResourceGroup, 'Delete resource group')) {
    Write-Host "Deleting resource group '$ResourceGroup'..." -ForegroundColor Red
    az group delete --name $ResourceGroup --yes --no-wait
    Write-Host "Deletion initiated (running asynchronously)." -ForegroundColor Yellow
    Write-Host "Monitor progress: az group show --name $ResourceGroup --query properties.provisioningState" -ForegroundColor Cyan
}
