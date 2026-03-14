# Physical Security Assessment

> Rush Seed — Palace Security Knowledge Base
> Classification: OFFENSIVE/DEFENSIVE — FOUNDER EYES ONLY
> Version: 1.0 | Created: 2026-03-09

---

## 1. Physical Security Fundamentals

Physical security is the foundation all other security controls rest upon. If an attacker can physically access your systems, every digital control becomes secondary. Rush's principle: **if they can touch it, they own it.**

### 1.1 Layers of Physical Security

```
Layer 1: Perimeter (fence, walls, parking barriers)
Layer 2: Building Exterior (doors, windows, loading docks)
Layer 3: Reception/Lobby (visitor management, guards)
Layer 4: Interior Zones (badge access, secured areas)
Layer 5: Restricted Areas (server rooms, executive offices)
Layer 6: Asset Level (device locks, safes, cable locks)
```

### 1.2 Assessment Objectives

- Identify physical access vulnerabilities
- Test access control systems (badges, locks, biometrics)
- Evaluate surveillance systems effectiveness
- Assess guard/reception security awareness
- Test tailgating and social engineering resilience
- Verify data destruction procedures
- Document findings and remediation recommendations

---

## 2. Physical Penetration Testing Methodology

### 2.1 Pre-Engagement

```
Authorization Requirements:
[ ] Signed statement of work with physical testing scope
[ ] Specific buildings/floors authorized
[ ] Time windows for testing
[ ] Emergency contact (security director)
[ ] "Get out of jail free" letter (signed by authorized executive)
[ ] Photo ID of tester on file with security
[ ] Clear rules of engagement (what's off-limits)
[ ] Insurance/liability coverage confirmed

Intelligence Gathering:
[ ] Building blueprints/floor plans (public records, Google Maps)
[ ] Entry/exit points identified
[ ] Security camera placement (visible from outside)
[ ] Guard schedules and patterns
[ ] Employee arrival/departure patterns
[ ] Badge system type (visual inspection)
[ ] Vendor/delivery schedules
[ ] Nearby observation points for surveillance
```

### 2.2 External Assessment

**Perimeter Survey:**
```
Walk/drive the full perimeter:
[ ] Fence condition (gaps, damage, climbable?)
[ ] Gate security (automated, guarded, open?)
[ ] Parking lot access controls
[ ] Lighting coverage (dark spots at night)
[ ] Camera coverage gaps
[ ] Dumpster location and accessibility
[ ] Loading dock security
[ ] Emergency exit locations (propped open?)
[ ] Vegetation providing concealment
[ ] Adjacent buildings with roof access
[ ] Utility access points (electrical, HVAC, telecom)
```

**Entry Point Catalog:**
```
For each entry point, document:
- Location and type (main door, side entrance, emergency exit)
- Lock type (keyed, badge, combo, push bar)
- Camera coverage (yes/no, angle, type)
- Traffic volume (how many people use it per hour)
- Guard presence (permanent, roving, none)
- Tailgating risk (single door vs. mantrap)
- Hours of operation
- Bypass potential
```

### 2.3 Tailgating Techniques

**Standard Tailgating:**
```
1. Wait near a badge-access door during peak hours
2. Time approach with legitimate employee
3. Hands full (carrying boxes, coffee, equipment)
4. Follow closely behind as they badge in
5. Smile, nod, say "thanks" naturally
6. Move with purpose once inside

Success rate: 60-80% without any props or pretext
```

**Smoker's Entrance:**
```
1. Identify where employees smoke (usually side door)
2. Stand outside smoking area during break time
3. Chat casually with smokers
4. Walk back inside with the group
5. No badge needed — smokers hold the door

This is one of the highest-success physical entry methods.
```

**Delivery Pretext:**
```
1. Wear delivery uniform (UPS, FedEx, courier)
2. Carry real-looking packages addressed to real employees
3. Arrive at reception: "Delivery for [name], signature required"
4. If escorted to office — access to interior
5. If left at reception — try "I need to deliver to their desk, it's fragile"
```

**IT Contractor:**
```
1. Business casual + laptop bag + "contractor" badge
2. Clipboard with work order referencing real systems
3. Approach reception: "I'm here for the [server/network] maintenance"
4. Reference a real employee name as your contact
5. If challenged: "They should be expecting me — can you call them?"
```

---

## 3. Lock Picking Fundamentals

### 3.1 Lock Types and Vulnerabilities

| Lock Type | Security Level | Pick Difficulty | Bypass Method |
|-----------|---------------|-----------------|---------------|
| Pin Tumbler (basic) | Low | Easy | Pick, bump, rake |
| Pin Tumbler (security) | Medium | Moderate | Pick (spool/serrated pins) |
| Disc Detainer | Medium-High | Hard | Specialized pick |
| Tubular | Medium | Easy | Tubular pick tool |
| Wafer Lock | Low | Very Easy | Jiggle, rake |
| Padlock (basic) | Low | Easy | Shim, pick |
| Electronic Keypad | Varies | N/A | Code discovery, bypass |
| Magnetic Lock | Medium | N/A | Power interruption |
| Deadbolt (basic) | Medium | Moderate | Pick, bump |
| High-Security (Medeco, Abloy) | High | Very Hard | Usually not practical |

### 3.2 Basic Lock Picking

**Pin Tumbler Locks (most common):**
```
Tools needed:
- Tension wrench (bottom of keyway)
- Pick (hook, half-diamond, or rake)

Technique — Single Pin Picking (SPP):
1. Insert tension wrench at bottom of keyway
2. Apply light rotational pressure (turning direction)
3. Insert pick and feel for pins
4. Find the binding pin (most resistant to pushing)
5. Push binding pin up until it sets (slight click/give)
6. Move to next binding pin
7. Repeat until all pins set
8. Cylinder rotates — lock open

Key principles:
- Light tension is critical — too much = pins won't set
- Feel for the binding order (one pin binds first)
- Practice on transparent/cutaway locks first
- Security pins (spools, serrated) require counter-rotation
```

**Raking:**
```
Technique: Rapid back-and-forth motion with a rake pick

1. Insert tension wrench (very light pressure)
2. Insert rake pick fully
3. Rapidly scrub in and out while varying depth
4. Pins randomly set as rake passes over them
5. May take 10-30 seconds for basic locks

Best rakes: Bogota, snake, city rake
Works well on: cheap pin tumbler locks (< 5 pins)
Doesn't work on: security pins, high-pin-count locks
```

**Bump Keys:**
```
Concept: A key cut to maximum depth on all positions

1. Insert bump key (one click short of fully inserted)
2. Apply slight tension
3. Strike the key with a bump hammer/screwdriver handle
4. Energy transfers through pins — they jump
5. Momentary gap between driver and key pins
6. Tension catches the cylinder — turns

Effectiveness: Works on ~90% of standard pin tumbler locks
Countermeasures: Bump-resistant pins, high-security cylinders
```

### 3.3 Bypass Techniques (Non-Picking)

```
Door Shimming:
- Slide shim between door and frame
- Push back spring-loaded latch
- Works on doors without deadbolts
- Credit card, shim tool, or thin metal strip

Under-Door Tools:
- Slide tool under door gap
- Hook or lever the inside handle
- Works on doors with lever handles (not knobs)
- Commercial under-door tools available

Hinge Pin Removal:
- If hinges are on the accessible side
- Remove hinge pins
- Swing door open from hinge side
- Common on older buildings and utility rooms

Crash Bar Bypass:
- Under-door tool to push crash bar
- Wire through door gap to lever crash bar
- "REX" sensor activation (motion sensor on inside)
- Some crash bars have exterior key override

Lock Shimming (Padlocks):
- Insert thin metal shim into padlock shackle
- Slide between shackle and locking mechanism
- Push locking pawl back
- Shackle releases without combination/key
```

---

## 4. Badge and Access Card Attacks

### 4.1 RFID/NFC Card Technology

**Low Frequency (125kHz):**
```
Common types: HID ProxCard, EM4100, T5577
Security: MINIMAL — easily readable and clonable
Range: 1-10 cm (standard), up to 1m (long-range reader)

Cloning process:
1. Read card with Proxmark3 or HID cloner
   proxmark3> lf search
   proxmark3> lf hid read

2. Card data displayed (facility code + card number)
   TAG ID: 2004263f88 (HID H10301 FC:101 CN:12345)

3. Clone to blank T5577 card
   proxmark3> lf hid clone 2004263f88

4. Test cloned card on target reader
```

**High Frequency (13.56MHz):**
```
Common types: MIFARE Classic, MIFARE DESFire, iCLASS
Security: Varies — Classic is broken, DESFire is stronger

MIFARE Classic attack:
1. Read card UID
   proxmark3> hf search
   proxmark3> hf mf info

2. Check for default keys
   proxmark3> hf mf chk *1 ? t

3. Nested attack (if one key known)
   proxmark3> hf mf nested 1 0 A ffffffffffff d

4. Hardnested attack (if no keys known)
   proxmark3> hf mf hardnested

5. Dump card
   proxmark3> hf mf dump

6. Clone to blank card
   proxmark3> hf mf restore
```

### 4.2 Long-Range Badge Reading

```
Equipment:
- Long-range RFID reader (custom or commercial)
- Antenna (directional, higher gain = longer range)
- Battery pack for portable operation
- Recording device for captured data

Technique:
1. Position near employee entrance
2. Reader captures badge data as employees walk by
3. Range: up to 1 meter for 125kHz, 30cm for 13.56MHz
4. Operational window: morning arrival rush

Counter-detection:
- Reader fits in briefcase/bag
- No visible equipment
- Natural-looking positioning (sitting on bench, standing at bus stop)
- Quick capture — don't linger

Ethical note: ALWAYS have authorization. Badge cloning without
consent is a crime.
```

### 4.3 Badge Visual Forgery

```
For authorized testing where badge cloning is out of scope:

1. Photograph a real badge (from distance with zoom lens)
2. Recreate visual design (Photoshop, GIMP)
3. Print on appropriate card stock
4. Add lanyard matching company standard
5. Clip/badge holder matching company standard

This won't pass electronic readers but may pass visual checks by:
- Guards who glance but don't scan
- Employees who see a badge but don't read details
- Reception areas with visual-only verification

Improvement: Print on PVC card with holographic overlay
```

---

## 5. Security Camera Analysis

### 5.1 Camera Types and Vulnerabilities

| Camera Type | Identification | Weakness |
|-------------|---------------|----------|
| Dome | Hemispherical housing on ceiling | Hard to determine aim direction |
| Bullet | Cylindrical, wall/pole mounted | Visible aim direction |
| PTZ | Pan-tilt-zoom, larger housing | Covers wide area but blind when panning |
| Hidden/Pinhole | Very small, concealed | Narrow FoV, low resolution |
| Thermal/IR | Larger housing, IR window | Limited detail, good at detection |
| Dummy | Usually no cable, no LEDs | Blinking LED may be only power draw |

### 5.2 Camera Placement Assessment

```
Survey methodology:
1. Walk full perimeter, note every camera
2. Photograph each camera (location, model if visible, aim direction)
3. Map cameras on floor plan
4. Identify coverage gaps
5. Note camera types and capabilities
6. Check for active monitoring vs. recording only
7. Identify control room location

Common gaps:
- Side entrances and emergency exits
- Parking garages (lower levels)
- Stairwells
- Rooftop access
- Loading docks (after hours)
- Between buildings in campus layouts
- Areas with heavy vegetation
- Directly below/beside wall-mounted cameras (blind spot)
```

### 5.3 Network Camera Vulnerabilities

```
IP Camera Discovery:
# Nmap scan for common camera ports
nmap -sV -p 80,443,554,8080,8443,37777 TARGET_NETWORK/24

# RTSP stream discovery
nmap -sV -p 554 --script rtsp-methods TARGET_IP

# Default credentials for common brands:
# Hikvision: admin/12345 or admin/admin
# Dahua: admin/admin
# Axis: root/pass
# Samsung: admin/4321
# Bosch: service/service

# Shodan search for exposed cameras
shodan search "Server: Hikvision-Webs" net:TARGET_RANGE
shodan search "port:554 has_screenshot:true" net:TARGET_RANGE

# RTSP stream access
vlc rtsp://admin:12345@CAMERA_IP:554/Streaming/Channels/101
ffplay rtsp://CAMERA_IP:554/live.sdp
```

---

## 6. Dumpster Diving

### 6.1 What to Look For

```
High Value:
- Printed emails and memos
- Organizational charts
- Phone directories / extension lists
- Network diagrams
- Password sticky notes (yes, still a thing)
- Discarded hard drives or USB devices
- Shredded documents (cross-cut is harder, strip-cut is reconstructible)
- Post-it notes with credentials
- Visitor logs
- Badge/access card disposal
- IT equipment disposal

Medium Value:
- Business cards (employee names, titles, contact info)
- Meeting agendas and minutes
- Invoices (vendor relationships, amounts)
- Travel itineraries
- Training materials (reveals internal systems)
- Old employee badges

Low but Useful:
- Letterhead (for forging documents)
- Envelopes (address format, department names)
- Product packaging (technology in use)
- Cafeteria menus (schedule patterns)
```

### 6.2 Dumpster Diving Methodology

```
Preparation:
- Identify dumpster locations (perimeter survey)
- Determine pickup schedule (avoid competition with disposal)
- Plan timing (after business hours, before pickup)
- Bring gloves, flashlight, bags for collection
- Camera for documenting finds

Execution:
1. Approach from least-observed direction
2. Work quickly and quietly
3. Sort on-site — take only valuable items
4. Photograph everything before removing
5. Replace items as found if not taking
6. Document date, time, location of finds

Legal Note:
- Dumpster contents are generally considered abandoned property
- However, if dumpster is on private property, access may be trespassing
- ALWAYS have authorization for pentesting engagements
- Some jurisdictions have specific laws about dumpster diving
```

---

## 7. Environmental and Infrastructure Assessment

### 7.1 HVAC and Utility Access

```
HVAC vulnerabilities:
- Ductwork large enough for human access (rare but real)
- HVAC roof units providing roof access
- Air intake accessible for introduction of substances
- HVAC control panels with network access
- Utility corridors connecting buildings

Electrical:
- Unprotected breaker panels
- Generator access
- UPS rooms without badge access
- Power redundancy assessment

Telecommunications:
- Exposed cable runs
- Unlocked telecom closets
- Network jacks in public areas
- Wireless access points accessible for physical tampering
- Cell tower/repeater equipment access
```

### 7.2 Server Room Assessment

```
Physical Controls Checklist:
[ ] Dedicated badge/biometric access
[ ] Mantrap or anti-tailgating
[ ] Camera coverage inside room
[ ] Environmental monitoring (temp, humidity)
[ ] Fire suppression system
[ ] Water detection sensors
[ ] Rack locks on cabinets
[ ] Cable management (prevents unauthorized taps)
[ ] Visitor log (physical sign-in)
[ ] No windows or secured windows
[ ] Raised floor access secured
[ ] Ceiling access secured
[ ] Emergency power (UPS + generator)

Common Server Room Failures:
- Badge access but door propped open for cooling
- Shared badge code known to entire IT department
- No camera inside (only at door)
- Network cables accessible without rack locks
- KVM/console access without additional authentication
- Cleaning crew has unsupervised access
- Fire suppression not tested recently
```

---

## 8. Reporting Physical Security Findings

### 8.1 Finding Documentation

```
For each finding:
1. Title: Clear, descriptive name
2. Location: Specific building, floor, area
3. Evidence: Photos, video (timestamped)
4. Severity: Critical / High / Medium / Low
5. Description: What was found and why it matters
6. Exploitation: How an attacker would use this
7. Remediation: Specific fix recommendations
8. Cost estimate: Implementation difficulty/cost

Example Finding:
Title: Emergency Exit Door Propped Open During Business Hours
Location: Building A, East side, ground floor
Evidence: [Photo with timestamp]
Severity: High
Description: Emergency exit door on east side consistently propped
open with a brick during 9 AM - 5 PM for smoker access. No camera
coverage on this door. Provides unrestricted access to ground floor
without badge or reception check.
Exploitation: Attacker could enter building unrestricted, access
ground floor offices, potentially reach server room on same floor.
Remediation: Install door alarm, relocate smoking area, add camera
coverage, install auto-closing mechanism with alarm.
Cost: $2,000-5,000 for door alarm + camera installation.
```

### 8.2 Physical Security Maturity Model

```
Level 1 — Minimal
- Basic locks on exterior doors
- No camera system
- No badge access
- Reception during business hours only

Level 2 — Basic
- Badge access on main entrance
- Basic camera system (recording, not monitored)
- Keyed locks on sensitive areas
- Visitor sign-in at reception

Level 3 — Managed
- Badge access on all entries
- Monitored camera system
- Anti-tailgating measures on some doors
- Visitor management system
- Guard presence during business hours

Level 4 — Advanced
- Biometric access for sensitive areas
- 24/7 monitored cameras with analytics
- Mantrap on critical entries
- 24/7 guard presence
- Environmental monitoring
- Regular physical security audits

Level 5 — Optimized
- All Level 4 controls
- AI-powered video analytics
- Integration with cyber security (SIEM)
- Regular physical pen testing
- Employee security culture training
- Continuous improvement program
```

---

## 9. Rush's Physical Security Rules

```
1. Authorization letter ALWAYS on your person during physical tests.
2. Never force entry — if a technique fails, document and move on.
3. Photograph everything — evidence is your protection.
4. Have the security director's number on speed dial.
5. If confronted, immediately identify yourself and show authorization.
6. Never test alone — always have a teammate or remote contact.
7. Stop immediately if safety is at risk (yours or anyone else's).
8. Document the time of every action for the engagement timeline.
9. Return all cloned badges and collected materials after the engagement.
10. Physical findings often have the biggest impact — present them clearly.
```

---

*Rush knows that the most sophisticated cyber defenses collapse when someone props open a door. Physical security isn't glamorous, but it's the foundation everything else is built on. Test it. Break it. Fix it.*
