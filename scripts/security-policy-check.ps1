Param(
    [string]$Root = "."
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$issues = @()
$inlineScriptExceptions = @(
    "tools/credential-exposure.html"
)

function Get-CspContent([string]$htmlText) {
    $meta = [regex]::Match(
        $htmlText,
        '<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    if ($meta.Success) {
        return $meta.Groups[1].Value
    }

    return ""
}

Push-Location $Root
try {
    $htmlFiles = Get-ChildItem -Recurse -File -Filter "*.html"
    foreach ($file in $htmlFiles) {
        $relative = $file.FullName.Substring((Get-Location).Path.Length + 1) -replace '\\','/'
        $content = Get-Content $file.FullName -Raw

        $csp = Get-CspContent $content
        if ([string]::IsNullOrWhiteSpace($csp)) {
            $issues += "[CSP] Missing CSP meta tag: $relative"
            continue
        }

        $allowsInlineScript = $inlineScriptExceptions -contains $relative
        if (($csp -match "script-src[^;]*'unsafe-inline'") -and (-not $allowsInlineScript)) {
            $issues += "[CSP] unsafe-inline found in script-src: $relative"
        }

        if ($csp -notmatch 'report-uri\s+') {
            $issues += "[CSP] Missing report-uri directive: $relative"
        }

        if ($csp -notmatch 'report-to\s+') {
            $issues += "[CSP] Missing report-to directive: $relative"
        }

        if ($content -match 'href\s*=\s*"\s*javascript:') {
            $issues += "[LINK] javascript: URL found: $relative"
        }
    }

    $codeFiles = Get-ChildItem -Recurse -File -Include "*.js","*.html"
    foreach ($file in $codeFiles) {
        $relative = $file.FullName.Substring((Get-Location).Path.Length + 1) -replace '\\','/'
        $text = Get-Content $file.FullName -Raw

        if ($text -match '\beval\s*\(') {
            $issues += "[CODE] eval() usage found: $relative"
        }

        if ($text -match 'new\s+Function\s*\(') {
            $issues += "[CODE] new Function() usage found: $relative"
        }

        if ($text -match 'document\.write\s*\(') {
            $issues += "[CODE] document.write() usage found: $relative"
        }
    }
}
finally {
    Pop-Location
}

if ($issues.Count -gt 0) {
    Write-Host "Security policy validation failed:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Security policy validation passed." -ForegroundColor Green
exit 0
