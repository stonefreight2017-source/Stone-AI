# R-6: Golden Reasoning — Math Scaffolds
# Step-by-step procedures for common calculations
# Palace USB Package — Golden Seed

---

## PURPOSE
LLMs make frequent arithmetic errors, especially with percentages, unit conversions,
and multi-step calculations. These scaffolds provide step-by-step procedures with
worked examples AND common error patterns. The model follows the scaffold mechanically
rather than trying to reason about math from scratch.

---

## 1. PERCENTAGE CALCULATIONS

### 1.1 Finding a Percentage of a Number
```
Formula: (percentage / 100) × number

Example: What is 15% of $200?
Step 1: Convert percentage to decimal: 15 / 100 = 0.15
Step 2: Multiply: 0.15 × 200 = $30

COMMON ERROR: Forgetting to divide by 100 (getting 3000 instead of 30)
```

### 1.2 Finding What Percentage One Number Is of Another
```
Formula: (part / whole) × 100

Example: 45 out of 200 users converted. What percentage?
Step 1: Divide part by whole: 45 / 200 = 0.225
Step 2: Multiply by 100: 0.225 × 100 = 22.5%

COMMON ERROR: Dividing whole by part (200/45 = 444%) — always smaller / larger
```

### 1.3 Percentage Change (Increase or Decrease)
```
Formula: ((new - old) / old) × 100

Example: Revenue went from $10,000 to $13,000. What's the % increase?
Step 1: Calculate difference: 13,000 - 10,000 = 3,000
Step 2: Divide by OLD value: 3,000 / 10,000 = 0.3
Step 3: Multiply by 100: 0.3 × 100 = 30% increase

COMMON ERROR: Dividing by the new value instead of old
COMMON ERROR: Saying "30% decrease" when the number went UP
```

### 1.4 Finding the Original Value After a Percentage Change
```
Formula: new_value / (1 + percentage/100)  [for increase]
Formula: new_value / (1 - percentage/100)  [for decrease]

Example: After a 20% discount, the price is $80. What was the original?
Step 1: Original × (1 - 0.20) = $80
Step 2: Original × 0.80 = $80
Step 3: Original = $80 / 0.80 = $100

COMMON ERROR: $80 + 20% of $80 = $96 (WRONG — 20% of the original, not of 80)
```

### 1.5 Compound Percentage Changes
```
Formula: original × (1 + r1/100) × (1 + r2/100)

Example: 10% increase followed by 10% decrease
Step 1: $100 × 1.10 = $110
Step 2: $110 × 0.90 = $99
Result: NOT back to $100. A 10% increase + 10% decrease = 1% net loss.

COMMON ERROR: Assuming equal percentage changes cancel out (they don't)
```

### 1.6 Percentage Points vs Percentage
```
"Conversion rate increased from 2% to 3%"
- Increase of 1 PERCENTAGE POINT (2% → 3%)
- Increase of 50 PERCENT ((3-2)/2 × 100 = 50%)

These are DIFFERENT. Always clarify which one you mean.
"Increased by 1 percentage point" ≠ "increased by 1 percent"
```

---

## 2. UNIT CONVERSIONS

### 2.1 Data Storage
```
BINARY (what computers actually use):
1 KiB = 1,024 bytes
1 MiB = 1,024 KiB = 1,048,576 bytes
1 GiB = 1,024 MiB = 1,073,741,824 bytes
1 TiB = 1,024 GiB = 1,099,511,627,776 bytes

DECIMAL (what vendors advertise):
1 KB = 1,000 bytes
1 MB = 1,000 KB = 1,000,000 bytes
1 GB = 1,000 MB = 1,000,000,000 bytes
1 TB = 1,000 GB = 1,000,000,000,000 bytes

A "500 GB" drive = 500,000,000,000 bytes = ~465.66 GiB
Loss: (500 - 465.66) / 500 = ~6.87% "missing" space

Quick conversion:
GB to GiB: multiply by 0.9313
TB to TiB: multiply by 0.9095
```

### 2.2 Bandwidth
```
Bits vs Bytes:
1 Byte = 8 bits
ISPs advertise in bits (Mbps), files download in bytes (MB/s)

Conversion: Mbps ÷ 8 = MB/s
100 Mbps = 12.5 MB/s
1 Gbps = 125 MB/s

Example: "How long to download a 500 MB file on 100 Mbps connection?"
Step 1: Convert speed: 100 Mbps = 12.5 MB/s
Step 2: Time = size / speed: 500 / 12.5 = 40 seconds
Step 3: Add overhead (~20%): 40 × 1.2 = ~48 seconds

COMMON ERROR: Dividing 500 by 100 to get 5 seconds (bits vs bytes confusion)
```

### 2.3 Time Conversions
```
Seconds in common intervals:
1 minute = 60 seconds
1 hour = 3,600 seconds
1 day = 86,400 seconds
1 week = 604,800 seconds
1 month (30 days) = 2,592,000 seconds
1 year (365 days) = 31,536,000 seconds

Milliseconds:
1 second = 1,000 ms
1 minute = 60,000 ms
1 hour = 3,600,000 ms

For caching TTL:
5 minutes = 300 seconds
15 minutes = 900 seconds
1 hour = 3,600 seconds
24 hours = 86,400 seconds
7 days = 604,800 seconds
30 days = 2,592,000 seconds
1 year = 31,536,000 seconds
```

---

## 3. FINANCIAL MATH

### 3.1 Monthly Recurring Revenue (MRR)
```
MRR = Σ (monthly price × number of subscribers per tier)

Example (Stone AI):
FREE:    500 users × $0 = $0
STARTER: 100 users × $19.99 = $1,999
PLUS:    50 users × $49.99 = $2,499.50
SMART:   30 users × $99.99 = $2,999.70
PRO:     10 users × $200 = $2,000

MRR = $0 + $1,999 + $2,499.50 + $2,999.70 + $2,000 = $9,498.20
ARR (Annual) = MRR × 12 = $113,978.40

COMMON ERROR: Including free users in MRR calculation
COMMON ERROR: Not accounting for annual billing discounts in MRR
```

### 3.2 Customer Acquisition Cost (CAC)
```
CAC = Total Sales & Marketing Spend / Number of New Customers Acquired

Example:
Spent $5,000 on ads in January. Acquired 50 new paying customers.
CAC = $5,000 / 50 = $100 per customer

COMMON ERROR: Counting free signups as "acquired customers" (only count paying)
```

### 3.3 Customer Lifetime Value (LTV / CLV)
```
Simple: LTV = ARPU × Average Customer Lifetime

ARPU (Average Revenue Per User per month) = MRR / paying subscribers
Average lifetime = 1 / monthly churn rate

Example:
MRR = $9,498.20 from 190 paying users
ARPU = $9,498.20 / 190 = $49.99/mo
Monthly churn = 5% → Average lifetime = 1 / 0.05 = 20 months
LTV = $49.99 × 20 = $999.80

RULE: LTV should be > 3× CAC for a healthy SaaS business
If CAC = $100 and LTV = $999.80, ratio = ~10:1 ✅ (excellent)
```

### 3.4 Break-Even Analysis
```
Break-even point = Fixed Costs / (Revenue per Unit - Variable Cost per Unit)

Example:
Fixed costs: $2,000/mo (hosting, tools, domains)
Revenue per customer: $49.99/mo average
Variable cost per customer: $5/mo (API calls, database)
Contribution per customer: $49.99 - $5 = $44.99

Break-even = $2,000 / $44.99 = 44.45 → Need 45 paying customers to break even

COMMON ERROR: Forgetting variable costs (API usage, bandwidth, support)
```

### 3.5 ROI (Return on Investment)
```
ROI = ((Gain - Cost) / Cost) × 100

Example:
Spent $1,000 on a marketing campaign. Generated $4,500 in new revenue.
ROI = (($4,500 - $1,000) / $1,000) × 100 = 350%

COMMON ERROR: Not including all costs (time spent, opportunity cost)
COMMON ERROR: Confusing revenue with profit
```

### 3.6 Discount Calculations
```
Regular discount:
Original × (1 - discount/100) = discounted price
$200 × (1 - 0.15) = $200 × 0.85 = $170

Stacked discounts (NOT additive):
15% off then 10% off ≠ 25% off
$200 × 0.85 × 0.90 = $153 (not $200 × 0.75 = $150)
Actual discount: ($200 - $153) / $200 = 23.5%

COMMON ERROR: Adding discount percentages (15% + 10% = 25% — WRONG)
```

---

## 4. TIME COMPLEXITY ESTIMATION

### 4.1 Big-O Quick Reference
```
O(1)        — Constant: Hash lookup, array index access
O(log n)    — Logarithmic: Binary search, balanced BST lookup
O(n)        — Linear: Simple loop, array scan
O(n log n)  — Linearithmic: Good sorting (merge sort, quick sort avg)
O(n²)       — Quadratic: Nested loops, bubble sort
O(n³)       — Cubic: Triple nested loops, matrix multiplication (naive)
O(2ⁿ)       — Exponential: Recursive Fibonacci (naive), power set
O(n!)       — Factorial: Permutations, brute-force TSP
```

### 4.2 Practical Impact Table
```
n = 10:
O(n) = 10, O(n log n) = 33, O(n²) = 100, O(2ⁿ) = 1,024

n = 100:
O(n) = 100, O(n log n) = 664, O(n²) = 10,000, O(2ⁿ) = 1.27 × 10³⁰

n = 1,000:
O(n) = 1,000, O(n log n) = 9,966, O(n²) = 1,000,000

n = 1,000,000:
O(n) = 1M, O(n log n) = 20M, O(n²) = 1 TRILLION (too slow!)

RULE OF THUMB (for 1 second execution):
O(n): n can be ~10,000,000 (10M)
O(n log n): n can be ~1,000,000 (1M)
O(n²): n can be ~10,000
O(n³): n can be ~1,000
O(2ⁿ): n can be ~25
```

### 4.3 Common Operations Complexity
```
Array:
- Access by index: O(1)
- Search (unsorted): O(n)
- Search (sorted): O(log n) with binary search
- Insert at end: O(1) amortized
- Insert at beginning: O(n)
- Sort: O(n log n)

HashMap/Object:
- Get/Set/Delete: O(1) average, O(n) worst case
- Iteration: O(n)

Database (with index):
- SELECT by indexed column: O(log n)
- SELECT by non-indexed column: O(n) (full scan)
- INSERT: O(log n) per index
- COUNT(*): O(n) in PostgreSQL (no stored count)

String:
- Length: O(1) in JS
- Concatenation: O(n) per concat (use array + join for many)
- Regex match: O(n) for simple, can be O(2ⁿ) for pathological patterns
```

---

## 5. STORAGE CALCULATIONS

### 5.1 Database Storage Estimation
```
Formula: rows × avg_row_size × overhead_factor

Example: Estimating storage for 1 million users
- Each user row: id (8B) + email (50B avg) + name (30B avg) +
  password_hash (60B) + timestamps (16B) + other fields (50B) = ~214 bytes
- With PostgreSQL overhead (~30%): 214 × 1.3 = ~278 bytes/row
- 1M users: 278 × 1,000,000 = 278 MB
- Add indexes (~50% of table size): 278 × 1.5 = ~417 MB
- Total: ~417 MB for 1M users

COMMON ERROR: Not accounting for indexes and overhead
COMMON ERROR: Using max size instead of average size
```

### 5.2 Image/File Storage Estimation
```
Example: User-uploaded avatars
- Average image size: 200 KB (after processing/compression)
- 10,000 users with avatars: 200 KB × 10,000 = 2 GB
- Growth: 1,000 new users/month × 200 KB = 200 MB/month

Example: Chat messages with attachments
- Average text message: 200 bytes
- Average image attachment: 500 KB
- 10% of messages have attachments
- 100,000 messages/month:
  Text: 100,000 × 200 B = 20 MB
  Attachments: 10,000 × 500 KB = 5 GB
  Total: ~5 GB/month
```

### 5.3 Log Storage Estimation
```
Average log line: 200-500 bytes
Application logging ~100 lines/minute under normal load

100 lines/min × 300 bytes × 60 min × 24 hr = 4.32 GB/day
Monthly: 4.32 × 30 = ~130 GB/month

ALWAYS implement log rotation and retention policy:
- Keep 7 days of detailed logs
- Keep 30 days of error-level logs
- Keep 90 days of aggregated metrics
```

---

## 6. BANDWIDTH CALCULATIONS

### 6.1 Monthly Bandwidth Estimation
```
Formula: avg_page_size × page_views_per_month

Example: Stone AI website
- Average page load: 2 MB (HTML + CSS + JS + images)
- 50,000 page views/month
- Bandwidth: 2 MB × 50,000 = 100 GB/month

With CDN caching (90% cache hit rate):
- Origin bandwidth: 100 GB × 0.10 = 10 GB/month
- CDN bandwidth: 100 GB × 0.90 = 90 GB/month (often free on Cloudflare)

API bandwidth:
- Average API response: 5 KB
- 500,000 API calls/month
- API bandwidth: 5 KB × 500,000 = 2.5 GB/month
```

### 6.2 Real-Time Feature Bandwidth
```
WebSocket connection overhead: ~200 bytes/message

Chat with 1,000 concurrent users:
- Average 2 messages/minute per user (typing + sending)
- Message size: 200 bytes + overhead = 400 bytes
- Bandwidth: 1,000 users × 2 msg/min × 400 bytes × 60 min = 48 MB/hour
- Daily (16 active hours): 48 × 16 = 768 MB/day

Typing indicators:
- 5 events/second during typing × 100 bytes = 500 bytes/second per active typer
- 100 simultaneous typers: 50 KB/second = 180 MB/hour
```

---

## 7. STATISTICAL REASONING

### 7.1 Sample Size
```
Rule of thumb:
- Minimum 30 samples for basic statistics (Central Limit Theorem)
- For A/B testing: use a sample size calculator
- Rough formula: n = (Z² × p × (1-p)) / E²
  Z = 1.96 (95% confidence)
  p = expected proportion (use 0.5 if unknown)
  E = margin of error

Example: Testing if a new button color improves conversion
- Current conversion: 3%
- Want to detect 1 percentage point improvement (to 4%)
- Need ~3,000 visitors PER VARIANT (6,000 total)
- At 500 visitors/day: ~12 days to run the test

COMMON ERROR: Stopping A/B tests early when results look significant
COMMON ERROR: Not accounting for multiple comparisons
```

### 7.2 Averages: Mean vs Median
```
Mean: Sum of all values / count. Sensitive to outliers.
Median: Middle value when sorted. Robust to outliers.

Response times: [50ms, 60ms, 55ms, 70ms, 5000ms]
Mean: 1047ms (misleading — one outlier skews it)
Median: 60ms (representative of typical experience)

RULE: For latency, income, and any skewed data — report MEDIAN, not mean.
For performance monitoring, use p50 (median), p95, p99.
```

### 7.3 Base Rate Fallacy
```
"Our fraud detection flags 95% of fraud correctly and
 has only a 1% false positive rate."

Sounds great. But:
- 1% of transactions are actually fraud (base rate)
- 99% are legitimate

Per 10,000 transactions:
- 100 fraudulent: 95% caught = 95 flagged correctly
- 9,900 legitimate: 1% false positive = 99 flagged incorrectly

Of 194 total flags, only 95 (49%) are actual fraud!
The "95% accurate" system is wrong half the time.

LESSON: Always consider the base rate when evaluating test accuracy.
```

---

## 8. COMMON ERROR PATTERNS IN MATH

### Errors That LLMs Make Most Often

```
1. OFF-BY-ONE:
   "10 items, 0-indexed, last index is..." → 9, not 10
   "From Jan 1 to Jan 31, how many days?" → 31, not 30
   "A fence with 10 posts has..." → 9 sections, not 10

2. PERCENTAGE DIRECTION:
   "Price dropped from $100 to $80" → 20% decrease
   "Price rose from $80 to $100" → 25% increase (NOT 20%)
   The base changes! Same absolute change, different percentage.

3. UNITS MISMATCH:
   Mixing MB and GB in the same calculation
   Mixing ms and seconds
   Mixing Mbps (bits) and MB/s (bytes)
   ALWAYS: Convert all values to the same unit FIRST

4. DIVISION BY ZERO:
   Percentage change from 0 → undefined (not infinity)
   Churn rate with 0 customers → undefined
   Always check the denominator

5. ROUNDING TOO EARLY:
   Bad: Round each step, compound errors
   Good: Keep full precision, round only the final answer

6. COMPOUNDING VS ADDITION:
   Two 50% discounts ≠ 100% off
   Two 10% growth periods ≠ 20% growth
   Always multiply growth factors, don't add percentages

7. CONFUSING TOTALS AND RATES:
   "5 users per day for 30 days" = 150 users total
   NOT "5 users per 30 days" (that's 5 users)
   Be explicit about "per [unit]" vs "total"
```

---

## 9. QUICK ESTIMATION TECHNIQUES

### 9.1 Powers of 2 (for CS calculations)
```
2¹⁰ = 1,024 ≈ 1 thousand (1 KB)
2²⁰ = 1,048,576 ≈ 1 million (1 MB)
2³⁰ = 1,073,741,824 ≈ 1 billion (1 GB)
2⁴⁰ ≈ 1 trillion (1 TB)

Useful: 2ⁿ doubles every increment
2¹⁶ = 65,536 (max unsigned 16-bit integer)
2³² = 4,294,967,296 (max unsigned 32-bit integer)
2⁶⁴ = 18,446,744,073,709,551,616 (max unsigned 64-bit integer)
```

### 9.2 Rule of 72 (Doubling Time)
```
Time to double = 72 / growth rate (%)

10% monthly growth → doubles in 72/10 = 7.2 months
20% monthly growth → doubles in 72/20 = 3.6 months
5% monthly growth → doubles in 72/5 = 14.4 months

Example: 100 users growing 15% monthly
Month 0: 100 users
Doubles in: 72/15 = 4.8 months → ~200 users by month 5
Month 10: ~405 users (100 × 1.15¹⁰)
Month 12: ~535 users (100 × 1.15¹²)
```

### 9.3 Napkin Math for System Design
```
Read/write ratio: Most apps are 90% read, 10% write
Requests per second from DAU:
  DAU × requests_per_user_per_day / 86,400
  100K DAU × 10 requests/day / 86,400 ≈ 12 requests/second
  Peak: 3-5x average ≈ 36-60 requests/second

Storage per year:
  Users × data_per_user × 365 days

Servers needed:
  A single server handles ~1,000-10,000 requests/second (depending on complexity)
  If you need 100 RPS, one server is fine
  If you need 100,000 RPS, you need 10-100 servers or serverless
```

---

## CALCULATION VERIFICATION PROTOCOL

After ANY calculation:
```
1. UNITS CHECK: Are all units consistent throughout?
2. SANITY CHECK: Does the answer make intuitive sense?
   - Is it the right order of magnitude?
   - Is it positive when it should be?
   - Is it less than the maximum possible?
3. BOUNDARY CHECK: What happens at extremes?
   - What if n = 0? n = 1? n = very large?
4. REVERSE CHECK: Can I work backward to verify?
   - If 30% of 200 = 60, does 60/200 = 0.30? ✅
5. ALTERNATIVE METHOD: Can I calculate it a different way?
   - 15% of 200 = 10% (20) + 5% (10) = 30 ✅
```

**Embedding hint**: Each numbered section is an independent retrieval unit.
Section 8 (error patterns) should be retrieved alongside any math calculation.
The verification protocol should be retrieved with every calculation.
