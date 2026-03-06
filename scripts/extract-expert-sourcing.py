#!/usr/bin/env python3
"""
Extract 36 expert sourcing blocks from agent-definitions.ts,
replacing each with a buildExpertSourcingBlock() function call.
"""

import re
import sys

FILE = "src/lib/agent-definitions.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

original_len = len(content)

# Pattern matches the full expert sourcing knowledge seed entry:
#   {
#     title: "Expert Sourcing Techniques — ...",
#     content: `EXPERT SOURCING METHODOLOGY — Finding the Best Minds in DOMAIN
#     ... (5 techniques + APPLICATION + CROSS-REFERENCE) ...`
#   }
#
# We need to extract: domain, conferences, journals, publications, application

pattern = re.compile(
    r'(\{\s*\n\s*title:\s*"Expert Sourcing Techniques — [^"]+",\s*\n\s*content:\s*`)EXPERT SOURCING METHODOLOGY — Finding the Best Minds in ([^\n]+)\n'
    r'\nThese techniques help you identify and learn from the most authoritative voices in your domain\. Apply them when researching any topic to ensure the highest-quality sources\.\n'
    r'\nTECHNIQUE 1: CONFERENCE KEYNOTE MAPPING\n'
    r'Top conferences: ([^\n]+)\.\n'
    r'Research keynote speakers from the last 3-5 years\.[^\n]+\n'
    r'\nTECHNIQUE 2: CORRESPONDING AUTHOR ANALYSIS\n'
    r'In scientific papers[^\n]+Key journals: ([^\n]+)\.\n'
    r'\nTECHNIQUE 3: PEER REVIEWER IDENTIFICATION\n'
    r'Peer reviewers are experts[^\n]+\n'
    r'\nTECHNIQUE 4: INDUSTRY PUBLICATION BYLINES\n'
    r'Follow specialized publications: ([^\n]+)\.\n'
    r'Regular byline contributors[^\n]+\n'
    r'\nTECHNIQUE 5: CITATION NETWORK ANALYSIS\n'
    r'Use Google Scholar[^\n]+\n'
    r'\nAPPLICATION: ([^\n]+)\n'
    r'\nCROSS-REFERENCE: Combine expert sourcing with the Research Synthesis Engine agent[^\n]+`'
)

count = 0
def replacer(m):
    global count
    count += 1
    # Extract the varying parts
    domain = m.group(2).strip()
    conferences = m.group(3).strip()
    journals = m.group(4).strip()
    publications = m.group(5).strip()
    application = m.group(6).strip()

    # Escape backticks and ${} in extracted strings for JS template safety
    def escape_js(s):
        return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

    title_domain = domain  # Keep for title

    return (
        f'{{\n'
        f'        title: "Expert Sourcing Techniques — Identifying World-Class Authorities in {title_domain}",\n'
        f'        content: buildExpertSourcingBlock({{\n'
        f'          domain: "{escape_js(domain)}",\n'
        f'          conferences: "{escape_js(conferences)}",\n'
        f'          journals: "{escape_js(journals)}",\n'
        f'          publications: "{escape_js(publications)}",\n'
        f'          application: "{escape_js(application)}",\n'
        f'        }})'
    )

new_content = pattern.sub(replacer, content)

if count == 0:
    print("ERROR: No expert sourcing blocks matched. Pattern may need adjustment.")
    # Try a more lenient search to debug
    simple = re.findall(r'EXPERT SOURCING METHODOLOGY — Finding the Best Minds in (.+)', content)
    print(f"Found {len(simple)} 'EXPERT SOURCING METHODOLOGY' headers:")
    for s in simple[:5]:
        print(f"  - {s}")
    sys.exit(1)

# Also need to add the import of buildExpertSourcingBlock
if "buildExpertSourcingBlock" not in new_content.split("import")[0]:
    # Find the existing import from agent-shared-prompts
    import_pattern = re.compile(
        r'import \{ (CROSS_REFERRAL_BLOCK, ETHICS_GUARD_BLOCK) \} from "\./agent-shared-prompts";'
    )
    new_content = import_pattern.sub(
        r'import { CROSS_REFERRAL_BLOCK, ETHICS_GUARD_BLOCK, buildExpertSourcingBlock } from "./agent-shared-prompts";',
        new_content
    )

new_len = len(new_content)
saved = original_len - new_len

with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"SUCCESS: Replaced {count} expert sourcing blocks")
print(f"File size: {original_len:,} -> {new_len:,} chars ({saved:,} chars saved, {saved*100//original_len}%)")
