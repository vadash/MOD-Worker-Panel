# ==================================================================
# Script: build.ps1
# Description: This script builds Cloudflare Workers, obfuscates them,
#              check for forbidden strings and compresses them into zip files.
# Creator: vadash
# ==================================================================

# Constants
$howManyToBuild = 10
$sevenZipPath = "C:\Program Files\7-Zip\7z.exe"

# Validate 7-Zip installation
if (!(Test-Path $sevenZipPath)) {
    Write-Host "Error: 7-Zip not found at $sevenZipPath"
    exit 1
}

# Remove the output directory if it exists
Remove-Item -Recurse -Force -Path .\output\ -ErrorAction SilentlyContinue

# Forbidden strings
$forbiddenStrings = "vless", "trojan", "warp", "hiddify", "sing", "bpb", "edge", "tunnel", "epeius", "cmliu", "v2ray", "vpn"

# Build worker once
try {
    # Ensure the output directory exists
    if (!(Test-Path -Path .\output\)) {
        New-Item -ItemType Directory -Path .\output\
    }

    # Build the worker
    npx wrangler deploy --dry-run --outdir output
    
    # Rename worker
    Rename-Item -Path ".\output\worker.js" -NewName "_worker.js"
    
    # Remove comments from worker
    npx terser output\_worker.js -o output\_worker.js --comments false
    
    # Store the original worker content
    $originalWorker = Get-Content -Path .\output\_worker.js -Raw
} catch {
    Write-Host "Failed to build worker: $_"
    pause
    exit 1
}

$successfulBuilds = 0
while ($successfulBuilds -lt $howManyToBuild) {
    try {
        # Create fresh copy of worker
        Set-Content -Path .\output\_worker.js -Value $originalWorker

        # Obfuscate the worker with proper tool
        node .\obfuscate.mjs

        # Search for forbidden strings in the worker output script
        $workerScript = Get-Content -Path .\output\_worker.js -Raw
        $forbiddenFound = $false
        foreach ($string in $forbiddenStrings) {
            if ($workerScript -imatch $string) {
                Write-Host "Warning: Forbidden string '$string' found in worker script. Retrying..."
                [System.Console]::Beep(800,500)
                $forbiddenFound = $true
                break
            }
        }

        # Skip to the next iteration if a forbidden string was found
        if ($forbiddenFound) {
            continue
        }

        # Replace "let" and "const" with "var"
        (Get-Content -Path .\output\_worker.js) -replace '\b(let|const)\b', 'var' | Set-Content -Path .\output\_worker.js

        # Prepare for 7-Zip compression
        $randomGuid = [guid]::NewGuid().ToString()
        $zipFileName = "worker-$randomGuid.zip"
        $zipsDirectory = ".\output\zips"

        # Ensure the zips directory exists
        if (!(Test-Path -Path $zipsDirectory)) {
            New-Item -ItemType Directory -Path $zipsDirectory
        }

        # max compression
        #& $sevenZipPath a -tzip -mx=9 -mm=Deflate -mfb=258 -mpass=15 "$zipsDirectory\$zipFileName" ".\output\_worker.js"
        # no compression
        & $sevenZipPath a -tzip -mx=0 "$zipsDirectory\$zipFileName" ".\output\_worker.js"

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
