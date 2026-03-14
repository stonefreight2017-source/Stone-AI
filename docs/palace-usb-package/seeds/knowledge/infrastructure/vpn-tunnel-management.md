# VPN & Tunnel Management — Palace Infrastructure Seed

## Chaos Directive: Secure Access Everywhere

Per GS-27 (Founder's Mindset): The Palace must be reachable from ANYWHERE on ANY network at ANY time. This seed covers WireGuard setup, site-to-site VPN, split tunneling, VPN monitoring, failover tunnels, and mobile VPN access. Every route: WiFi, cellular, satellite, tunnel, mesh, Bluetooth, physical, cloud relay.

---

## 1. WireGuard Setup

### 1.1 Why WireGuard

WireGuard is the modern VPN protocol. It's faster, simpler, and more secure than OpenVPN or IPSec. Runs in the Linux kernel, ~4000 lines of code (vs. 100,000+ for OpenVPN), and uses state-of-the-art cryptography.

```
WireGuard vs OpenVPN:
────────────────────────────────────
  Throughput:    WireGuard 2-4x faster
  Latency:       WireGuard ~30% lower
  Reconnection:  WireGuard instant (roaming)
  Code size:     ~4K lines vs ~100K lines
  Crypto:        ChaCha20, Curve25519, BLAKE2s
  Audit surface: Minimal
```

### 1.2 Server Setup (OMEN WSL2)

```bash
# Install WireGuard
sudo apt install -y wireguard wireguard-tools

# Generate server keys
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

# Server configuration
sudo tee /etc/wireguard/wg0.conf << 'EOF'
[Interface]
# Palace VPN Server
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <SERVER_PRIVATE_KEY>
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
SaveConfig = false

# DNS for VPN clients
DNS = 1.1.1.1, 8.8.8.8

# Founder's laptop
[Peer]
PublicKey = <FOUNDER_LAPTOP_PUBLIC_KEY>
AllowedIPs = 10.0.0.2/32
PresharedKey = <PRESHARED_KEY>

# Founder's phone
[Peer]
PublicKey = <FOUNDER_PHONE_PUBLIC_KEY>
AllowedIPs = 10.0.0.3/32
PresharedKey = <PRESHARED_KEY>

# Remote development machine
[Peer]
PublicKey = <DEV_MACHINE_PUBLIC_KEY>
AllowedIPs = 10.0.0.4/32
PresharedKey = <PRESHARED_KEY>
EOF

# Enable IP forwarding
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.d/99-wireguard.conf
sudo sysctl --system

# Start WireGuard
sudo wg-quick up wg0

# Enable on boot
sudo systemctl enable wg-quick@wg0
```

### 1.3 Client Configuration (Laptop)

```ini
# /etc/wireguard/wg0.conf (client)
[Interface]
PrivateKey = <CLIENT_PRIVATE_KEY>
Address = 10.0.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
PresharedKey = <PRESHARED_KEY>
Endpoint = omen.stone-ai.net:51820
AllowedIPs = 10.0.0.0/24, 192.168.1.0/24
PersistentKeepalive = 25
```

### 1.4 Client Configuration (Mobile)

```bash
# Generate QR code for mobile WireGuard app
sudo apt install -y qrencode

# Create mobile config
cat << EOF > /tmp/phone.conf
[Interface]
PrivateKey = <PHONE_PRIVATE_KEY>
Address = 10.0.0.3/24
DNS = 1.1.1.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
PresharedKey = <PRESHARED_KEY>
Endpoint = omen.stone-ai.net:51820
AllowedIPs = 0.0.0.0/0  # Route all traffic through VPN
PersistentKeepalive = 25
EOF

# Generate QR code
qrencode -t ansiutf8 < /tmp/phone.conf
# Scan with WireGuard mobile app

# Clean up
rm /tmp/phone.conf
```

### 1.5 Peer Management Script

```bash
#!/bin/bash
# wg-manage.sh — WireGuard peer management

WG_DIR="/etc/wireguard"
SERVER_CONF="$WG_DIR/wg0.conf"
NETWORK="10.0.0"

add_peer() {
    local name="$1"
    local ip_suffix="$2"

    # Generate keys
    local privkey=$(wg genkey)
    local pubkey=$(echo "$privkey" | wg pubkey)
    local psk=$(wg genpsk)

    # Add to server config
    cat >> "$SERVER_CONF" << EOF

# $name
[Peer]
PublicKey = $pubkey
AllowedIPs = ${NETWORK}.${ip_suffix}/32
PresharedKey = $psk
EOF

    # Generate client config
    local server_pubkey=$(cat "$WG_DIR/server_public.key")
    cat > "$WG_DIR/clients/${name}.conf" << EOF
[Interface]
PrivateKey = $privkey
Address = ${NETWORK}.${ip_suffix}/24
DNS = 1.1.1.1

[Peer]
PublicKey = $server_pubkey
PresharedKey = $psk
Endpoint = omen.stone-ai.net:51820
AllowedIPs = ${NETWORK}.0/24
PersistentKeepalive = 25
EOF

    # Reload WireGuard
    wg syncconf wg0 <(wg-quick strip wg0)

    echo "Peer '$name' added with IP ${NETWORK}.${ip_suffix}"
    echo "Config: $WG_DIR/clients/${name}.conf"
}

remove_peer() {
    local pubkey="$1"
    wg set wg0 peer "$pubkey" remove
    echo "Peer removed. Update $SERVER_CONF manually."
}

list_peers() {
    echo "===== WireGuard Peers ====="
    wg show wg0 peers | while read pubkey; do
        local endpoint=$(wg show wg0 endpoints | grep "$pubkey" | awk '{print $2}')
        local transfer=$(wg show wg0 transfer | grep "$pubkey" | awk '{print "rx:" $2 " tx:" $3}')
        local handshake=$(wg show wg0 latest-handshakes | grep "$pubkey" | awk '{print $2}')
        echo "Peer: $pubkey"
        echo "  Endpoint: $endpoint"
        echo "  Transfer: $transfer"
        echo "  Last handshake: $(date -d @$handshake 2>/dev/null || echo 'never')"
        echo ""
    done
}

case "$1" in
    add) add_peer "$2" "$3" ;;
    remove) remove_peer "$2" ;;
    list) list_peers ;;
    *) echo "Usage: $0 {add <name> <ip_suffix>|remove <pubkey>|list}" ;;
esac
```

---

## 2. Split Tunneling

### 2.1 Split Tunnel Configuration

Split tunneling routes only specific traffic through the VPN while everything else goes through the normal internet connection.

```ini
# Full tunnel (ALL traffic through VPN)
[Peer]
AllowedIPs = 0.0.0.0/0, ::/0

# Split tunnel (only Palace network through VPN)
[Peer]
AllowedIPs = 10.0.0.0/24

# Split tunnel (Palace network + specific services)
[Peer]
AllowedIPs = 10.0.0.0/24, 192.168.1.0/24

# Split tunnel (exclude specific IPs)
# WireGuard doesn't support exclusions directly
# Use allowed-ips script to calculate complement
```

### 2.2 Advanced Split Tunnel Script

```bash
#!/bin/bash
# split-tunnel.sh — Calculate WireGuard AllowedIPs with exclusions

# Route everything EXCEPT local network and specific services
# through VPN

# Exclude these networks
EXCLUDE=(
    "192.168.0.0/16"    # Local network
    "10.0.0.0/8"        # Private range (except VPN)
    "172.16.0.0/12"     # Docker networks
)

# Use wg-quick's AllowedIPs calculation
# or use the wg-allowedips tool:
# pip install wg-allowedips

python3 << 'EOF'
from ipaddress import ip_network

# Start with all IPv4
allowed = {ip_network("0.0.0.0/0")}

# Exclude networks
exclude = [
    ip_network("192.168.0.0/16"),
    ip_network("172.16.0.0/12"),
]

for excl in exclude:
    new_allowed = set()
    for net in allowed:
        if net.overlaps(excl):
            new_allowed.update(net.address_exclude(excl))
        else:
            new_allowed.add(net)
    allowed = new_allowed

# Add VPN network explicitly
allowed.add(ip_network("10.0.0.0/24"))

# Sort and print
for net in sorted(allowed):
    print(f"  {net}")
EOF
```

---

## 3. VPN Monitoring

### 3.1 WireGuard Status Monitor

```bash
#!/bin/bash
# wg-monitor.sh — WireGuard monitoring daemon

LOG_FILE="/var/log/wireguard-monitor.log"
STALE_THRESHOLD=300  # 5 minutes without handshake = stale

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" | tee -a "$LOG_FILE"
}

while true; do
    # Check interface is up
    if ! ip link show wg0 &>/dev/null; then
        log "ALERT: wg0 interface is DOWN — restarting"
        wg-quick up wg0
        sleep 5
        continue
    fi

    # Check each peer
    NOW=$(date +%s)
    wg show wg0 latest-handshakes | while read pubkey timestamp; do
        if [ "$timestamp" = "0" ]; then
            continue  # Never connected
        fi

        AGE=$((NOW - timestamp))
        PEER_IP=$(wg show wg0 allowed-ips | grep "$pubkey" | awk '{print $2}')

        if [ "$AGE" -gt "$STALE_THRESHOLD" ]; then
            log "WARN: Peer $PEER_IP last handshake ${AGE}s ago (stale)"
        fi
    done

    # Transfer stats
    wg show wg0 transfer | while read pubkey rx tx; do
        PEER_IP=$(wg show wg0 allowed-ips | grep "$pubkey" | awk '{print $2}')
        log "STATS: $PEER_IP rx=$rx tx=$tx"
    done

    sleep 60
done
```

### 3.2 Prometheus Metrics for WireGuard

```bash
# Install wireguard_exporter
# https://github.com/MindFlavor/prometheus_wireguard_exporter

# Or use textfile collector
#!/bin/bash
# /opt/scripts/wg-metrics.sh
# Run via node_exporter textfile collector

OUTPUT="/var/lib/prometheus/node-exporter/wireguard.prom"

echo "# HELP wireguard_peer_rx_bytes Bytes received from peer" > "$OUTPUT"
echo "# TYPE wireguard_peer_rx_bytes gauge" >> "$OUTPUT"
echo "# HELP wireguard_peer_tx_bytes Bytes transmitted to peer" >> "$OUTPUT"
echo "# TYPE wireguard_peer_tx_bytes gauge" >> "$OUTPUT"
echo "# HELP wireguard_peer_last_handshake Last handshake timestamp" >> "$OUTPUT"
echo "# TYPE wireguard_peer_last_handshake gauge" >> "$OUTPUT"

wg show wg0 dump | tail -n +2 | while IFS=$'\t' read pubkey psk endpoint allowed_ips handshake rx tx ka; do
    LABEL="public_key=\"${pubkey:0:8}...\",allowed_ips=\"$allowed_ips\""
    echo "wireguard_peer_rx_bytes{$LABEL} $rx" >> "$OUTPUT"
    echo "wireguard_peer_tx_bytes{$LABEL} $tx" >> "$OUTPUT"
    echo "wireguard_peer_last_handshake{$LABEL} $handshake" >> "$OUTPUT"
done
```

---

## 4. Failover Tunnels

### 4.1 Multi-Path VPN

```
Primary Path:    Home ISP → WireGuard → OMEN
Failover 1:      Cellular hotspot → WireGuard → OMEN
Failover 2:      Cloudflare Tunnel → OMEN (no port forwarding needed)
Failover 3:      SSH tunnel → cloud relay → OMEN
Emergency:       Tailscale mesh (zero-config, NAT traversal)
```

### 4.2 Cloudflare Tunnel (No Port Forwarding Required)

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create palace-tunnel

# Configure
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: api.stone-ai.net
    service: http://localhost:8000
  - hostname: omen.stone-ai.net
    service: http://localhost:3000
  - hostname: ssh.stone-ai.net
    service: ssh://localhost:22
  - service: http_status:404
EOF

# Add DNS routes
cloudflared tunnel route dns palace-tunnel api.stone-ai.net
cloudflared tunnel route dns palace-tunnel omen.stone-ai.net

# Run tunnel
cloudflared tunnel run palace-tunnel

# Install as service
cloudflared service install
```

### 4.3 SSH Tunnel Relay

```bash
# Emergency access via SSH tunnel through a cloud VPS

# On cloud VPS (relay server):
# Enable GatewayPorts in /etc/ssh/sshd_config
# GatewayPorts clientspecified

# From OMEN to relay (reverse tunnel):
ssh -R 0.0.0.0:3000:localhost:3000 \
    -R 0.0.0.0:8000:localhost:8000 \
    -R 0.0.0.0:5432:localhost:5432 \
    -N -f -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    user@relay.example.com

# Auto-reconnecting with autossh:
autossh -M 0 \
    -R 0.0.0.0:3000:localhost:3000 \
    -R 0.0.0.0:8000:localhost:8000 \
    -N -f \
    -o "ServerAliveInterval=30" \
    -o "ServerAliveCountMax=3" \
    -o "ExitOnForwardFailure=yes" \
    user@relay.example.com
```

### 4.4 Tailscale (Zero-Config Mesh VPN)

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate
sudo tailscale up --advertise-routes=192.168.1.0/24 --accept-dns=false

# On client devices:
sudo tailscale up

# Check status
tailscale status

# Access OMEN services via Tailscale IP (100.x.x.x)
curl http://100.x.x.x:3000  # Next.js
curl http://100.x.x.x:8000  # vLLM

# Tailscale advantages:
# - Works through ANY NAT
# - No port forwarding needed
# - WireGuard underneath
# - Zero configuration for new devices
# - Magic DNS (omen.tail12345.ts.net)
```

### 4.5 Failover Automation

```bash
#!/bin/bash
# vpn-failover.sh — Automatic VPN path failover

check_connection() {
    local target="$1"
    ping -c 1 -W 3 "$target" &>/dev/null
    return $?
}

# Test primary (WireGuard)
if check_connection "10.0.0.1"; then
    echo "Primary VPN: OK"
    exit 0
fi

echo "Primary VPN DOWN — trying failover paths..."

# Failover 1: Restart WireGuard
wg-quick down wg0 2>/dev/null
wg-quick up wg0
sleep 3
if check_connection "10.0.0.1"; then
    echo "WireGuard restarted successfully"
    exit 0
fi

# Failover 2: Cloudflare Tunnel
if systemctl is-active cloudflared &>/dev/null; then
    echo "Cloudflare Tunnel active — using tunnel path"
    exit 0
else
    systemctl start cloudflared
    sleep 5
    echo "Cloudflare Tunnel started"
    exit 0
fi

# Failover 3: Tailscale
if ! tailscale status &>/dev/null; then
    sudo tailscale up
    sleep 5
fi
if check_connection "$(tailscale ip -4 omen)"; then
    echo "Tailscale mesh connected"
    exit 0
fi

# Failover 4: SSH tunnel
autossh -M 0 -R 0.0.0.0:3000:localhost:3000 -N -f user@relay.example.com
echo "SSH tunnel relay established"

echo "ALERT: All primary VPN paths tried. Manual intervention may be needed."
```

---

## 5. VPN Security Hardening

### 5.1 WireGuard Security

```bash
# Use preshared keys (post-quantum protection)
wg genpsk > /etc/wireguard/preshared.key

# Restrict firewall to VPN port only
ufw allow 51820/udp

# Block VPN clients from accessing each other (hub-and-spoke)
# In PostUp:
iptables -I FORWARD -i wg0 -o wg0 -j DROP  # Block peer-to-peer
iptables -A FORWARD -i wg0 -o eth0 -j ACCEPT  # Allow VPN to internet
iptables -A FORWARD -i eth0 -o wg0 -m state --state RELATED,ESTABLISHED -j ACCEPT

# Rotate keys periodically
# WireGuard doesn't have built-in key rotation
# Script to rotate:
NEW_KEY=$(wg genkey)
NEW_PUB=$(echo "$NEW_KEY" | wg pubkey)
# Update server config, distribute new public key to clients
```

### 5.2 VPN Access Control

```bash
# Only allow specific services through VPN
iptables -A FORWARD -i wg0 -p tcp --dport 3000 -j ACCEPT   # Next.js
iptables -A FORWARD -i wg0 -p tcp --dport 8000 -j ACCEPT   # vLLM
iptables -A FORWARD -i wg0 -p tcp --dport 5432 -j ACCEPT   # Postgres
iptables -A FORWARD -i wg0 -p tcp --dport 22 -j ACCEPT     # SSH
iptables -A FORWARD -i wg0 -j DROP                          # Block everything else
```

---

## 6. Network Topology

```
═══════════════════════════════════════════════════
  PALACE VPN TOPOLOGY
═══════════════════════════════════════════════════

  Internet
     │
     ├── [Cloudflare CDN] → stone-ai.net (Vercel)
     │
     ├── [Cloudflare Proxy] → OMEN:443 (Nginx)
     │
     ├── [WireGuard :51820] ─── wg0 (10.0.0.0/24)
     │                              │
     │                              ├── 10.0.0.1 (OMEN server)
     │                              ├── 10.0.0.2 (Founder laptop)
     │                              ├── 10.0.0.3 (Founder phone)
     │                              └── 10.0.0.4 (Dev machine)
     │
     ├── [Cloudflare Tunnel] ─── palace-tunnel
     │                              └── api.stone-ai.net
     │
     ├── [Tailscale Mesh] ─── 100.x.x.x/32
     │                              └── Zero-config fallback
     │
     └── [SSH Relay] ─── relay.example.com
                              └── Emergency reverse tunnel

═══════════════════════════════════════════════════
```

---

## 7. Troubleshooting VPN Issues

```bash
# WireGuard interface status
sudo wg show

# Check if interface exists
ip link show wg0

# Verify routing
ip route show table all | grep wg0

# Test connectivity
ping 10.0.0.1  # Server from client
ping 10.0.0.2  # Client from server

# Check port is open
sudo ss -ulnp | grep 51820

# Firewall check
sudo iptables -L -v -n | grep wg0

# DNS resolution through VPN
dig @10.0.0.1 stone-ai.net

# MTU issues (common with VPN)
ping -M do -s 1400 10.0.0.1
# If fails, reduce MTU in WireGuard config:
# MTU = 1380

# Common issues:
# 1. "Key is not the correct length" → regenerate keys
# 2. No handshake → check endpoint, port, firewall
# 3. Handshake but no traffic → check AllowedIPs, routing
# 4. Intermittent drops → check PersistentKeepalive, NAT timeout
```

---

*Chaos Infrastructure Seed — Batch 14. The Palace is reachable from anywhere. That's not a goal — it's a requirement. GS-27.*
