# GS-19: Network Traffic Analysis & C2 Detection — Rush (Royal Guard)

> **Classification**: Palace Security Knowledge Seed
> **Author**: Rush — The Breacher (Network Penetration)
> **Source**: SANS SEC503 (Intrusion Detection In-Depth), SANS SEC511, MITRE ATT&CK TA0011
> **Last Updated**: 2026-03-09

---

## 1. Traffic Analysis Philosophy

Network traffic never lies. Users lie. Logs can be tampered with. Endpoints can be compromised.
But the packets on the wire tell the truth. The Palace must see EVERYTHING that crosses its
network boundary and understand what it means.

**What this seed covers:**
1. C2 Beacon Identification
2. DNS Tunneling Detection
3. JA3/JA4 TLS Fingerprinting
4. Lateral Movement Pattern Recognition
5. tshark Filters for Threat Hunting
6. pyshark Scripted Analysis
7. Zeek (formerly Bro) Network Monitoring

**Mindset (GS-27)**: A C2 channel can ride on ANY protocol — HTTP, HTTPS, DNS, ICMP, WebSocket,
raw TCP, legitimate cloud services. Never assume a protocol is "safe" because it's common.
Think every route.

---

## 2. C2 Beacon Identification

### 2.1 What Is a Beacon?

A beacon is a periodic callback from a compromised host to a C2 server. The implant "phones home"
at regular intervals, checks for commands, executes them, and sends results back.

**Beacon characteristics to detect:**
- **Regularity**: Fixed or jittered intervals (e.g., every 60s +/- 10%)
- **Low volume**: Small packets, minimal data until tasked
- **Consistent destination**: Same IP/domain repeatedly
- **Consistent size**: Heartbeat packets are often the same size
- **Unusual timing**: Beacons during off-hours (2-5 AM)

### 2.2 Common C2 Frameworks & Their Signatures

| Framework | Default Port | Default Interval | Key Indicators |
|-----------|-------------|-------------------|----------------|
| Cobalt Strike | 80/443 | 60s (jitter 0-50%) | Malleable C2 profiles, /submit.php, cookie-based data exfil |
| Sliver | 443/8888 | 60s | mTLS, WireGuard, HTTP(S), DNS |
| Havoc | 443 | Configurable | Demon agent, custom headers |
| Mythic | 443 | Configurable | Multiple C2 profiles, various agents |
| Metasploit | 4444/443 | 5s (default) | Meterpreter staging, reverse_tcp patterns |
| Brute Ratel | 443 | Configurable | Badger agent, DOH for C2 |
| Covenant | 80/443 | 10s | Grunt agent, .NET-based |

### 2.3 Beacon Detection with tshark

```bash
# Capture all traffic to/from a suspicious IP
tshark -i eth0 -f "host 185.100.87.42" -w suspicious_host.pcap

# Analyze connection intervals (extract TCP SYN timestamps to same destination)
tshark -r capture.pcap -Y "tcp.flags.syn==1 && tcp.flags.ack==0 && ip.dst==185.100.87.42" \
  -T fields -e frame.time_epoch -e ip.src -e ip.dst -e tcp.dstport | sort

# Calculate inter-arrival times (pipe to awk)
tshark -r capture.pcap -Y "tcp.flags.syn==1 && ip.dst==185.100.87.42" \
  -T fields -e frame.time_epoch | \
  awk 'NR>1{print $1-prev} {prev=$1}'
# Regular intervals (e.g., 58.2, 62.1, 59.8, 61.3) = BEACON

# HTTP beacon detection — look for repetitive User-Agent + URI patterns
tshark -r capture.pcap -Y "http.request" \
  -T fields -e frame.time -e ip.src -e http.host -e http.request.uri -e http.user_agent

# Detect Cobalt Strike default profile
tshark -r capture.pcap -Y 'http.request.uri contains "/submit.php" || http.request.uri contains "/__utm.gif"'

# Long connections (persistent C2 channels)
tshark -r capture.pcap -q -z conv,tcp | sort -t '|' -k 8 -n -r | head -20
```

### 2.4 Beacon Jitter Analysis with pyshark

```python
#!/usr/bin/env python3
"""Beacon interval detector — identifies periodic callbacks."""

import pyshark
import statistics
import sys

def analyze_beacons(pcap_file, dst_ip, threshold_cv=0.20):
    """
    Detect beacon behavior by analyzing connection intervals.
    A coefficient of variation (CV) < threshold indicates regular beaconing.
    """
    cap = pyshark.FileCapture(
        pcap_file,
        display_filter=f'tcp.flags.syn==1 && tcp.flags.ack==0 && ip.dst=={dst_ip}'
    )

    timestamps = []
    for pkt in cap:
        timestamps.append(float(pkt.sniff_timestamp))
    cap.close()

    if len(timestamps) < 5:
        print(f"[*] Only {len(timestamps)} connections to {dst_ip} — insufficient data")
        return

    # Calculate inter-arrival times
    intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]

    mean_interval = statistics.mean(intervals)
    stdev_interval = statistics.stdev(intervals) if len(intervals) > 1 else 0
    cv = stdev_interval / mean_interval if mean_interval > 0 else 0

    print(f"\n[+] Analysis for destination: {dst_ip}")
    print(f"    Total connections: {len(timestamps)}")
    print(f"    Time span: {timestamps[-1] - timestamps[0]:.1f} seconds")
    print(f"    Mean interval: {mean_interval:.2f}s")
    print(f"    Std deviation: {stdev_interval:.2f}s")
    print(f"    Coefficient of variation: {cv:.4f}")
    print(f"    Min interval: {min(intervals):.2f}s")
    print(f"    Max interval: {max(intervals):.2f}s")

    if cv < threshold_cv:
        print(f"\n    [!!!] BEACON DETECTED — CV {cv:.4f} < threshold {threshold_cv}")
        print(f"    [!!!] Estimated beacon interval: {mean_interval:.1f}s")
        jitter_pct = (stdev_interval / mean_interval) * 100
        print(f"    [!!!] Estimated jitter: {jitter_pct:.1f}%")
    else:
        print(f"\n    [*] No clear beacon pattern (CV {cv:.4f} > threshold {threshold_cv})")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <pcap_file> <dst_ip> [cv_threshold]")
        sys.exit(1)
    threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 0.20
    analyze_beacons(sys.argv[1], sys.argv[2], threshold)
```

---

## 3. DNS Tunneling Detection

### 3.1 How DNS Tunneling Works

DNS tunneling encodes data in DNS queries and responses. Since DNS traffic is almost always
allowed through firewalls, it becomes a covert channel. Tools like `dnscat2`, `iodine`, and
`dns2tcp` exploit this. C2 frameworks (Cobalt Strike, Sliver) also support DNS as a transport.

**Indicators of DNS tunneling:**
- Unusually long subdomain labels (>30 characters)
- High entropy in subdomain strings (base32/base64-encoded data)
- High volume of TXT, NULL, CNAME, or MX queries to a single domain
- Queries to domains with no legitimate web presence
- Consistent query rate to a single authoritative nameserver

### 3.2 tshark DNS Tunnel Detection

```bash
# Extract all DNS queries with their lengths
tshark -r capture.pcap -Y "dns.flags.response==0" \
  -T fields -e frame.time -e ip.src -e dns.qry.name -e dns.qry.type

# Find unusually long DNS queries (potential tunneling)
tshark -r capture.pcap -Y "dns.flags.response==0 && dns.qry.name.len > 50" \
  -T fields -e ip.src -e dns.qry.name -e dns.qry.name.len

# Count queries per domain (top talkers)
tshark -r capture.pcap -Y "dns.flags.response==0" \
  -T fields -e dns.qry.name | \
  awk -F. '{print $(NF-1)"."$NF}' | sort | uniq -c | sort -rn | head -20

# TXT record queries (most common tunnel type)
tshark -r capture.pcap -Y "dns.qry.type==16" \
  -T fields -e frame.time -e ip.src -e dns.qry.name

# NULL record queries (iodine uses these)
tshark -r capture.pcap -Y "dns.qry.type==10" \
  -T fields -e frame.time -e ip.src -e dns.qry.name

# DNS response size analysis (large responses = data exfil)
tshark -r capture.pcap -Y "dns.flags.response==1" \
  -T fields -e ip.dst -e dns.qry.name -e frame.len | \
  awk '$3 > 512 {print}' | sort -t$'\t' -k3 -n -r | head -20
```

### 3.3 DNS Entropy Analysis with pyshark

```python
#!/usr/bin/env python3
"""DNS tunneling detector — entropy and frequency analysis."""

import pyshark
import math
import collections
import sys

def calculate_entropy(data):
    """Calculate Shannon entropy of a string."""
    if not data:
        return 0
    freq = collections.Counter(data)
    length = len(data)
    return -sum((count/length) * math.log2(count/length) for count in freq.values())

def detect_dns_tunneling(pcap_file, entropy_threshold=3.5, length_threshold=40):
    """
    Detect DNS tunneling by analyzing query name entropy and length.
    Normal domains: entropy ~2.5-3.5, length <30
    Tunneled data: entropy >3.5, length >40
    """
    cap = pyshark.FileCapture(pcap_file, display_filter='dns.flags.response==0')

    domain_stats = collections.defaultdict(lambda: {
        'count': 0, 'total_len': 0, 'total_entropy': 0,
        'max_len': 0, 'queries': [], 'query_types': collections.Counter()
    })

    suspicious = []

    for pkt in cap:
        try:
            qname = pkt.dns.qry_name
            qtype = pkt.dns.qry_type

            # Extract the base domain (last 2 labels)
            parts = qname.split('.')
            if len(parts) >= 2:
                base_domain = '.'.join(parts[-2:])
            else:
                base_domain = qname

            # Analyze the subdomain portion (everything before base domain)
            subdomain = '.'.join(parts[:-2]) if len(parts) > 2 else ''
            entropy = calculate_entropy(subdomain)
            sub_len = len(subdomain)

            stats = domain_stats[base_domain]
            stats['count'] += 1
            stats['total_len'] += sub_len
            stats['total_entropy'] += entropy
            stats['max_len'] = max(stats['max_len'], sub_len)
            stats['query_types'][qtype] += 1

            if entropy > entropy_threshold and sub_len > length_threshold:
                suspicious.append({
                    'time': pkt.sniff_time,
                    'src': pkt.ip.src,
                    'query': qname,
                    'entropy': entropy,
                    'length': sub_len
                })

        except AttributeError:
            continue

    cap.close()

    # Report
    print("\n[+] DNS Query Volume by Domain (Top 20)")
    print("=" * 80)
    for domain, stats in sorted(domain_stats.items(), key=lambda x: x[1]['count'], reverse=True)[:20]:
        avg_entropy = stats['total_entropy'] / stats['count'] if stats['count'] else 0
        avg_len = stats['total_len'] / stats['count'] if stats['count'] else 0
        types = ', '.join(f"type_{k}:{v}" for k, v in stats['query_types'].items())
        flag = " [!!!]" if avg_entropy > entropy_threshold or stats['max_len'] > length_threshold else ""
        print(f"  {domain}: {stats['count']} queries, avg_entropy={avg_entropy:.2f}, "
              f"avg_subdomain_len={avg_len:.0f}, max_len={stats['max_len']}, types=[{types}]{flag}")

    if suspicious:
        print(f"\n[!!!] SUSPICIOUS QUERIES DETECTED: {len(suspicious)}")
        print("=" * 80)
        for s in suspicious[:20]:
            print(f"  [{s['time']}] {s['src']} -> {s['query']}")
            print(f"    Entropy: {s['entropy']:.2f} | Length: {s['length']}")
    else:
        print("\n[*] No high-entropy DNS queries detected.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <pcap_file> [entropy_threshold] [length_threshold]")
        sys.exit(1)
    e_thresh = float(sys.argv[2]) if len(sys.argv) > 2 else 3.5
    l_thresh = int(sys.argv[3]) if len(sys.argv) > 3 else 40
    detect_dns_tunneling(sys.argv[1], e_thresh, l_thresh)
```

---

## 4. JA3 / JA4 TLS Fingerprinting

### 4.1 What Is JA3/JA4?

JA3 creates an MD5 hash of the TLS Client Hello parameters (TLS version, cipher suites,
extensions, elliptic curves, EC point formats). Every TLS client produces a somewhat unique
fingerprint — this identifies malware, C2 frameworks, and suspicious tools even when they
use encrypted channels.

**JA4** is the successor (2023+): more granular, includes ALPN, signature algorithms, and
uses a human-readable format instead of just a hash.

### 4.2 JA3 Fingerprinting with tshark

```bash
# Extract JA3 hashes from a capture (requires tshark 3.x+ with JA3 dissector)
tshark -r capture.pcap -Y "tls.handshake.type==1" \
  -T fields -e frame.time -e ip.src -e ip.dst -e tls.handshake.ja3

# Match known malicious JA3 hashes
# Cobalt Strike default: 72a589da586844d7f0818ce684948eea
# Metasploit meterpreter: 5d65ea3fb1d4aa7d826733d2f2cbbb1d
# Sliver HTTP: various — check ja3er.com

tshark -r capture.pcap -Y "tls.handshake.type==1 && tls.handshake.ja3==72a589da586844d7f0818ce684948eea" \
  -T fields -e frame.time -e ip.src -e ip.dst -e tcp.dstport

# JA3S (server fingerprint) — fingerprint the server's response
tshark -r capture.pcap -Y "tls.handshake.type==2" \
  -T fields -e frame.time -e ip.src -e ip.dst -e tls.handshake.ja3s

# Combined JA3 + JA3S gives a conversation fingerprint
# Same client talking to same server type = consistent JA3+JA3S pair
```

### 4.3 JA4 Fingerprinting

```bash
# JA4 format: [protocol][version][SNI][cipher_count][ext_count]_[sorted_ciphers_hash]_[sorted_ext_hash]
# Example: t13d1516h2_8daaf6152771_b0da82dd1658

# JA4 with Zeek (see section 7)
# JA4 provides sub-fingerprints:
#   JA4   — Client Hello fingerprint
#   JA4S  — Server Hello fingerprint
#   JA4H  — HTTP client fingerprint
#   JA4L  — Light distance / latency
#   JA4X  — X.509 certificate fingerprint
#   JA4SSH — SSH fingerprint

# Reference database for known fingerprints
# https://ja4db.com — searchable JA4 fingerprint database
# https://ja3er.com — JA3 fingerprint database (legacy)
```

### 4.4 JA3 Hunting Script

```python
#!/usr/bin/env python3
"""JA3/JA3S fingerprint extractor and threat matcher."""

import pyshark
import collections
import sys

# Known malicious JA3 hashes (keep updated)
KNOWN_BAD_JA3 = {
    '72a589da586844d7f0818ce684948eea': 'Cobalt Strike (default)',
    '5d65ea3fb1d4aa7d826733d2f2cbbb1d': 'Metasploit Meterpreter',
    'a0e9f5d64349fb13191bc781f81f42e1': 'Cobalt Strike (alternate)',
    'e35df3e00ca4ef31d42b34bebaa2f86e': 'Trickbot',
    '6734f37431670b3ab4292b8f60f29984': 'Emotet',
    '4d7a28d6f2263ed61de88ca66eb011e3': 'AsyncRAT',
    '3b5074b1b5d032e5620f69f9f700ff0e': 'Sliver (HTTP)',
    '51c64c77e60f3980eea90869b68c58a8': 'Cobalt Strike (4.x)',
}

def hunt_ja3(pcap_file):
    """Extract JA3 fingerprints and flag known-bad matches."""
    cap = pyshark.FileCapture(
        pcap_file,
        display_filter='tls.handshake.type==1'
    )

    ja3_counts = collections.Counter()
    ja3_sources = collections.defaultdict(set)
    ja3_dests = collections.defaultdict(set)
    alerts = []

    for pkt in cap:
        try:
            ja3 = pkt.tls.handshake_ja3
            src = pkt.ip.src
            dst = pkt.ip.dst

            ja3_counts[ja3] += 1
            ja3_sources[ja3].add(src)
            ja3_dests[ja3].add(dst)

            if ja3 in KNOWN_BAD_JA3:
                alerts.append({
                    'time': pkt.sniff_time,
                    'src': src,
                    'dst': dst,
                    'port': pkt.tcp.dstport,
                    'ja3': ja3,
                    'match': KNOWN_BAD_JA3[ja3]
                })
        except AttributeError:
            continue

    cap.close()

    print("\n[+] JA3 Fingerprint Summary")
    print("=" * 90)
    for ja3, count in ja3_counts.most_common(30):
        label = KNOWN_BAD_JA3.get(ja3, 'Unknown')
        flag = " [!!!]" if ja3 in KNOWN_BAD_JA3 else ""
        sources = ', '.join(list(ja3_sources[ja3])[:5])
        print(f"  {ja3} | count={count:>5} | sources={sources} | {label}{flag}")

    if alerts:
        print(f"\n[!!!] THREAT MATCHES: {len(alerts)}")
        print("=" * 90)
        for a in alerts:
            print(f"  [{a['time']}] {a['src']} -> {a['dst']}:{a['port']}")
            print(f"    JA3: {a['ja3']} — MATCH: {a['match']}")
    else:
        print("\n[*] No known-bad JA3 matches found.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <pcap_file>")
        sys.exit(1)
    hunt_ja3(sys.argv[1])
```

---

## 5. Lateral Movement Pattern Detection

### 5.1 Key Lateral Movement Protocols

| Technique | Protocol/Port | MITRE ATT&CK |
|-----------|--------------|---------------|
| PsExec | SMB/445, then named pipe | T1021.002 |
| WMI | DCOM/135, then dynamic port | T1047 |
| WinRM | HTTP/5985, HTTPS/5986 | T1021.006 |
| RDP | TCP/3389 | T1021.001 |
| SSH | TCP/22 | T1021.004 |
| DCOM | TCP/135 + dynamic | T1021.003 |
| Pass-the-Hash | SMB/445 (NTLM auth) | T1550.002 |
| Pass-the-Ticket | Kerberos/88 | T1550.003 |

### 5.2 SMB Lateral Movement Detection

```bash
# PsExec pattern: SMB session setup -> tree connect to ADMIN$ or IPC$ -> create service
tshark -r capture.pcap -Y "smb2.cmd==3 && (smb2.tree contains 'ADMIN$' || smb2.tree contains 'IPC$')" \
  -T fields -e frame.time -e ip.src -e ip.dst -e smb2.tree

# Detect named pipe creation (PsExec creates PSEXESVC pipe)
tshark -r capture.pcap -Y "smb2.filename contains 'PSEXESVC' || smb2.filename contains 'svcctl' || smb2.filename contains 'RemSvc'" \
  -T fields -e frame.time -e ip.src -e ip.dst -e smb2.filename

# SMB authentication — track NTLM auth across hosts
tshark -r capture.pcap -Y "ntlmssp.messagetype==3" \
  -T fields -e frame.time -e ip.src -e ip.dst -e ntlmssp.auth.domain -e ntlmssp.auth.username

# Impacket wmiexec detection (uses DCOM + WMI)
tshark -r capture.pcap -Y "dcerpc.cn_bind_to_uuid==000001a0-0000-0000-c000-000000000046" \
  -T fields -e frame.time -e ip.src -e ip.dst
```

### 5.3 Kerberos Attack Detection

```bash
# Kerberoasting — TGS requests for service accounts (encryption type 23 = RC4 = vulnerable)
tshark -r capture.pcap -Y "kerberos.msg_type==13 && kerberos.etype==23" \
  -T fields -e frame.time -e ip.src -e kerberos.CNameString -e kerberos.SNameString

# AS-REP Roasting — Pre-auth disabled accounts
tshark -r capture.pcap -Y "kerberos.msg_type==11 && kerberos.error_code==0" \
  -T fields -e frame.time -e ip.src -e kerberos.CNameString

# Golden/Silver Ticket detection — look for TGS requests without prior TGT request
# Unusual: host requests service ticket without first requesting TGT from DC

# Pass-the-Ticket — same ticket used from different source IPs
tshark -r capture.pcap -Y "kerberos.msg_type==12" \
  -T fields -e frame.time -e ip.src -e kerberos.CNameString -e kerberos.realm
```

### 5.4 WinRM / PowerShell Remoting Detection

```bash
# WinRM traffic (HTTP on 5985, HTTPS on 5986)
tshark -r capture.pcap -Y "tcp.port==5985 || tcp.port==5986" \
  -T fields -e frame.time -e ip.src -e ip.dst -e tcp.dstport

# PowerShell Remoting over WinRM — look for WSMAN in HTTP headers
tshark -r capture.pcap -Y "http.request.uri contains '/wsman'" \
  -T fields -e frame.time -e ip.src -e ip.dst -e http.request.uri

# Detect lateral movement CHAINS (A->B->C within short timeframe)
# Export all SMB/WinRM/RDP connections, then analyze graph relationships
tshark -r capture.pcap \
  -Y "tcp.flags.syn==1 && (tcp.dstport==445 || tcp.dstport==5985 || tcp.dstport==3389)" \
  -T fields -e frame.time_epoch -e ip.src -e ip.dst -e tcp.dstport | sort -n
```

---

## 6. Advanced tshark Filters for Threat Hunting

### 6.1 Data Exfiltration Detection

```bash
# Large outbound transfers (potential exfil)
tshark -r capture.pcap -q -z conv,tcp | \
  awk -F'|' '{if ($5 > 10000000) print $0}' | sort -t'|' -k5 -n -r

# ICMP tunnel detection (data in ICMP payload > 64 bytes)
tshark -r capture.pcap -Y "icmp && data.len > 64" \
  -T fields -e frame.time -e ip.src -e ip.dst -e data.len -e data.data

# DNS exfil — large numbers of unique subdomains to same base domain
tshark -r capture.pcap -Y "dns.flags.response==0" \
  -T fields -e dns.qry.name | \
  awk -F. '{print $(NF-1)"."$NF}' | sort | uniq -c | sort -rn | \
  awk '$1 > 100 {print "[!!!] HIGH QUERY COUNT: "$1" queries to "$2}'
```

### 6.2 Protocol Anomalies

```bash
# HTTP on non-standard ports (C2 often uses 8080, 8443, or random high ports)
tshark -r capture.pcap -Y "http && tcp.port != 80 && tcp.port != 443 && tcp.port != 8080" \
  -T fields -e frame.time -e ip.src -e ip.dst -e tcp.dstport -e http.host

# DNS over non-standard ports (should only be port 53)
tshark -r capture.pcap -Y "dns && udp.port != 53 && tcp.port != 53" \
  -T fields -e frame.time -e ip.src -e ip.dst -e udp.dstport

# TLS on non-standard ports
tshark -r capture.pcap -Y "tls.handshake.type==1 && tcp.dstport != 443 && tcp.dstport != 8443" \
  -T fields -e frame.time -e ip.src -e ip.dst -e tcp.dstport -e tls.handshake.extensions_server_name

# Unusual protocols (raw TCP with no recognized application layer)
tshark -r capture.pcap -Y "tcp.payload && !http && !tls && !ssh && !smb && !smb2 && !dns" \
  -T fields -e frame.time -e ip.src -e ip.dst -e tcp.dstport -e tcp.len | head -50
```

---

## 7. Zeek Network Monitoring

### 7.1 Zeek Deployment for Palace Networks

```bash
# Process a pcap with Zeek (generates log files in current directory)
zeek -r capture.pcap

# Output files:
#   conn.log     — All connections (gold mine)
#   dns.log      — DNS queries and responses
#   http.log     — HTTP requests
#   ssl.log      — TLS/SSL handshakes
#   files.log    — File transfers
#   weird.log    — Protocol anomalies
#   notice.log   — Zeek-generated alerts

# Live capture on an interface
zeek -i eth0 local.zeek
```

### 7.2 Zeek Log Analysis for Threat Hunting

```bash
# Long-duration connections (persistent C2)
cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p proto duration orig_bytes resp_bytes | \
  awk '$5 > 3600 {print}' | sort -t$'\t' -k5 -n -r | head -20

# Connections with high packet count but low bytes (beaconing heartbeat)
cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p duration orig_pkts orig_bytes | \
  awk '$5 > 100 && $6 < 10000 {print}' | sort -t$'\t' -k5 -n -r

# DNS tunneling indicators in Zeek
cat dns.log | zeek-cut query qtype | \
  awk '{split($1,a,"."); base=a[length(a)-1]"."a[length(a)]; if(length($1)>50) print "[LONG] "$1" -> "base}' | \
  head -30

# DNS query volume by domain
cat dns.log | zeek-cut query | \
  awk -F. '{print $(NF-1)"."$NF}' | sort | uniq -c | sort -rn | head -20

# TLS connections without SNI (suspicious — most legitimate traffic has SNI)
cat ssl.log | zeek-cut id.orig_h id.resp_h id.resp_p server_name ja3 | \
  awk '$4 == "-" || $4 == "(empty)" {print "[NO-SNI] "$0}'

# JA3 fingerprint extraction from Zeek
cat ssl.log | zeek-cut ja3 | sort | uniq -c | sort -rn | head -20

# File transfers — identify executables downloaded
cat files.log | zeek-cut mime_type filename tx_hosts rx_hosts | \
  grep -E "executable|x-dosexec|x-msdos|octet-stream"

# HTTP User-Agent anomalies
cat http.log | zeek-cut user_agent | sort | uniq -c | sort -rn | head -30
```

### 7.3 Custom Zeek Script for Beacon Detection

```zeek
# beacon_detector.zeek — Detect periodic connections to same destination
@load base/protocols/conn

module BeaconDetector;

export {
    redef enum Notice::Type += { Beacon_Detected };
    const beacon_threshold = 10;      # minimum connections to analyze
    const cv_threshold = 0.20;        # coefficient of variation
    const analysis_window = 30min;    # rolling window
}

event zeek_done() {
    # Analysis runs on conn.log data post-capture
    # For live deployment, use SumStats framework for rolling analysis
    print "BeaconDetector: Analyze conn.log with external tools for beacon patterns";
    print "Use: cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p ts | sort";
}
```

---

## 8. Integrated Threat Hunting Workflow

### Step-by-step for Palace network defense:

1. **Baseline**: Capture 24-72 hours of normal traffic. Build profiles of normal DNS, HTTP, TLS behavior.
2. **Frequency analysis**: Find all periodic connections. Filter out known-good (Windows Update, AV updates, NTP).
3. **JA3 matching**: Extract all JA3 hashes. Compare against known-bad database and your baseline.
4. **DNS audit**: Flag high-entropy queries, high-volume domains, TXT/NULL record abuse.
5. **Lateral movement scan**: Map all SMB, WinRM, RDP, DCOM connections. Graph them. Look for chains.
6. **Protocol anomalies**: HTTP/TLS/DNS on wrong ports. Raw TCP to external IPs. ICMP with payloads.
7. **Exfil check**: Large outbound transfers, especially to cloud storage or uncommon destinations.

---

## 9. Rush's Operational Notes

**Palace-specific guidance:**
- Run Zeek on the Palace gateway 24/7. Log everything. Storage is cheap. Forensic visibility is priceless.
- JA3 hashes change with every Cobalt Strike malleable profile. Don't rely on hash matching alone — use behavioral analysis (beacon intervals, connection patterns) as the primary detection method.
- DNS tunneling is SLOW but extremely hard to block without breaking legitimate DNS. Focus on detection, not prevention.
- Every new host on the Palace network gets a 48-hour traffic baseline. Deviations trigger review.
- tshark is your scalpel. Zeek is your surveillance system. pyshark is your automation layer. Use all three.
- Think every route (GS-27): C2 can ride DNS, HTTPS, WebSocket, cloud APIs (Slack, Teams, Notion), or even steganography in images. Never stop looking.

---

*"Every packet tells a story. Most stories are boring. The one that isn't will be the one that saves you." — Rush*
