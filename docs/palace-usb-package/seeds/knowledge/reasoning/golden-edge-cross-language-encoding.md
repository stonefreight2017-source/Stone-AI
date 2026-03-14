# Golden Seed E-6: Cross-Language & Encoding Edge Cases

## Purpose
Real-world input is messy. Users mix languages, paste code alongside prose, send emoji in technical contexts, switch formats mid-conversation, and produce text with encoding artifacts. A 32B model often chokes on these edge cases — misinterpreting code as prose, mangling Unicode, or losing track when the input format shifts. This seed provides parsing strategies for every type of mixed-content input.

---

## Category 1: Mixed Natural Language and Code

### The Challenge
Users frequently embed code within natural language without clear delimiters. The model must parse which parts are code and which are prose.

### Detection Heuristics

**Inline code (no backticks):**
- Camel/snake case identifiers in otherwise natural text: "the getUserById function returns null"
- Dot notation: "I called response.data.users and got undefined"
- Programming keywords in non-programming sentences: "my import statement at the top throws an error"
- File paths: "check src/components/Header.tsx"
- Terminal commands: "I ran npm install and it failed"

**Code blocks without formatting:**
Users paste code without backtick fencing. Detection signals:
- Sudden shift to consistent indentation
- Semicolons at end of lines
- Curly braces, angle brackets, parentheses in structured patterns
- Variable declarations (const, let, var, int, def)
- Import/require statements

### Parsing Strategy
```
1. Scan input for code indicators
2. Identify code boundaries (where code starts and ends)
3. Parse code and natural language separately
4. When referencing user's code in response, use proper code formatting
5. When the user writes code inline without backticks, understand it as code but respond with proper formatting
```

### Examples

**User input (no code formatting):**
"I have this component function Header({ title }) { return <h1>{title}</h1> } but it doesn't render. The title prop is definitely being passed."

**Parsed as:**
- Code: `function Header({ title }) { return <h1>{title}</h1> }`
- Natural language: "I have this component [CODE] but it doesn't render. The title prop is definitely being passed."
- Intent: Debug why the component doesn't render

**Response approach:** Treat the inline code as a code block, analyze it, and respond with properly formatted code.

---

## Category 2: Mixed Languages (Human Languages)

### The Challenge
Users write in multiple human languages within a single message, or use technical English terms within non-English text.

### Common Patterns

**Technical English in non-English text:**
- German developer: "Ich habe einen Bug in meiner useEffect Hook gefunden"
- Japanese developer: "APIのレスポンスがundefinedになっています"
- Portuguese developer: "O meu component está renderizando duas vezes"

**Handling rule:** Respond in the user's primary language. Keep technical terms in their original form (don't translate "useEffect" to another language).

**Code-switching (alternating languages):**
- "Can you fix this? Porque no funciona el botón de submit"
- Processing: Identify dominant language for response. If roughly equal, respond in English (safest default) or ask preference.

**Transliterated text:**
- Hindi in Latin script: "mera database connection nahi ho raha"
- Arabic in Latin script: "el database mesh shaghal"
- Processing: Detect the transliterated language, respond in the same script the user used (Latin transliteration) unless they explicitly use native script.

### Response Language Rules
1. Match the user's language unless they ask otherwise
2. Keep code, commands, and technical terms in English
3. If the user mixes languages, respond in the one they use most
4. If truly equal, default to English
5. Never assume a non-English speaker wants simpler explanations — language choice is not an expertise signal

---

## Category 3: Unicode Edge Cases

### Common Unicode Issues

**Invisible characters:**
- Zero-width spaces (U+200B) in pasted code that cause syntax errors
- Right-to-left marks (U+200F) in mixed LTR/RTL text
- Non-breaking spaces (U+00A0) vs regular spaces
- Byte Order Marks (BOM) at file beginnings

**Detection:** When code "looks correct" but produces unexpected errors, suggest checking for invisible characters:
"This might have invisible Unicode characters. Try pasting it into a hex editor or running `cat -v filename` to reveal hidden characters."

**Lookalike characters:**
- Cyrillic 'а' (U+0430) vs Latin 'a' (U+0061)
- Greek 'ο' (U+03BF) vs Latin 'o' (U+006F)
- En dash '–' (U+2013) vs hyphen '-' (U+002D) vs minus '−' (U+2212)
- "Smart quotes" ' ' " " vs straight quotes ' "
- Fullwidth characters 'ａ' vs standard 'a'

**Impact on code:** These can cause extremely confusing bugs where code looks correct but doesn't work. Always consider homoglyph issues when debugging mysterious syntax errors.

**Emoji in identifiers:**
Some languages (Swift, JavaScript) allow emoji in variable names:
```javascript
const 🎉 = "party"; // Valid JavaScript
```
Handle this correctly — don't strip emoji from code.

### Encoding Detection and Handling

**UTF-8 mojibake (encoding corruption):**
- "CafÃ©" instead of "Café" — UTF-8 interpreted as Latin-1
- "ä½ å¥½" instead of "你好" — UTF-8 interpreted as Latin-1
- Response: Identify the corruption pattern, suggest the correct encoding, help fix the data pipeline

**Mixed encodings in data:**
- CSV files where some rows are UTF-8 and others are Latin-1
- Database columns with mixed encoding entries
- Response: Recommend normalizing to UTF-8, provide conversion approaches

**Character encoding in URLs:**
- Spaces as `%20` or `+`
- Unicode as percent-encoded UTF-8 bytes: `%E4%BD%A0%E5%A5%BD` for "你好"
- Response: Decode correctly, handle both forms

---

## Category 4: Format Switching Mid-Conversation

### The Challenge
Users start in one format and switch to another without signaling the change.

### Common Format Transitions

**Prose → Code:**
User starts with natural language question, then pastes code
```
I'm having trouble with my auth middleware. Here's what I have:

export async function middleware(req) {
  const token = req.cookies.get('session');
  ...
```
Processing: The transition from prose to code is clear. Parse accordingly.

**Code → Prose:**
```
// After running the migration
// I get this error but I don't understand what it means
```
Processing: These comments are not code comments — they're natural language about the code. Don't treat them as code to debug.

**Q&A → Instruction:**
"What's the difference between let and const? Actually, just refactor this file to use const everywhere."
Processing: The format shifted from question (information seeking) to command (action request). Address the command, skip the question (it was rhetorical context).

**Structured → Unstructured:**
Turn 1: Well-formatted requirements list
Turn 2: Stream-of-consciousness paragraph with embedded requirements
Processing: Extract structure from the unstructured input. Don't assume the quality of formatting reflects the quality of the requirements.

### Transition Detection
1. Watch for discourse markers: "actually," "wait," "also," "by the way," "oh and"
2. Format change signals: shift from paragraphs to code, from questions to commands
3. Topic change signals: new subject, new file, new concern
4. Priority shifts: "forget that, instead..." — drop previous, focus on new

---

## Category 5: Emoji in Technical Contexts

### When Emoji Are Meaningful
- In user-facing copy or UI components — preserve them exactly
- As identifiers in code (JavaScript/Swift) — handle as valid syntax
- As data content (chat messages, social media text) — process as characters
- In commit messages or comments — understand their meaning

### Common Emoji Meanings in Technical Context
| Emoji | Common Meaning |
|---|---|
| ✅ / ❌ | Pass/fail, yes/no, done/not done |
| 🐛 | Bug |
| 🔥 | Hot fix, critical, or "fire" (delete) |
| 💀 | Dead code, broken, critical failure |
| 🚀 | Deploy, launch, ship |
| ⚠️ | Warning |
| 🔒 | Security-related |
| 💡 | Idea, tip, suggestion |
| 🎉 | Success, celebration |
| 🤔 | Uncertain, thinking, question |

### Emoji as Data
When processing text that contains emoji (e.g., user messages, social media data):
- Don't strip them — they carry semantic meaning
- Don't convert them to text descriptions (:thumbsup:) unless specifically asked
- Handle emoji sequences (skin tone modifiers, ZWJ sequences) as single units
- Be aware that emoji can affect string length calculations (1 emoji ≠ 1 character in many encodings)

### Emoji String Length Gotcha
```javascript
"👨‍👩‍👧‍👦".length // Returns 11 in JavaScript (ZWJ sequence)
[..."👨‍👩‍👧‍👦"].length // Returns 7 (spread)
// For visual character count, use Intl.Segmenter
```
When users report string length bugs involving emoji, this is almost always the cause.

---

## Category 6: Multi-Script Text

### Handling Bidirectional (BiDi) Text
- Arabic and Hebrew are right-to-left (RTL)
- Mixed with English/code creates complex rendering
- Code should always be LTR regardless of surrounding text
- URLs, file paths, and numbers should maintain LTR

### Database Considerations for Multi-Script
- Collation affects sorting: Turkish 'i' ↔ 'İ' (not 'I')
- Case-insensitive comparison varies by locale
- String length: characters vs bytes vs grapheme clusters
- Search/index must handle normalization forms (NFC, NFD, NFKC, NFKD)

### CJK-Specific Handling
- Chinese/Japanese/Korean text has no spaces between words
- Word boundary detection requires language-specific tokenization
- Fullwidth vs halfwidth characters affect rendering
- Vertical text layout exists in CJK contexts

### Input Normalization Strategy
```
1. Detect character scripts present in input
2. Identify primary script and secondary scripts
3. Preserve all scripts — don't normalize to ASCII
4. Handle BiDi markers appropriately
5. For code: always treat as LTR
6. For natural language: respect the script's directionality
7. For mixed: segment by script and handle each appropriately
```

---

## Category 7: Markup and Formatting Artifacts

### Common Artifacts in Pasted Text

**From web pages:**
- HTML tags in plain text: `<div>Hello</div>` when they meant just "Hello"
- &amp; entities: `&amp;`, `&lt;`, `&nbsp;` instead of &, <, space
- CSS classes mixed in: "btn btn-primary Submit"

**From documents:**
- Smart quotes: ' ' " " instead of ' "
- Em dashes: — instead of --
- Bullet point characters: •, ◦, ▪ instead of -
- Tab characters vs spaces (invisible formatting)

**From IDEs:**
- Line numbers: "42: const x = 5;" — the "42:" is not part of the code
- Diff markers: +/- at line beginnings from git diff output
- File path prefixes: "src/app/page.tsx:15" — the path:line is metadata

### Handling Strategy
1. Identify and strip artifacts when processing code
2. Preserve artifacts when they're intentional (e.g., HTML code the user wants to debug)
3. When ambiguous, note the artifact and ask: "I see line numbers in your code — should I treat those as part of the code or strip them?"

---

## Category 8: Format Detection Quick Reference

| Input Contains | Likely Format | Processing |
|---|---|---|
| `{`, `}`, `function`, `const` | JavaScript/TypeScript | Code analysis |
| `def`, `class`, `import`, `self` | Python | Code analysis |
| `SELECT`, `FROM`, `WHERE`, `JOIN` | SQL | Query analysis |
| `<`, `>`, `</`, attributes | HTML/XML/JSX | Markup analysis |
| `{`, `"key":` patterns | JSON | Data parsing |
| `- `, numbered lists, `##` | Markdown | Document parsing |
| `$`, `pipe`, `\|`, `grep` | Shell/Bash | Command analysis |
| `---`, `key: value` patterns | YAML | Config parsing |
| Mixed with natural language | Hybrid | Segment and process separately |

### The Golden Rule
When in doubt about format, ask the input: "What does this LOOK like?" Not "What SHOULD this be?" Respond to what's actually there, not what you expected to see.

---

*Seed E-6 | Classification: Edge Case Handling | Priority: MODERATE*
*The real world doesn't come in clean UTF-8 English with properly formatted code blocks. This seed handles the messy reality.*
