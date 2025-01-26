# ==================================================================
# Script: build.ps1
# Description: This script builds Cloudflare Workers, obfuscates them,
#              checks for forbidden strings, and compresses them into zip files.
# Creator: vadash
# ==================================================================

# Constants
$howManyToBuild = 20
$sevenZipPath = "C:\Program Files\7-Zip\7z.exe"
$sensitiveFileAuto = ".\sensitive_words_auto.txt"
$sensitiveFileManual = ".\sensitive_words_manual.txt"
$workerPath = ".\output\_worker.js"

#region Helper Functions

function Write-Status {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

function Ensure-OutputDirectory {
    param([string]$Path = ".\output\")
    if (!(Test-Path -Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
        Write-Status "Created output directory: $Path"
    }
}

#endregion

#region Core Functions

function Replace-NameCalls {
    param([string]$workerPath)
    $content = Get-Content -Path $workerPath -Raw
    $nameCalls = [regex]::Matches($content, '__name\(([^,]+),\s*"([^"]+)"\)')

    if ($nameCalls.Count -eq 0) {
        Write-Status "No __name calls found in '$workerPath'"
        return
    }

    $replacements = New-Object System.Collections.Generic.List[object]
    foreach ($call in $nameCalls) {
        $randomHexString = -join (Get-Random -Count 4 -InputObject ([char[]]'0123456789abcdef'))
        $newCall = $call.Value -replace '__name\(([^,]+),\s*"([^"]+)"\)', "__name(`$1, `"$randomHexString`")"
        $replacements.Add(@{ Original = $call.Value; New = $newCall })
    }

    $newContent = $content
    $replacements | ForEach-Object { $newContent = $newContent.Replace($_.Original, $_.New) }
    Set-Content -Path $workerPath -Value $newContent -Force
    Write-Status "Replaced $($nameCalls.Count) __name calls in '$workerPath'"
}

function Remove-ConsoleLogs {
    param([string]$workerPath)
    $content = Get-Content -Path $workerPath
    $filtered = $content | Where-Object { $_ -notmatch 'console\.(log|error|warn|info|debug)' }
    Set-Content -Path $workerPath -Value $filtered
    Write-Status "Removed console logs from '$workerPath'"
}

function Remove-NonAsciiCharacters {
    param([string]$workerPath)
    $content = Get-Content -Path $workerPath -Raw
    # Regex to remove non-ASCII characters and Unicode escape sequences
    $cleaned = $content -replace '[^\x00-\x7F]|\\u[0-9A-Fa-f]{4}|\\u\{[0-9A-Fa-f]{1,6}\}', ''
    Set-Content -Path $workerPath -Value $cleaned
    Write-Status "Removed non-ASCII characters and Unicode escapes from '$workerPath'"
}

function Normalize-Whitespace {
    param([string]$workerPath)
    $content = Get-Content -Path $workerPath -Raw

    $pattern = @"
    (
        (?<string>"(?:\\"|[^"])*"|'(?:\\'|[^'])*')   # String literals
        |
        (?<regex>/(?:\\/|[^/\r\n])+?/(?:[gmiuy]+)?)  # Regex literals (basic support)
        |
        (?<block_comment>/\*.*?\*/)                  # Block comments
        |
        (?<line_comment>//[^\r\n]*)                  # Line comments
        |
        (?<space>[ \t]+)                             # Horizontal whitespace
    )
"@

    $cleaned = [regex]::Replace($content, $pattern, {
        param($match)
        if ($match.Groups['space'].Success) {
            ' '  # Collapse spaces/tabs to single space
        } else {
            $match.Value  # Preserve other matched elements
        }
    }, [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnorePatternWhitespace)

    # Replace multiple newlines with a single newline
    $cleaned = $cleaned -replace '[\r\n]+', "`n"

    Set-Content -Path $workerPath -Value $cleaned
    Write-Host "Normalized whitespace sequences in '$workerPath'"
}

function Invoke-JsObfuscation {
    param([string]$workerPath)
    try {
        npx uglify-js $workerPath -o $workerPath --compress --mangle -O keep_quoted_props
        Write-Status "Obfuscated JavaScript using uglify-js"
    }
    catch {
        Write-Status "Failed to obfuscate JavaScript: $_" -Level "ERROR"
        throw
    }
}

function Replace-LetConstWithVar {
    param([string]$workerPath)
    $content = Get-Content -Path $workerPath
    $modified = $content -replace '\b(let|const)\b', 'var'
    Set-Content -Path $workerPath -Value $modified
    Write-Status "Replaced let/const with var in '$workerPath'"
}

#endregion

#region Build Process

function Invoke-WranglerBuild {
    try {
        npx wrangler deploy --dry-run --outdir output *>&1 | Out-Null
        if (!(Test-Path ".\output\worker.js")) {
            throw "Wrangler build failed - no output file created"
        }
        Write-Status "Successfully built worker with wrangler"
    }
    catch {
        Write-Status "Wrangler build failed: $_" -Level "ERROR"
        throw
    }
}

function Initialize-WorkerFile {
    Rename-Item -Path ".\output\worker.js" -NewName "_worker.js" -Force
    Write-Status "Renamed worker.js to _worker.js"
}

function Build-Worker {
    try {
        Ensure-OutputDirectory
        Invoke-WranglerBuild
        Initialize-WorkerFile

        Remove-ConsoleLogs -workerPath $workerPath
        Replace-NameCalls -workerPath $workerPath
        Remove-NonAsciiCharacters -workerPath $workerPath
        Normalize-Whitespace -workerPath $workerPath
        Invoke-JsObfuscation -workerPath $workerPath

        return Get-Content -Path $workerPath -Raw
    }
    catch {
        Write-Status "Build failed: $_" -Level "ERROR"
        throw
    }
}

#endregion

#region Security Functions

function Get-ForbiddenStrings {
    param([string]$filePath)
    if (!(Test-Path $filePath)) {
        Write-Status "Critical error: Missing forbidden strings file '$filePath'" -Level "ERROR"
        exit 1
    }
    return Get-Content $filePath | Where-Object { $_ -match '\S' }
}

function Replace-ForbiddenTerms {
    param(
        [string]$workerPath,
        [array]$terms,
        [System.Collections.Generic.HashSet[string]]$usedValues
    )
    $content = Get-Content -Path $workerPath -Raw
    $replacements = @{}

    foreach ($term in $terms) {
        do {
            $identifier = [char](97..122 | Get-Random) + (-join ((48..57) + (97..102) | Get-Random -Count 3))
        } while (!$usedValues.Add($identifier))

        $replacements[$term] = $identifier
        $pattern = "(?i)\b$([regex]::Escape($term))\b"
        $content = $content -replace $pattern, $identifier
    }

    Set-Content -Path $workerPath -Value $content
    Write-Status "Replaced $($terms.Count) forbidden terms in '$workerPath'"
}

function Test-ForbiddenStrings {
    param(
        [string]$workerPath,
        [array]$forbiddenStrings
    )
    $content = Get-Content -Path $workerPath -Raw
    foreach ($term in $forbiddenStrings) {
        if ($content -imatch "\b$term\b") {
            Write-Status "Security violation detected: '$term'" -Level "WARNING"
            [System.Console]::Beep(800, 500)
            return $true
        }
    }
    return $false
}

#endregion

#region Compression Functions

function Confirm-7ZipAvailable {
    if (!(Test-Path $sevenZipPath)) {
        Write-Status "7-Zip not found at $sevenZipPath" -Level "ERROR"
        exit 1
    }
    Write-Status "7-Zip found at $sevenZipPath"
}

function Stop-7ZipProcesses {
    taskkill /f /im 7zFM.exe 2>&1 | Out-Null
    Write-Status "Terminated 7-Zip GUI processes"
}

function Compress-WorkerFile {
    param(
        [string]$workerPath,
        [string]$outputDir
    )
    Ensure-OutputDirectory -Path $outputDir
    $zipName = "worker-$(New-Guid).zip"

    & $sevenZipPath a -tzip -mx=0 "$outputDir\$zipName" $workerPath *>&1 | Out-Null
    Write-Status "Created compressed worker: $zipName"
}

#endregion

#region Main Execution

try {
    # Initial setup
    Confirm-7ZipAvailable
    Stop-7ZipProcesses
    Remove-Item -Recurse -Force -Path .\output\ -ErrorAction SilentlyContinue

    # Load security data
    $autoForbidden = Get-ForbiddenStrings -filePath $sensitiveFileAuto
    $manualForbidden = Get-ForbiddenStrings -filePath $sensitiveFileManual

    # Initial build
    $originalContent = Build-Worker
    $successCount = 0
    $retryCount = 0
    $maxRetries = $howManyToBuild * 5  # Prevent infinite loops

    while ($successCount -lt $howManyToBuild -and $retryCount -lt $maxRetries) {
        try {
            $retryCount++
            Set-Content -Path $workerPath -Value $originalContent
            $usedIdentifiers = [System.Collections.Generic.HashSet[string]]::new()

            Replace-ForbiddenTerms -workerPath $workerPath -terms $manualForbidden -usedValues $usedIdentifiers
            node .\obfuscate.mjs *>&1 | Out-Null

            if (Test-ForbiddenStrings -workerPath $workerPath -forbiddenStrings $autoForbidden) {
                continue
            }

            Replace-LetConstWithVar -workerPath $workerPath
            Compress-WorkerFile -workerPath $workerPath -outputDir ".\output\zips"

            $successCount++
            Write-Status "Successfully created worker $successCount/$howManyToBuild" -Level "SUCCESS"
        }
        catch {
            Write-Status "Build attempt $retryCount failed: $_" -Level "WARNING"
        }
    }

    # Cleanup and final report
    Get-ChildItem -Path .\output\ -Exclude zips | Remove-Item -Recurse -Force
    if ($successCount -eq $howManyToBuild) {
        Write-Status "Build process completed successfully" -Level "SUCCESS"
    }
    else {
        Write-Status "Build process completed with only $successCount/$howManyToBuild successful builds" -Level "WARNING"
    }
}
catch {
    Write-Status "Critical error in main execution: $_" -Level "ERROR"
    exit 1
}

#endregion