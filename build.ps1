# ==================================================================
# Script: build.ps1
# Description: This script builds Cloudflare Workers, obfuscates them,
#              check for forbidden strings and compresses them into zip files.
# Creator: vadash
# ==================================================================

# Constant: How many to build
$howManyToBuild = 4

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
        # Remove comments from worker (long ass js-ssh code in the end)
        npx terser output\_worker.js -o output\_worker.js --comments false
        # Apply control-flow-flattening (optional)
        #npx javascript-obfuscator output\_worker.js --output output\_worker.js --split-strings false --compact false --control-flow-flattening true --control-flow-flattening-threshold 0.75 --dead-code-injection false --debug-protection false --disable-console-output false --numbers-to-expressions false --rename-globals false --rename-properties false --self-defending false --simplify false --string-array false --string-array-encoding 'none' --string-array-index-shift false --string-array-rotate false --string-array-shuffle false --string-array-wrappers-count 0 --string-array-wrappers-chained-calls false --string-array-threshold 0 --transform-object-keys false --unicode-escape-sequence false
        # Obfuscate the worker with proper tool
        node .\obfuscate.mjs
        # Search for forbidden strings in the worker output script
        $workerScript = Get-Content -Path .\output\_worker.js -Raw
        $forbiddenFound = $false
        foreach ($string in $forbiddenStrings) {
            if ($workerScript -imatch $string) {   # -imatch makes the match case-insensitive
                Write-Host "Warning: Forbidden string '$string' found in worker script. Skipping this build."
                [System.Console]::Beep(800,500)
                $forbiddenFound = $true
                break  # Exit the inner loop once a forbidden string is found
            }
        }

        # Skip to the next iteration if a forbidden string was found
        if ($forbiddenFound) {
            # Clear the output directory except for the zips folder
            Get-ChildItem -Path .\output\ -Exclude zips | Remove-Item -Recurse -Force
            continue
        }

        # Replace "let" and "const" with "var" before obfuscation. Better to do it here since obfuscator only use "var" code
        (Get-Content -Path .\output\_worker.js) -replace '\b(let|const)\b', 'var' | Set-Content -Path .\output\_worker.js
        # Compress the worker with random name into the zips folder
        $randomGuid = [guid]::NewGuid().ToString()
        $zipFileName = "worker-$randomGuid.zip"
        # Ensure the zips directory exists
        $zipsDirectory = ".\output\zips"
        if (!(Test-Path -Path $zipsDirectory)) {
            New-Item -ItemType Directory -Path $zipsDirectory
        }
        # Compress the file with the maximum compression level
        $compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
        Compress-Archive -Path .\output\_worker.js -DestinationPath "$zipsDirectory\$zipFileName" -CompressionLevel $compressionLevel -Force
        # Clear the output directory except for the zips folder
        Get-ChildItem -Path .\output\ -Exclude zips | Remove-Item -Recurse -Force
    } catch {
        Write-Host "An error occurred: $_"
        pause
        exit
    }
}