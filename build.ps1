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
$forbiddenStrings = "vless", "trojan", "user", "warp", "noise", "hiddify", "bypass", "sing", "bpb", "edge", "tunnel", "epeius", "cmliu", "v2ray", "vpn"

for ($i = 0; $i -lt $howManyToBuild; $i++) {
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

        # Obfuscate the worker with proper tool
        node .\obfuscate.mjs

        # Search for forbidden strings in the worker output script
        $workerScript = Get-Content -Path .\output\_worker.js -Raw
        $forbiddenFound = $false
        foreach ($string in $forbiddenStrings) {
            if ($workerScript -imatch $string) {
                Write-Host "Warning: Forbidden string '$string' found in worker script. Skipping this build."
                [System.Console]::Beep(800,500)
                $forbiddenFound = $true
                break
            }
        }

        # Skip to the next iteration if a forbidden string was found
        if ($forbiddenFound) {
            Get-ChildItem -Path .\output\ -Exclude zips | Remove-Item -Recurse -Force
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

        # Use 7-Zip for ultra compression
        # Parameters:
        # a - add to archive
        # -tzip - zip format
        # -mx=9 - maximum compression level
        # -mm=Deflate - deflate compression method
        # -mfb=258 - maximum number of fast bytes
        # -mpass=15 - maximum number of passes
        & $sevenZipPath a -tzip -mx=9 -mm=Deflate -mfb=258 -mpass=15 "$zipsDirectory\$zipFileName" ".\output\_worker.js"

        # Clear the output directory except for the zips folder
        Get-ChildItem -Path .\output\ -Exclude zips | Remove-Item -Recurse -Force

    } catch {
        Write-Host "An error occurred: $_"
        pause
        exit
    }
}
