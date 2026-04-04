Param(
    [string]$FilePath = "tests/fixtures/ai-trace-export.valid.json",
    [ValidateSet("valid", "invalid")]
    [string]$Expect = "valid"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$requiredRootFields = @("exportedAt", "app", "schemaVersion", "traceCount", "traces")
$requiredTraceFields = @("engine", "status", "durationMs", "inputPreview", "requestId", "startedAt")
$allowedStatus = @("ok", "warning", "error")

if (-not (Test-Path -Path $FilePath)) {
    throw "Schema fixture not found: $FilePath"
}

$jsonRaw = Get-Content -Path $FilePath -Raw
$payload = $jsonRaw | ConvertFrom-Json

$errors = @()

foreach ($field in $requiredRootFields) {
    if (-not ($payload.PSObject.Properties.Name -contains $field)) {
        $errors += "Missing root field: $field"
    }
}

if ($payload.app -ne "SEC_ARCHITECT") {
    $errors += "Field app must be SEC_ARCHITECT"
}

if ($payload.exportedAt -isnot [string]) {
    $errors += "Field exportedAt must be a string"
}

if ($payload.schemaVersion -isnot [string]) {
    $errors += "Field schemaVersion must be a string"
}

if ($payload.traceCount -isnot [int] -and $payload.traceCount -isnot [long]) {
    $errors += "Field traceCount must be numeric"
}

if ($payload.traces -isnot [System.Collections.IEnumerable]) {
    $errors += "Field traces must be an array"
} else {
    $traceArray = @($payload.traces)

    if ($traceArray.Count -ne [int]$payload.traceCount) {
        $errors += "traceCount does not match traces length"
    }

    for ($i = 0; $i -lt $traceArray.Count; $i++) {
        $trace = $traceArray[$i]

        foreach ($field in $requiredTraceFields) {
            if (-not ($trace.PSObject.Properties.Name -contains $field)) {
                $errors += "traces[$i] missing field: $field"
            }
        }

        if ($trace.status -and ($allowedStatus -notcontains [string]$trace.status)) {
            $errors += "traces[$i].status must be one of: ok, warning, error"
        }

        if ($trace.durationMs -and ($trace.durationMs -isnot [int] -and $trace.durationMs -isnot [long])) {
            $errors += "traces[$i].durationMs must be numeric"
        }
    }
}

if ($errors.Count -gt 0) {
    if ($Expect -eq "invalid") {
        Write-Host "AI trace schema invalid fixture rejected as expected." -ForegroundColor Green
        $errors | ForEach-Object { Write-Host " - $_" }
        exit 0
    }

    Write-Host "AI trace schema validation failed:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host " - $_" }
    exit 1
}

if ($Expect -eq "invalid") {
    Write-Host "AI trace schema negative test failed: fixture expected invalid but passed." -ForegroundColor Red
    exit 1
}

Write-Host "AI trace schema validation passed." -ForegroundColor Green
exit 0
