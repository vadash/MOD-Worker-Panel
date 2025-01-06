<h1 align="center">⁉️ Frequently Asked Questions (FAQs)</h1>

### 1. Why isn't the Fragment configuration connecting? 🤔

-   If you've enabled `Routing` and the VPN isn't connecting, the only reason is that the Geo asset isn't updated. Go to the `Geo asset files` section in the v2rayNG app menu and click the cloud or download icon to update them. If the update is unsuccessful, you won't be able to connect. If you've tried everything and it still doesn't update, download two files from the links below. Instead of clicking update, click the add button and import these two files:
> [geoip.dat](https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat)
>
> [geosite.dat](https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat)

<br>

### 2. Why isn't the normal configuration connecting? 😕

-   To use these configurations, turn off `Mux` in the settings of any application you're using.
<br>

### 3. Why aren't Nekobox or Hiddify Next opening any websites? 😭

-   You need to set the `remote DNS` in the application settings like this:
> `https://8.8.8.8/dns-query`

<br>

### 4. Why is the fragment configuration slow on my operator? 🐢

-   Each operator has its own fragment settings. Most work fine with the panel's default settings, but these values might be better for your operator. You'll need to test:
> `Length: 10-100`
>
> `Length: 10-20`

<br>

### 5. Why is my ping so high? 📈

-   Never use `https://1.1.1.1/dns-query` for remote DNS because it increases ping.

<br>

### 6. I used the Proxy IP tutorial links, but it's not opening websites! 😲

-   There are many of these IPs, and many of them might be down. You need to test to find a good one.

<br>

### 7. The proxy IP was working, but now it's not! 😫

-   If you use a single IP, it will likely stop working after a while, and many sites won't open. You'll need to go through these steps again. If you're not doing anything that requires a fixed IP, it's better to leave it at the panel's default. Don't use a single Proxy IP.

<br>

### 8. Why am I getting an error when I go to the `panel/` address? 😵

-   Follow the setup tutorial. KV is not configured correctly.

<br>

### 9. I deployed, but Cloudflare is giving me an error 1101! 🤯

-   If it was a worker, create it using the Pages method. If that also gives an error, your Cloudflare account has been previously identified. Create a new GitHub and Cloudflare account with an official email like Gmail, preferably using the Pages method. Also, change the project name so that it doesn't contain the word "bpb".
-   A [new method](https://github.com/bia-pain-bache/BPB-Worker-Panel/blob/main/docs/pages_upload_installation_fa.md) for Pages has been introduced, which is more recommended than all other methods. Currently, use this method.

<br>

### 10. Can I use it for trading? 🧐

-   If your Cloudflare IP is Germany (which it usually is), use a single German Proxy IP. You probably won't have any problems, but it's better to use the Chain Proxy method to fix the IP.

<br>

### 11. I deployed using the Pages method, but when I click "Sync fork" in GitHub for a new version, the panel version doesn't change! 🤨

-   Every time you update, Cloudflare creates a new test link for that version. That's why when you open the project, you see several different links in the Deployment section. None of these are your main panel link. At the top of the page, in the Production section, click "Visit Site" and access the panel from there.

<br>

### 12. I enabled non-TLS ports, but they're not connecting! 🙄

-   Note that to use non-TLS configurations, you must have deployed only through Workers without a personal domain or Custom Domain.

<br>

### 13. Why isn't the Best Fragment configuration connecting, or why is it giving ping but not working? 😒

-   Turn off `Prefer IPv6` in the settings.

<br>

### 14. Why aren't Telegram voice calls or Clubhouse working? 😢

-   Cloudflare can't properly establish the UDP protocol. Currently, there's no effective solution for this.

<br>

### 15. Why isn't the normal Trojan configuration connecting? 😭

-   If you want to connect with the normal subscription, check the Remote DNS in any application you're using to make sure it's the same as the panel. Formats like udp://1.1.1.1 or 1.1.1.1 don't work with Trojan. The following formats are suitable:
    -   `https://8.8.8.8/dns-query`
    -   `tcp://8.8.8.8`
    -   `tls://8.8.8.8`
-   I recommend using the Full Normal or Fragment subscription, which have all the settings.

<br>

### 16. Why isn't ChatGPT opening? 🤖

-   Because the panel's default Proxy IPs are public, and many of them might be suspicious to ChatGPT. You need to search and test from the link below to find a suitable IP for yourself:
> https://www.nslookup.io/domains/bpb.yousef.isegaro.com/dns-records/

<br>

### 17. I forgot my panel password! What should I do? 😱

-   Go to the Cloudflare dashboard, find the KV you created for Worker or Pages, and click "view". Go to the KV Pairs section. In the table, you'll see "pwd". The value next to it is your password.

<br>

### 18. What happens if I don't change the UUID and Trojan password? 😬

-   From version 2.7.7 onwards, setting these two parameters is mandatory, and the panel won't start without them.

