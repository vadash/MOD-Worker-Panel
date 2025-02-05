# 🛠️ MOD Worker Panel

A modified Cloudflare Worker Panel for **my** needs. You are welcome to use it.

# ⭐ Key Features

- 🔒 Optimized obfuscation that won't trigger Cloudflare AV and is light on CPU
- 🚫 Automatic banned word detection in obfuscated code (vless, trojan, bpb)
- 🌐 Smart CleanIP management with random selection (up to 10 IPs) from clean IP pool

# 🚀 Configuration

## 🔑 Required Environment Variables

- `ID`: Your UUID for VLESS (old `UUID`)
- `PASS`: Password for Trojan protocol (old `TROJAN_PASS`)
- `HASH`: Hash for Trojan protocol (calc it here for `PASS` https://emn178.github.io/online-tools/sha224.html)
- `DATABASE`: KV namespace for settings storage (old hardcoded `bpb`). Must be same as KV name.
- `PROXYIP`: Comma-separated list of proxy IPs. Pick few closest to your location https://www.nslookup.io/domains/bpb.yousef.isegaro.com/dns-records/. Or just use `bpb.yousef.isegaro.com` if you are lazy.
- `MOCK_DB`: using D1 database to pin worker to specific region.

![image](https://i.imgur.com/9m5jcJQ.png)

## ⚙️ Panel Settings

### 🌍 Clean IPs

https://github.com/goingfine/WinCFScan

Example:

```
108.162.198.28,108.162.198.164,23.227.39.128,23.227.39.83,45.12.31.29,45.12.30.95,195.245.221.118,195.245.221.53,104.25.236.198,104.25.140.172,188.244.122.154,188.244.122.8,141.101.120.101,141.101.121.60,185.176.26.247,185.176.26.153,195.85.23.46,195.85.23.61,199.181.197.120,199.181.197.2,104.22.55.15,104.22.43.239,45.131.5.20,45.131.5.102,172.66.217.214,172.66.129.151,185.135.9.14,185.135.9.167,162.159.60.98,162.159.253.109,154.85.99.215,154.85.99.137,103.169.142.219,103.169.142.117,45.80.111.218,45.80.111.111,185.148.107.69,185.148.107.54,89.116.250.251,89.116.250.124,45.8.211.235,45.8.211.222,185.193.28.231,185.193.28.24,170.114.45.222,170.114.46.33,168.100.6.39,168.100.6.208,104.24.192.66,104.24.86.106,31.43.179.166,31.43.179.153,188.42.88.124,188.42.88.206,104.20.42.62,104.20.127.20,104.19.5.69,104.19.145.125,188.114.97.155,188.114.99.212,156.238.19.229,156.238.19.195,185.162.230.167,185.162.230.98,194.152.44.102,194.152.44.236,172.64.69.108,45.85.118.28,45.85.119.170,147.78.140.125,147.78.140.56,190.93.247.239,190.93.244.35,205.233.181.138,205.233.181.84,159.246.55.144,159.246.55.125,66.235.200.53,66.235.200.105,185.146.173.37,185.146.173.44,185.221.160.29,185.221.160.225,192.65.217.189,192.65.217.113,172.67.11.230,172.67.27.97,104.27.127.11,104.27.11.55,104.21.61.199,104.21.231.8,160.153.0.59,160.153.0.182,185.174.138.94,185.174.138.241,45.142.120.55,45.142.120.9,45.159.216.46,45.159.217.230,103.160.204.250,103.160.204.48,154.83.2.152,154.83.2.124,194.53.53.76,194.53.53.37,162.251.82.95,162.251.82.132,141.193.213.87,141.193.213.239,185.238.228.54,185.238.228.122,185.59.218.169,185.59.218.219,108.165.216.31,108.165.216.72,159.112.235.13,159.112.235.191,193.9.49.201,193.9.49.187,66.81.247.158,66.81.247.95,193.227.99.7,193.227.99.123,91.193.59.7,91.193.58.184,194.36.55.59,194.36.55.183,198.41.201.130,198.41.216.12,185.18.250.223,185.18.250.98,147.185.161.48,147.185.161.195,104.16.74.225,104.16.96.97,185.170.166.169,185.170.166.127,104.254.140.79,104.254.140.243,103.21.244.96,103.21.244.5,104.26.5.39,173.245.59.126,173.245.49.227,104.31.16.99,104.31.16.236,104.18.73.253,104.18.240.219
```

### Filter Clean IP

Often you can leverage latency to find good IPs. For example, you are in center of Iran and closest CF inside country has 35 ms ping. Next stop is EU with 60 ms. Use next PS1 script that read clean ip list from clipboard and select best ones

```
# Define constants for better readability and maintainability
$MIN_LATENCY = 35+5  # Minimum acceptable latency in milliseconds
$MAX_LATENCY = 60+10  # Maximum acceptable latency in milliseconds
$PING_ATTEMPTS = 5 # Number of times to ping each IP address

# Retrieve the content from the clipboard
$clipboardContent = Get-Clipboard

# Split the clipboard content by commas to get individual IP addresses
$ipList = $clipboardContent -split ','

# Check if the clipboard content is empty or not a valid list of IP addresses
if ($null -eq $ipList -or $ipList.Count -eq 0) {
    Write-Error "Clipboard does not contain a valid comma-separated list of IP addresses."
    return
}

# Initialize an array to store filtered IP addresses
$filteredIPs = @()

# Loop through each IP address in the list
foreach ($ip in $ipList) {
    # Trim any leading or trailing whitespace from the IP address
    $trimmedIP = $ip.Trim()

    # Initialize an array to store response times for the current IP
    $responseTimes = @()

    # Ping the IP address multiple times to get response times
    for ($i = 0; $i -lt $PING_ATTEMPTS; $i++) {
        $pingResult = Test-Connection -ComputerName $trimmedIP -Count 1 -ErrorAction SilentlyContinue
        if ($pingResult) {
            # If the ping is successful, add the response time to the array
            $responseTimes += $pingResult.ResponseTime
        }
    }

    # Check if we have any response times recorded
    if ($responseTimes.Count -gt 0) {
        # Calculate the average latency from the response times
        $avgLatency = ($responseTimes | Measure-Object -Average).Average

        # Check if the average latency is within the desired range
        if ($avgLatency -gt $MIN_LATENCY -and $avgLatency -lt $MAX_LATENCY) {
            # If the latency is within the range, add the IP to the filtered list
            $filteredIPs += $trimmedIP
        }
    }
}

# Create comma-separated string and copy to clipboard
if ($filteredIPs.Count -gt 0) {
    $output = $filteredIPs -join ','
    $output | Set-Clipboard
    $output  # Display results in console
} else {
    Write-Warning "No IP addresses matched the latency criteria"
    "" | Set-Clipboard  # Clear clipboard if no results
}
```

# 📝 Credits

Based on [BPB Worker Panel](https://github.com/bia-pain-bache/BPB-Worker-Panel) <3
