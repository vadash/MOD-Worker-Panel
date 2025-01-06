# **How to Use and Configure** ⚙️

Let's say your worker or pages name is `worker-polished-leaf-d022`  কর্মী-পালিশ-পাতা-d022:

You can access the Panel by adding `/panel` at the end, like this:

>`https://worker-polished-leaf-d022.workers.dev/panel`

It'll ask you to set a new password, then you can log in, and that's it! 🎉

> [!IMPORTANT]
> The password must be at least **8 characters** long and include at least one **uppercase letter** and one **number**. You can also change the password later from the bottom of the panel.

Now, let's explore the different sections of the panel:
<br><br>

# 1 - Normal Subscription ✨

<p align="center">
  <img src="assets/images/Normal-Configs.jpg">
</p>

I'm starting with this section because many of you might prefer to use it without Fragment or panel settings. But keep in mind, you'll need to know how to configure your applications, or you might run into issues. 🤔 I recommend using the `Full Normal` subscriptions because they have all the panel settings applied, so you don't have to do anything special. Please note that Routing Rules, Chain Proxy, and panel DNS settings are not applied to this subscription (you need to configure them manually in the application).

This link provides you with 6 configurations. (You can increase the number of configurations from the Clean IP, Port, and Protocol settings section). Now, what's the difference between these 6 configurations?

-   **Websocket Path:**  Each configuration has a different path.
-   **Configuration Address:** Among these 6 configurations, the first one is your worker's domain, the second is `www.speedtest.net`, which is clean on most operators, and 3 to 6 are your domain's IPs, which are usually clean too. Two IPv4 and two IPv6.

How can you increase their number? I've explained more details and settings in the sections [Adding Clean IP](#1-4--clean-ip-settings), [Adding Ports](#1-9--port-selection), [Selecting Protocols](#1-8--protocol-selection), and [Adding Custom CDN](#1-6--custom-cdn-settings).

> [!CAUTION]
> To use this subscription, turn off Mux in the settings of any application you're using.

> [!WARNING]
> Using this Worker will frequently change your device's IP address. Therefore, avoid using it for sensitive activities like trading, PayPal, or even sites like Hetzner, as there's a risk of getting banned. We've provided two solutions for fixing the IP: one is [setting Proxy IP](#1-2--proxy-ip-settings) during setup, and the other is [using Chain Proxy](#1-3--chain-proxy-settings).
<br><br>

# 2 - Full Normal Subscription  পরিপূর্ণ স্বাভাবিক

<p align="center">
  <img src="assets/images/Full-Normal-Configs.jpg">
</p>

This subscription provides the above configurations but with all the VLESS/Trojan panel settings applied, which you can learn about [here](#1--vlesstrojan-settings). This subscription also includes the **Best Ping** configuration (explained below). By applying routing settings, it blocks about 90% of Iranian and foreign ads, bypasses Iranian and Chinese websites (no need to turn off VPN for payment gateways, etc.), bypasses LAN, blocks porn and QUIC, and the Sing-box subscription also blocks Phishing and Malware content to a good extent.

> [!TIP]
> What is the **Best Ping** configuration? This configuration merges all the panel's configurations and checks every 30 seconds which configuration has the best speed, then connects to it! If you've entered a clean IP, activated the Trojan protocol, or selected other ports, it will also be added to Best Ping. We also have this type of configuration in the Fragment and Warp subscriptions, which I'll explain later.
<br><br>

# 3 - Fragment Subscription 🧩

<p align="center">
  <img src="assets/images/Fragment-Sub.jpg">
</p>

> [!NOTE]
> **Properties of Fragment Configurations**
>
> 1- Connection even if your personal domain or worker is filtered.
>
> 2- Improved quality and speed on all operators, especially those with disruptions on Cloudflare.

<br>

## 3-1 - Fragment Subscription for Xray  एक्सरे

This refers to applications that use the Xray core. It's essentially the first row of the FRAGMENT SUB table in the panel. Importing it into the app is the same as a regular subscription. The configurations in this section have an `F` in their name.

This subscription gives you the same number of configurations as in Full Normal but with fragmentation (with the fragment settings you applied in the panel), plus the **Best Fragment** and **Workerless** configurations. Any settings you make in the panel will be applied to all configurations when you update the subscription.

> [!TIP]
> The WorkerLess configuration opens many filtered websites and applications without a worker! Like YouTube, Twitter, Google Play, and other filtered sites that I can't list here. Keep in mind that since this configuration doesn't use a worker, it doesn't change your IP, so it's not suitable for security-sensitive tasks. The changes you make for fragmentation in the panel are also applied to this configuration, except for Chain Proxy.

> [!TIP]
> The Best Fragment configuration applies 18 different fragment values and chooses the one with the best speed based on your operator! These 18 modes are chosen so that no range is missed, and the configuration tests all small and large ranges every 1 minute and connects to the best one.
Advanced settings related to fragmentation are explained [here](#4-2--fragment-settings).
<br><br>

## 3-2- Fragment Subscription for Hiddify হিড্ডিফাই

The second row of the FRAGMENT SUB table is for using fragmentation on the Hiddify app, with one difference. Due to the limitations of this app, many panel settings are not applied to this subscription. In fact, the app itself rewrites these settings. The configurations in this section have an `F` in their name. You need to manually apply the following settings in the Hiddify app, and they are not currently applied from the panel:

1. Remote DNS
2. Local DNS
3. Fragment Packets
4. Routing

> [!CAUTION]
> 1- Be sure to change the Remote DNS from the app settings to a DOH like:
> https://8.8.8.8/dns-query or https://94.140.14.14/dns-query
> If you use ...//:udp or an empty IP in this section, your worker won't work.
>
> 2- If you manually turn on Fragment in the app, the panel's fragment settings won't be applied.

Of course, there's another way, which is to import the normal subscription into the Hiddify app and activate fragmentation yourself, as shown in the picture below:

<p align="center">
  <img src="assets/images/Hiddify_fragment.jpg">
</p>
<br><br>

# 4- Warp Subscription 🌀

<p align="center">
  <img src="assets/images/Warp-Configs.jpg">
</p>

This subscription provides a Warp configuration with an Iranian Cloudflare IP and a Warp on Warp (WoW) configuration with a foreign IP (currently, due to Cloudflare changes, it sometimes gives an Iranian IP). It also includes a Warp Best Ping configuration that connects to the fastest Warp configuration and always has an Iranian IP, and a WoW Best Ping configuration that connects to the fastest WoW configuration with a foreign IP. By default, there's only one Warp and WoW configuration, but if you edit the Endpoints section, Warp and WoW configurations will be added for each input Endpoint.

Keep in mind that you should use a scanner to find the appropriate Endpoint for your operator. The scanner script is in the panel; copy it and run it in Termux on Android. To put it in the panel, read section 7-4 of the advanced settings. The regular Warp subscription might work well on some operators like Irancell, but for others, use the Warp Pro subscription.
<br><br>

# 5- Warp PRO Subscription 🚀

<p align="center">
  <img src="assets/images/Warp-Pro-Configs.jpg">
</p>

New developments have been made on the Xray and Singbox cores by GFW-Knocker and the Hiddify team for Warp, resulting in apps like MahsaNG, NikaNG, v2rayN-PRO, and Hiddify. These developments have allowed us to optimize Warp connections for Iran, similar to what the guys are doing with Oblivion. Therefore, I've added the WARP PRO SUB to the panel, which can be customized from the WARP PRO SETTINGS section. Optimal values for each operator are obtained experimentally, which, like fragment settings, may vary at different times. However, the default values have been tested and are currently working well; you just need to put the appropriate Endpoint.

> [!CAUTION]
> The Hiddify app must be at least version 2.0.5.

<br>
<h1 align="center">My IP Table</h1>

<p align="center">
  <img src="assets/images/My-IP.jpg">
</p>

After connecting to the proxy, you can refresh the page and refer to this table to see your IPs. This table has two rows. The first row shows your IP for Cloudflare addresses. If you have a Proxy IP, your IP for Cloudflare addresses will be this Proxy IP, and for other addresses, it will be a random Cloudflare IP. Therefore, you can check if the Proxy IP you selected has been applied. If you connect with Warp configurations, both rows of the table should show the same IP. Note that for this section to work correctly, if you're using the uBlock Origin extension, you need to disable it.
<br><br>

<h1 align="center">Advanced Settings</h1>

First, let me say that if you make any wrong changes, don't worry. Next to the APPLY SETTINGS button, I've put a Reset button that returns the panel to its default settings.
<br><br>

## 1- VLESS/TROJAN Settings

<p align="center">
  <img src="assets/images/VLESS_Trojan_settings.jpg">
</p>

This section is for configuring Fragment configurations and Clash and Singbox subscriptions. It doesn't affect the configurations in the normal v2ray section or Warp subscriptions.

### 1-1- DNS Servers

By default, I've set Google DOH for Remote DNS and Google DNS for Local DNS. So, in the default configuration, it's:

>`Remote DNS: https://8.8.8.8/dns-query`
>
>`Local DNS: 8.8.8.8`

> [!CAUTION]
> Never use `https://1.1.1.1/dns-query` or `https://cloudflare-dns.com/dns-query` for remote DNS because it increases ping and makes the connection unstable.

> [!TIP]
> From version 2.5.5 onwards, you can use official DOH or DOTs and be sure they have the best performance. For example, here are a few:
>
> `https://dns.google/dns-query`
>
> `https://dns.adguard-dns.com/dns-query`
>
> `https://dns.quad9.net/dns-query`
>
> `tls://dns.google`

You can also enable Fake DNS, which helps with DNS speed, but be aware that it might not be compatible with some applications or might affect the system's DNS. So, if you don't know exactly what it is, it's better not to enable it.
<br><br>

### 1-2- Proxy IP Settings

To change the Proxy IP from version 2.3.5 onwards, you can do it through the panel itself. Apply the settings, update the subscription, and that's it. However, I recommend using the old method of the Cloudflare dashboard because:

> [!CAUTION]
> If you apply the Proxy IP through the panel and that IP stops working, you need to replace it with another IP and update the subscription. This means that if you've donated a configuration and change the Proxy IP, it's no longer useful because the user doesn't have the subscription to update the configuration. Therefore, it's recommended to use this method only for personal use. But the good thing about the old method is that it doesn't require updating the configurations.

For example, you can choose a Proxy IP from the link below. It shows a number of IPs, and you can check their country and choose one or more:

>[Proxy IP](https://www.nslookup.io/domains/bpb.yousef.isegaro.com/dns-records/)

Or you can scan for yourself using [this tutorial](https://github.com/bia-pain-bache/BPB-Worker-Panel/blob/main/docs/proxy-ip-scanner.md). However, the scanner might not work well at the moment, but you can try.

> [!TIP]
> If you want to have multiple Proxy IPs, you can enter them separated by commas, like `151.213.181.145`,`5.163.51.41`,`bpb.yousef.isegaro.com`

<br><br>

### 1-3- Chain Proxy Settings

Previously, we mentioned that you could set a Proxy IP and fix the IP for sites behind Cloudflare. However, when we open regular sites, our IP still belongs to the worker, which changes every now and then. To fix the IP for all sites, this section has been added. We can put a free VLESS, Socks, or Http configuration here, even if it's filtered (provided it's only filtered in Iran but still works), and our IP will be permanently fixed to the IP of this configuration.

> [!CAUTION]
> 1- This configuration should not be a worker itself; otherwise, your final IP will still change.
>
> 2- There are many sources for free configurations. I recommend [racevpn.com](https://racevpn.com), which has a time limit. You can get configurations based on the country. You can also use configurations from [IRCF](https://ircfspace.github.io/tconfig/) or the Telegram bot [ی ب خ](https://t.me/TheTVCbot), but some of their configurations might be outdated.
>
> 3- The VLESS configuration can be one of the following types:
>
> `Reality TCP`
>
> `Reality GRPC`
>
> `Reality WS`
>
> `Reality TCP Header`
>
> `WS TLS`
>
> `GRPC TLS`
>
> `TCP TLS`
>
> `WS`
>
> `GRPC`
>
> `TCP`
>
> `TCP Header`
>
> 5- The Socks configuration can be one of the following forms:
>
> socks://`address`:`port`
>
> socks://`user`:`pass`@`address`:`port`
>
> 6- The Http configuration can be one of the following forms:
>
> http://`address`:`port`
>
> http://`user`:`pass`@`address`:`port`
>
> 7- This section only applies to all subscriptions except the first row of the Normal table and Warp subscriptions. After applying, be sure to update the subscription. But the normal subscription gives you that configuration individually. For example, you can edit your subscription in the Nekobox or Husi app in the Group section and set this configuration as the Landing Proxy, thus chaining the subscription. Recently, the v2rayNG app has also added this feature from version 1.9.1. You need to copy the configuration name, go to your Subscription group setting, and paste the name in the `Next proxy remarks` field.

> [!IMPORTANT]
> 1- If you use a VLESS TLS configuration for Chain, its port must be 443; otherwise, the panel won't allow it.
>
> 2- VLESS configurations with randomized alpn don't work on Clash because it doesn't support it.
>
> 3- VLESS WS configuration is not suitable for chaining on Sing-box; it has a bug.
<br><br>

### 1-4- Clean IP Settings

Normal subscription links (without fragmentation) give you 6 configurations. Here, you can increase the number of configurations. There's also a scanner that you can download the zip file based on your operating system. After extracting, run the CloudflareScanner file. After the test is completed, it saves the output in the result.csv file, which you can choose based on Delay and Download speed. I recommend doing this on Windows, and make sure your VPN is off during the test. Normally, it gives good IPs, but for advanced scanning, read the guide [here](https://github.com/bia-pain-bache/Cloudflare-Clean-IP-Scanner/blob/master/README.md).

> [!TIP]
> On operators that support IPv6 (like Rightel, Irancell, and Asiatech), first activate IPv6 on your SIM card, then enable the Prefer IPv6 option in the V2RayNG settings. Among these 6 configurations, use the last two or the one whose address is your own domain. In general, always do a Real delay all configuration once and connect with whichever is better.

The 6 default configurations that the panel provides are all clean IPs. Also, if you use Fragment configurations, clean IPs are not very important. However, some operators like MCI still require clean IPs on regular configurations.

Now, if you want to add more configurations with your own clean IPs in addition to those 6, enter your clean IPs or domains separated by commas, as shown in the picture, and click Apply:

<p align="center">
  <img src="assets/images/Clean_ip_domain.jpg">
</p>

Now, if you click Update subscription in the app, you'll see that new configurations have been added.

Also, these new configurations are simultaneously added to the fragment section.

<br>

> [!CAUTION]
> Be sure to update the subscription after applying.
<br><br>

### 1-5- Enabling IPv6

The panel provides IPv6 configurations by default. But if your operator doesn't support it, you can disable it to declutter the configurations and optimize DNS settings.
<br><br>

### 1-6- Custom CDN Settings

We have 3 fields called Custom CDN. These are used when you put your Worker domain behind another CDN, such as Fastly, Gcore, or any other CDN. These 3 sections are:

1- The `Custom Addr` section, which essentially acts as the IPs or clean IPs of Cloudflare. But for each CDN you use here, you need to put its own IPs. You can't put Cloudflare IPs for Fastly or Gcore. Like the clean IPs we had, you can put domain, IPv4, or IPv6 separated by commas. Note that IPv6 should be enclosed in brackets like this:
> speedtest.net , [2a04:4e42:200::731] , 151.101.66.219

2- In the `Custom Host` section, you should put the host that you defined in that CDN and points to your own worker. For example, in Fastly, you can define a fake domain address.

3- In the `Custom SNI` section, you can put either that fake domain or a site that is on the same CDN. For example, the site speedtest.net (without www) is on the Fastly CDN.

Now, after configuring this section, its configurations will be added to the Normal subscriptions, all Sing-box, Clash, v2ray, etc. subscriptions. The names of these configurations have a `C` in them so they don't get mixed up with others.

> [!IMPORTANT]
> Currently, only configurations with ports 443 and 80 connect with this method.

> [!TIP]
> These configurations are added to the Normal and Full Normal subscriptions. But if you use the Normal subscription, you need to manually enable Allow Insecure from the configuration settings. Full Normal applies it automatically.
<br><br>

### 1-7- Best Ping Check Time

In all Fragment, Sing-box, and Clash subscriptions, we have Best Ping. By default, it would find the best configuration or Fragment value every 30 seconds and connect to it. However, if the internet speed is not good and you're watching a video or playing a game, this 30 seconds might be troublesome and cause lag. Here, you can adjust the time, which can be a minimum of 10 seconds and a maximum of 90 seconds.
<br><br>

### 1-8- Protocol Selection

You can enable one or both VLESS and Trojan protocols.
> [!CAUTION]
> These two protocols don't support UDP well on Cloudflare. Therefore, for example, Telegram voice calls won't work. Also, you can't use UDP DNS as remote DNS. If you see a remote DNS in an app like 1.1.1.1 or something like udp://1.1.1.1, you'll run into problems. Be sure to use the following formats:
>
> `https://IP/dns-query` like `https://8.8.8.8/dns-query` , `https://94.140.14.14/dns-query` ....
>
> `https://doh/dns-query` like `https://dns.google/dns-query` , `https://cloudflare-dns.com/dns-query` ....
>
> `tcp://IP` like `tcp://8.8.8.8` , `tcp://94.140.14.14` ....
>
> `tls://IP` like `tls://dns.google` , `tls://cloudflare-dns.com` ....
<br>

### 1-9- Port Selection

From this section, you can select the ports you need. Some of them give you TLS configurations, which are more secure, but when there are disruptions on TLS and Fragment, these configurations connect.
> [!CAUTION]
> Note that to use non-TLS configurations, you must have deployed using the Workers method. Otherwise, http ports won't be displayed in the panel because they don't work with the Pages method.

> [!TIP]
> Non-TLS configurations are only added to the normal subscription.
<br><br>

## 2- Fragment Settings

<p align="center">
  <img src="assets/images/Fragment-Settings.jpg">
</p>

By default:

>`Length: 100-200`
>
>`Interval: 1-1`
>
>`Packets: tlshello`

Now you can adjust the parameters and click Apply. This way, fragment configurations will be provided with your settings.

> [!NOTE]
> You can change one parameter or all of them together. Any changes you make will be saved, and you don't need to set them again next time.

> [!IMPORTANT]
> Fragment values have maximums. Length cannot be more than 500, and Interval cannot be more than 30.
<br><br>

## 3- WARP GENERAL Settings

<p align="center">
  <img src="assets/images/Warp-Settings.jpg">
</p>

This is common between both Warp and Warp Pro subscriptions and applies to both. It has two main sections:

1. We have Endpoints, which act as clean IPs for VLESS in Warp. They apply to both Warp and WoW configurations. I've also included a scanner script that you can run on Termux for Android or Linux and put in the panel. However, it's not 100% accurate, and you'll need to test it.

> [!CAUTION]
> Note that Endpoints should be entered in the format IP:Port or Domain:port, separated by commas.
>
> To enter IPv6, you need to enclose it in brackets. Pay attention to the example below:
>
> 123.45.8.6:1701 , engage.cloudflareclient:2408 , [2a06:98c1:3120::3]:939

2. You can enable Fake DNS for Warp configurations separately. It helps with DNS speed, but be aware that it might not be compatible with some applications or might affect the system's DNS. So, if you don't know exactly what it is, it's better not to enable it.

3. If your operator doesn't support IPv6, you can disable it for optimal DNS and proxy performance.

4. In the Warp+ License section, you can apply a Warp Plus license and upgrade your configurations to Plus, which have better speeds. After entering it, you first need to click Apply to save it, then click Update from the Warp settings. Get a Warp Plus license from [here](https://ircfspace.github.io/warpplus/), this [Telegram bot](https://t.me/generatewarpplusbot), or this [Telegram channel](https://t.me/warpplus). But be aware that each license can only be used for 5 Warp configurations, and each time you use it in the panel, it consumes 2 uses. In other words, if your license is unused and you put it in the panel, you can click Update twice, and your configurations will be converted to Plus. After that, it will give an error saying Too many connected devices.


> [!CAUTION]
> If you get a license from the Telegram channel or the first site belonging to IRCF, since they are public, it might say Too many connected devices right away. But the Telegram bot gives new ones, but there are some steps to use the bot.

> [!TIP]
> If you don't have a Warp+ license and click Update, it will update the same new regular configurations. But if you have one, it will convert them to Warp Plus configurations.

> [!TIP]
> After applying the license, updating the Warp configurations, updating the Warp subscription, and connecting, you can check if it's really Plus by opening [this link](https://cloudflare.com/cdn-cgi/trace). At the end, it should say warp=plus.

5. The Warp Configs section is such that if you click Update, it will get new Warp configurations from Cloudflare and save them. If you update the subscriptions, you'll see that they've changed. But this section has nothing to do with connection speed.

6. Best Ping Check Time. In Warp and Warp PRO subscriptions, we have Best Ping. By default, it would find the best configuration or Endpoint every 30 seconds and connect to it. However, if the internet speed is not good and you're watching a video or playing a game, this 30 seconds might be troublesome and cause lag. Here, you can adjust the time, which can be a minimum of 10 seconds and a maximum of 90 seconds.
    <br><br>

## 4- WARP PRO Settings

<p align="center">
  <img src="assets/images/Warp-Pro-Settings.jpg">
</p>

This is only for the WARP PRO subscription, which I explained earlier. It has several sections:

1. The first is Hiddify Noise Mode, which determines the mode in which noises (fake packets) are generated. The Singbox core of the Hiddify team supports these modes:

    -   Modes m1 to m6
    -   Mode h_HEX, where HEX can be between 00 and FF, e.g., h_0a, h_f9, h_9c, etc.
    -   Mode g_HEX_HEX_HEX, where HEX is like above, e.g., g_0a_ff_9c

2. The second is NikaNG Noise Mode, which has these modes:

    -   Mode none, meaning no noise is applied, essentially becoming the same as regular Warp configurations.
    -   Mode quic, which the development team recommends for Iran.
    -   Mode random, which generates noise randomly.
    -   And the last mode, where you can use a custom HEX string, e.g., fe09ad5600bc...

3. The Noise Count section is the number of these fake packets or noise that are sent. For example, the panel's default says to send between 10 and 15.

4. The next is Noise size, which, as the name suggests, is the length of these packets.

5. The last one is Noise Delay, which is the interval between sending these noises.


These settings will be determined over time for each operator through trial and error.
<br><br>

## 5- Routing Rules Settings

<p align="center">
  <img src="assets/images/Routing_rules.jpg">
</p>

This section is for configurations (except those provided by the Normal subscription) to:

1. Have direct LAN connections. For example, access to 127.0.0.1 or 192.168.1.1 becomes direct.

2. Connect directly to Iranian sites without VPN (no need to disconnect to visit some sites, especially payment gateways).

3. Have direct access to Chinese sites.

4. Have direct access to Russian sites.

5. Block about 80% of Iranian and foreign ads.

6. Block porn sites.

7. Block QUIC connections (due to network instability).


Normally, this section is disabled because you first need to make sure your application's Geo asset is updated.

> [!CAUTION]
> If you enable it and the VPN doesn't connect, the only reason is that the Geo asset is not updated. From the v2rayNG app menu, go to the Geo asset files section and click the cloud or download icon to update them. If the update is unsuccessful, you won't be able to connect. If you've tried everything and it still doesn't update, download two files from the links below and instead of clicking update, click the add button and import these two files:
>
> [geoip.dat](https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat)
>
> [geosite.dat](https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat)

### 5-1- Custom Rules Settings

If you need settings that are not available in the above section, you can use this section. For example, suppose you've blocked porn, but a specific porn site is not in the list and is not blocked. You can use this section.

> [!TIP]
> You can use three different formats in this section:
>
> 1- Domain like `google.com`. Just be aware that if you enter google.com, all its subdomains will also be blocked or directed, like drive.google.com or mail.google.com.
>
> 2- You can put a single IPv4 or IPv6. Note that IPv6 should be entered like other parts of the panel as follows: `[2606:4700::6810:85e5]`
>
> 3- You can put an IP Range like `192.168.1.1/32` or `[2606:4700::6810:85e5]/128`

