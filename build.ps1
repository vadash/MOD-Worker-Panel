# ==================================================================
# Script: build.ps1
# Description: This script builds Cloudflare Workers, obfuscates them,
#              checks for forbidden strings, and compresses them into zip files.
# Creator: vadash
# ==================================================================

# Constants
$howManyToBuild = 10
$sevenZipPath = "C:\Program Files\7-Zip\7z.exe"
$sensitiveFileAuto = ".\sensitive_words_auto.txt"
$sensitiveFileManual = ".\sensitive_words_manual.txt"
$workerPath = ".\output\_worker.js"

# Function to replace __name calls in the worker file
function Replace-NameCalls {
    param(
        [string]$workerPath
    )

    # Read the content of the worker file
    $content = Get-Content -Path $workerPath -Raw

    # Find all __name function calls
    $nameCalls = [regex]::Matches($content, '__name\(([^,]+),\s*"([^"]+)"\)')

    if ($nameCalls) {
        # Create a List to store replacements
        $replacements = New-Object System.Collections.Generic.List[object]

        foreach ($call in $nameCalls) {
            # Generate a random 8-character hex string
            $randomHexString = -join (Get-Random -Count 8 -InputObject ([char[]]'0123456789abcdef'))

            # Construct the new __name call with the random hex string
            $newCall = $call.Value -replace '__name\(([^,]+),\s*"([^"]+)"\)', "__name(`$1, `"$randomHexString`")"

            # Add the original and new calls to the List
            $replacements.Add(@{ Original = $call.Value; New = $newCall })
        }

        # Replace the original calls with the new ones
        $newContent = $content
        foreach ($replacement in $replacements) {
            $newContent = $newContent.Replace($replacement.Original, $replacement.New)
        }

        # Write the modified content back to the file
        Set-Content -Path $workerPath -Value $newContent -Force
        Write-Host "Successfully replaced __name calls in '$workerPath'"
    } else {
        Write-Host "No __name calls found in '$workerPath'"
    }
}

# Function to validate 7-Zip installation
function Validate-7ZipInstallation {
    if (!(Test-Path $sevenZipPath)) {
        Write-Host "Error: 7-Zip not found at $sevenZipPath"
        exit 1
    }
}

# Function to kill 7z GUI if it's running
function Stop-7zGUI {
    taskkill /f /im 7zFM.exe
}

# Function to load forbidden strings from file
function Load-ForbiddenStrings {
    param(
        [string]$filePath
    )

    if (Test-Path $filePath) {
        return Get-Content $filePath
    } else {
        Write-Host "Error: $filePath not found."
        exit 1
    }
}

# Function to build the worker
function Build-Worker {
    try {
        # Ensure the output directory exists
        if (!(Test-Path -Path .\output\)) {
            New-Item -ItemType Directory -Path .\output\
        }

        # Build the worker
        npx wrangler deploy --dry-run --outdir output

        # Rename worker
        Rename-Item -Path ".\output\worker.js" -NewName "_worker.js"

        # Remove console logging
        $workerContent = Get-Content -Path $workerPath
        $cleanedContent = $workerContent | Where-Object { $_ -notmatch 'console.*(?:log|error)' }
        Set-Content -Path $workerPath -Value $cleanedContent

        # Remove debug code (__name functions)
        Replace-NameCalls -workerPath $workerPath

        # Remove non-ASCII characters (including emojis) while preserving basic whitespace
        $workerContent = Get-Content -Path $workerPath -Raw
        $cleanedContent = $workerContent -replace '[^\x00-\x7F]', ''
        Set-Content -Path $workerPath -Value $cleanedContent

        # Remove comments from worker
        npx uglify-js $workerPath -o $workerPath --compress --mangle -O keep_quoted_props

        # Store the original worker content
        return Get-Content -Path $workerPath -Raw
    } catch {
        Write-Host "Failed to build worker: $_"
        pause
        exit 1
    }
}

# Function to replace forbidden strings with random hex names
function Replace-ForbiddenStrings {
    param(
        [string]$workerPath,
        [string[]]$forbiddenStrings,
        [System.Collections.Generic.HashSet[string]]$usedHexValues
    )

    $forbiddenReplacements = @{}
    foreach ($forbiddenString in $forbiddenStrings) {
        # Generate a unique random identifier starting with letter followed by hex
        do {
            $randomLetter = [char](Get-Random -Minimum 97 -Maximum 123) # a-z
            $length = Get-Random -Minimum 1 -Maximum 2
            $randomHex = -join ((48..57) + (97..102) | Get-Random -Count $length | ForEach-Object {[char]$_})
            $identifier = "$randomLetter$randomHex"
        } while (!$usedHexValues.Add($identifier))
        $forbiddenReplacements[$forbiddenString] = $identifier
    }

    $jsContent = Get-Content -Path $workerPath -Raw
    foreach ($forbiddenString in $forbiddenStrings) {
        # Use word boundaries with case-insensitive matching
        $pattern = "(?i)\b$forbiddenString\b"
        $jsContent = $jsContent -replace $pattern, $forbiddenReplacements[$forbiddenString]
    }
    Set-Content -Path $workerPath -Value $jsContent
}

# Function to check for forbidden strings in the worker script
function Check-ForbiddenStrings {
    param(
        [string]$workerPath,
        [string[]]$forbiddenStrings
    )

    $workerScript = Get-Content -Path $workerPath -Raw
    foreach ($string in $forbiddenStrings) {
        if ($workerScript -imatch $string) {
            Write-Host "Warning: Forbidden string '$string' found in worker script. Retrying..."
            [System.Console]::Beep(800,500)
            return $true
        }
    }
    return $false
}

# Function to compress the worker into a zip file
function Compress-Worker {
    param(
        [string]$workerPath,
        [string]$zipsDirectory
    )

    $randomGuid = [guid]::NewGuid().ToString()
    $zipFileName = "worker-$randomGuid.zip"

    # Ensure the zips directory exists
    if (!(Test-Path -Path $zipsDirectory)) {
        New-Item -ItemType Directory -Path $zipsDirectory
    }

    # Set no compression to see real size
    & $sevenZipPath a -tzip -mx=0 "$zipsDirectory\$zipFileName" $workerPath
}

# Main script execution
Validate-7ZipInstallation
Stop-7zGUI

# Remove the output directory if it exists
Remove-Item -Recurse -Force -Path .\output\ -ErrorAction SilentlyContinue

# Load forbidden strings from file
$sensitiveStringsAuto = Load-ForbiddenStrings -filePath $sensitiveFileAuto
$sensitiveStringsManual = Load-ForbiddenStrings -filePath $sensitiveFileManual

# Build worker once
Build-Worker
$originalWorker = Get-Content -Path $workerPath -Raw

$successfulBuilds = 0
while ($successfulBuilds -lt $howManyToBuild) {
    try {
        # Create fresh copy of worker
        Set-Content -Path $workerPath -Value $originalWorker

        # Replace forbidden variable/function names with random hex names
        $usedHexValues = [System.Collections.Generic.HashSet[string]]::new()
        Replace-ForbiddenStrings -workerPath $workerPath -forbiddenStrings $sensitiveStringsManual -usedHexValues $usedHexValues

        # Obfuscate the worker with proper tool
        node .\obfuscate.mjs

        # Search for forbidden strings in the worker output script
        if (Check-ForbiddenStrings -workerPath $workerPath -forbiddenStrings $sensitiveStringsAuto) {
            continue
        }

        # Replace "let" and "const" with "var"
        (Get-Content -Path $workerPath) -replace '\b(let|const)\b', 'var' | Set-Content -Path $workerPath

        # Prepare for 7-Zip compression
        $zipsDirectory = ".\output\zips"
        Compress-Worker -workerPath $workerPath -zipsDirectory $zipsDirectory

        # Increment successful builds counter only after everything succeeds
        $successfulBuilds++
        Write-Host "Successfully created worker $successfulBuilds of $howManyToBuild"

    } catch {
        Write-Host "An error occurred: $_"
        continue
    }
}

# Clean up temporary files
Get-ChildItem -Path .\output\ -Exclude zips | Remove-Item -Recurse -Force
Write-Host "Build process completed. Created $successfulBuilds workers."