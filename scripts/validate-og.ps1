Param(
    [string]$Root = "."
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$requiredEntryPages = @(
    "index.html",
    "blog.html",
    "tools.html",
    "blog/index.html",
    "sections/strategic-command-center.html",
    "sections/azure-labs.html",
    "sections/blog-tecnico.html",
    "sections/herramientas.html"
)

$ogKeys = @(
    'property="og:title"',
    'property="og:description"',
    'property="og:image"',
    'property="og:url"',
    'name="twitter:image"',
    'name="twitter:card"'
)

$issues = @()

function Get-Head([string]$htmlText) {
    $headMatch = [regex]::Match($htmlText, "<head[\s\S]*?</head>", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($headMatch.Success) { return $headMatch.Value }
    return ""
}

function Measure-TagOccurrence([string]$text, [string]$needle) {
    return ([regex]::Matches($text, [regex]::Escape($needle), [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
}

Push-Location $Root
try {
    $htmlFiles = Get-ChildItem -Recurse -File -Filter "*.html"

    foreach ($file in $htmlFiles) {
        $relative = $file.FullName.Substring((Get-Location).Path.Length + 1).Replace('\\', '/')
        $content = Get-Content $file.FullName -Raw
        $head = Get-Head $content

        if ([string]::IsNullOrWhiteSpace($head)) {
            $issues += "[HEAD] Missing <head> block: $relative"
            continue
        }

        foreach ($key in $ogKeys) {
            $count = Measure-TagOccurrence $head $key
            if ($count -gt 1) {
                $issues += "[DUPLICATE] $relative has duplicated tag key: $key (count=$count)"
            }
        }

        if ($requiredEntryPages -contains $relative) {
            foreach ($mustHave in @('property="og:title"','property="og:image"','property="og:url"','name="twitter:image"')) {
                $count = Measure-TagOccurrence $head $mustHave
                if ($count -eq 0) {
                    $issues += "[MISSING] $relative missing required metadata: $mustHave"
                }
            }
        }
    }
}
finally {
    Pop-Location
}

if ($issues.Count -gt 0) {
    Write-Host "Metadata validation failed:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Metadata validation passed." -ForegroundColor Green
exit 0
