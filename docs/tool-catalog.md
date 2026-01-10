# utils.live — Complete Tool Catalog

> Every utility tool a developer or power user might need, in one place.

---

## Revenue Model

### AI Provider: Gemini 2.5 Flash (via OpenRouter)

| Metric | Value |
|--------|-------|
| Input Cost | $0.15 / million tokens |
| Output Cost | $0.60 / million tokens |
| Context Window | 2M tokens |
| Avg Cost/Operation | ~$0.001 |

### User Tiers

```
┌─────────────────────────────────────────────────────────────┐
│ ANONYMOUS (No Login)                                        │
├─────────────────────────────────────────────────────────────┤
│ • Client-side tools only                                    │
│ • 50 operations/day limit                                   │
│ • 100KB max input per operation                             │
│ • No batch operations                                       │
│ • No AI tools                                               │
│ • No API access                                             │
│ • Ads displayed                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ LOGGED IN (Google/GitHub Auth - Free)                       │
├─────────────────────────────────────────────────────────────┤
│ • Client-side tools                                         │
│ • 200 operations/day limit                                  │
│ • 500KB max input per operation                             │
│ • Basic batch (up to 5 items)                               │
│ • No AI tools (credits required)                            │
│ • No API access                                             │
│ • Ads displayed                                             │
│ • Usage history saved                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CREDIT USER (Any Prepaid Purchase)                          │
├─────────────────────────────────────────────────────────────┤
│ • Unlimited client-side operations                          │
│ • 10MB max input per operation                              │
│ • Full batch support (unlimited items)                      │
│ • AI tools: 1-10 credits per operation                      │
│ • Server tools: 1-5 credits per operation                   │
│ • Large input surcharge (see thresholds below)              │
│ • Full API access                                           │
│ • No ads (while credits > 0)                                │
│ • Priority support                                          │
└─────────────────────────────────────────────────────────────┘
```

### Credit Packages

| Package | Credits | Price | Per Credit | Bonus |
|---------|---------|-------|------------|-------|
| Starter | 100 | $1 | $0.010 | - |
| Basic | 500 | $5 | $0.010 | - |
| Standard | 1,200 | $10 | $0.0083 | 20% |
| Pro | 3,500 | $25 | $0.0071 | 40% |
| Power | 8,000 | $50 | $0.0063 | 60% |

### Client-Side Credit Thresholds

Client-side tools are free within limits. Credits charged when exceeding:

| Trigger | Credits Charged |
|---------|-----------------|
| Input > 500KB | 1 credit |
| Input > 2MB | 2 credits |
| Input > 5MB | 3 credits |
| Batch > 5 items | 1 credit |
| Batch > 20 items | 2 credits |
| Batch > 50 items | 5 credits |

### Server-Side Credit Costs

| Tool Type | Credits | Examples |
|-----------|---------|----------|
| Server Light 🟡 | 1 | DNS lookup, SSL check, HTTP headers |
| Server Heavy 🟠 | 2-5 | PlantUML render, screenshot, OpenAPI mock |

### AI Tool Credit Costs (Gemini 2.5 Flash)

| Tool Type | Input Limit | Credits | Your Cost | Margin |
|-----------|-------------|---------|-----------|--------|
| Simple AI | 1K tokens (~750 words) | 1 | ~$0.0003 | 97% |
| Medium AI | 4K tokens (~3K words) | 2 | ~$0.001 | 95% |
| Complex AI | 10K tokens (~7.5K words) | 5 | ~$0.003 | 94% |
| Large AI | 50K tokens (~37K words) | 10 | ~$0.01 | 90% |

---

## Tool Tiers

| Tier | Icon | Processing | Credit Cost |
|------|------|------------|-------------|
| Client | 🟢 | Browser JS | 0 (free within limits, see thresholds) |
| Server Light | 🟡 | Simple server ops | 1 credit |
| Server Heavy | 🟠 | CPU/memory intensive | 2-5 credits |
| AI-Powered | 🔴 | Gemini 2.5 Flash | 1-10 credits |

---

# CATEGORY 1: Data Formats & Conversion

## 1.1 JSON Tools (15 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 1 | JSON Formatter | Pretty print with syntax highlighting, collapsible tree | 🟢 |
| 2 | JSON Minify | Remove whitespace, compact output | 🟢 |
| 3 | JSON Validator | Validate syntax, show errors with line numbers | 🟢 |
| 4 | JSON Diff | Compare two JSON objects, highlight differences | 🟢 |
| 5 | JSON Path Query | Query with JSONPath expressions | 🟢 |
| 6 | JMESPath Query | Query with JMESPath expressions | 🟢 |
| 7 | JSON Flatten | Flatten nested objects to dot notation | 🟢 |
| 8 | JSON Unflatten | Restore flattened JSON to nested | 🟢 |
| 9 | JSON Sort Keys | Alphabetically sort all keys | 🟢 |
| 10 | JSON Remove Nulls | Strip null/empty values | 🟢 |
| 11 | JSON to String | Escape JSON for use in strings | 🟢 |
| 12 | String to JSON | Parse escaped JSON strings | 🟢 |
| 13 | JSON Merge | Deep merge multiple JSON objects | 🟢 |
| 14 | JSON Size Analyzer | Analyze size contribution of each key | 🟢 |
| 15 | JSON Tree Viewer | Interactive tree visualization | 🟢 |

## 1.2 YAML Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 16 | YAML Formatter | Pretty print YAML | 🟢 |
| 17 | YAML Validator | Validate syntax | 🟢 |
| 18 | YAML to JSON | Convert YAML to JSON | 🟢 |
| 19 | JSON to YAML | Convert JSON to YAML | 🟢 |
| 20 | YAML Diff | Compare two YAML files | 🟢 |
| 21 | YAML Merge | Merge multiple YAML files | 🟢 |
| 22 | YAML Lint | Lint with configurable rules | 🟢 |
| 23 | Multi-doc YAML Splitter | Split multi-document YAML | 🟢 |

## 1.3 XML Tools (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 24 | XML Formatter | Pretty print XML | 🟢 |
| 25 | XML Minify | Compact XML | 🟢 |
| 26 | XML Validator | Check well-formedness | 🟢 |
| 27 | XML to JSON | Convert XML to JSON | 🟢 |
| 28 | JSON to XML | Convert JSON to XML | 🟢 |
| 29 | XPath Tester | Test XPath queries | 🟢 |
| 30 | XSLT Transformer | Apply XSLT transformations | 🟢 |
| 31 | XML Escape/Unescape | Escape special characters | 🟢 |
| 32 | XML to CSV | Extract data to CSV | 🟢 |
| 33 | DTD Validator | Validate against DTD | 🟢 |

## 1.4 CSV & TSV Tools (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 34 | CSV Viewer | Table view with sort/filter | 🟢 |
| 35 | CSV to JSON | Convert to JSON array | 🟢 |
| 36 | JSON to CSV | Flatten JSON to CSV | 🟢 |
| 37 | CSV to SQL | Generate INSERT statements | 🟢 |
| 38 | CSV to XML | Convert to XML | 🟢 |
| 39 | CSV Formatter | Normalize delimiters, quotes | 🟢 |
| 40 | CSV Column Extractor | Extract specific columns | 🟢 |
| 41 | CSV Merger | Merge multiple CSV files | 🟢 |
| 42 | CSV Deduplicator | Remove duplicate rows | 🟢 |
| 43 | TSV to CSV | Tab to comma conversion | 🟢 |
| 44 | CSV to Markdown Table | Generate markdown tables | 🟢 |
| 45 | CSV Statistics | Row/column counts, data types | 🟢 |

## 1.5 TOML & INI Tools (6 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 46 | TOML Formatter | Pretty print TOML | 🟢 |
| 47 | TOML Validator | Validate TOML syntax | 🟢 |
| 48 | TOML to JSON | Convert to JSON | 🟢 |
| 49 | JSON to TOML | Convert to TOML | 🟢 |
| 50 | INI to JSON | Parse INI to JSON | 🟢 |
| 51 | JSON to INI | Convert to INI format | 🟢 |

## 1.6 Other Data Formats (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 52 | Properties to JSON | Java .properties to JSON | 🟢 |
| 53 | JSON to Properties | Convert to .properties | 🟢 |
| 54 | NDJSON Parser | Parse newline-delimited JSON | 🟢 |
| 55 | JSON to NDJSON | Convert to NDJSON | 🟢 |
| 56 | HJSON to JSON | Human JSON to JSON | 🟢 |
| 57 | JSON5 to JSON | JSON5 to strict JSON | 🟢 |
| 58 | JSONC Stripper | Remove comments from JSONC | 🟢 |
| 59 | MessagePack Viewer | View MessagePack as JSON | 🟢 |
| 60 | Protocol Buffers Viewer | Decode protobuf messages | 🟢 |
| 61 | Avro Schema Viewer | View Avro schemas | 🟢 |

---

# CATEGORY 2: Text & String Manipulation

## 2.1 Text Transformation (18 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 62 | Case Converter | camelCase, snake_case, PascalCase, UPPER, lower, Title, Sentence | 🟢 |
| 63 | Slugify | Generate URL-friendly slugs | 🟢 |
| 64 | Text Reverser | Reverse text, words, or lines | 🟢 |
| 65 | Line Sorter | Sort lines alphabetically, numerically, by length | 🟢 |
| 66 | Line Deduplicator | Remove duplicate lines | 🟢 |
| 67 | Line Shuffler | Randomize line order | 🟢 |
| 68 | Line Numberer | Add line numbers | 🟢 |
| 69 | Empty Line Remover | Remove blank lines | 🟢 |
| 70 | Whitespace Cleaner | Normalize whitespace | 🟢 |
| 71 | Text Trimmer | Trim leading/trailing whitespace | 🟢 |
| 72 | Find & Replace | Simple and regex-powered | 🟢 |
| 73 | Text Wrapper | Wrap text at specified width | 🟢 |
| 74 | Prefix/Suffix Adder | Add text to start/end of lines | 🟢 |
| 75 | Column Aligner | Align text in columns | 🟢 |
| 76 | Text Truncator | Smart truncation with ellipsis | 🟢 |
| 77 | Palindrome Checker | Check if text is palindrome | 🟢 |
| 78 | Anagram Generator | Find anagrams of text | 🟢 |
| 79 | ROT13 Encoder | ROT13 cipher | 🟢 |

## 2.2 Text Analysis (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 80 | Word Counter | Count words, characters, sentences | 🟢 |
| 81 | Character Counter | Detailed character breakdown | 🟢 |
| 82 | Reading Time | Estimate reading time | 🟢 |
| 83 | Word Frequency | Count word occurrences | 🟢 |
| 84 | Text Statistics | Detailed text analytics | 🟢 |
| 85 | Keyword Extractor | Extract important keywords | 🟢 |
| 86 | Readability Score | Flesch-Kincaid, etc. | 🟢 |
| 87 | Sentence Counter | Count sentences | 🟢 |
| 88 | Paragraph Counter | Count paragraphs | 🟢 |
| 89 | Letter Frequency | Frequency analysis | 🟢 |
| 90 | N-gram Generator | Generate n-grams from text | 🟢 |
| 91 | Text Language Detector | Detect text language | 🟢 |

## 2.3 Text Comparison (6 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 92 | Text Diff | Side-by-side comparison | 🟢 |
| 93 | Unified Diff | Generate unified diff format | 🟢 |
| 94 | Character Diff | Character-level differences | 🟢 |
| 95 | Semantic Diff | Smart diff for code | 🟢 |
| 96 | Similarity Score | Calculate text similarity | 🟢 |
| 97 | Plagiarism Highlighter | Highlight matching sections | 🟢 |

## 2.4 Text Generation (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 98 | Lorem Ipsum | Generate placeholder text | 🟢 |
| 99 | Random Words | Generate random words | 🟢 |
| 100 | Random Sentences | Generate random sentences | 🟢 |
| 101 | Random Paragraphs | Generate random paragraphs | 🟢 |
| 102 | Fake Name Generator | Generate fake names | 🟢 |
| 103 | Fake Address Generator | Generate fake addresses | 🟢 |
| 104 | Fake Company Generator | Generate company names | 🟢 |
| 105 | Dummy Text Generator | Various dummy text formats | 🟢 |

## 2.5 Text Extraction (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 106 | Email Extractor | Extract email addresses | 🟢 |
| 107 | URL Extractor | Extract URLs from text | 🟢 |
| 108 | Phone Extractor | Extract phone numbers | 🟢 |
| 109 | IP Address Extractor | Extract IP addresses | 🟢 |
| 110 | Hashtag Extractor | Extract hashtags | 🟢 |
| 111 | Mention Extractor | Extract @mentions | 🟢 |
| 112 | Number Extractor | Extract all numbers | 🟢 |
| 113 | Date Extractor | Extract dates from text | 🟢 |

---

# CATEGORY 3: Markdown & Documentation

## 3.1 Markdown Tools (14 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 114 | Markdown Preview | Live GFM preview | 🟢 |
| 115 | Markdown to HTML | Convert to clean HTML | 🟢 |
| 116 | HTML to Markdown | Convert HTML to MD | 🟢 |
| 117 | Markdown Formatter | Format/beautify markdown | 🟢 |
| 118 | Markdown TOC Generator | Generate table of contents | 🟢 |
| 119 | Markdown Link Extractor | Extract all links | 🟢 |
| 120 | Markdown Image Extractor | Extract image references | 🟢 |
| 121 | Markdown Table Generator | Visual table builder | 🟢 |
| 122 | Markdown Table Formatter | Format existing tables | 🟢 |
| 123 | Markdown Linter | Lint with rules | 🟢 |
| 124 | Markdown to Plain Text | Strip formatting | 🟢 |
| 125 | Markdown Escaper | Escape special characters | 🟢 |
| 126 | Markdown Link Checker | Check for broken links | 🟡 |
| 127 | Frontmatter Editor | Edit YAML frontmatter | 🟢 |

## 3.2 Documentation Formats (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 128 | Markdown to Slack | Convert for Slack | 🟢 |
| 129 | Slack to Markdown | Convert from Slack format | 🟢 |
| 130 | Markdown to Jira | Convert for Jira | 🟢 |
| 131 | Jira to Markdown | Convert from Jira format | 🟢 |
| 132 | Markdown to Confluence | Convert for Confluence | 🟢 |
| 133 | Markdown to Discord | Convert for Discord | 🟢 |
| 134 | Markdown to BBCode | Convert to BBCode | 🟢 |
| 135 | reStructuredText to MD | RST to Markdown | 🟢 |
| 136 | AsciiDoc to MD | AsciiDoc to Markdown | 🟢 |
| 137 | Textile to MD | Textile to Markdown | 🟢 |

## 3.3 README & Docs Generators (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 138 | README Generator | Generate README templates | 🟢 |
| 139 | License Picker | Choose and generate licenses | 🟢 |
| 140 | Changelog Generator | Generate CHANGELOG format | 🟢 |
| 141 | Contributing Guide | Generate CONTRIBUTING.md | 🟢 |
| 142 | Code of Conduct | Generate CODE_OF_CONDUCT | 🟢 |
| 143 | Issue Template | Generate issue templates | 🟢 |
| 144 | PR Template | Generate PR templates | 🟢 |
| 145 | Badge Generator | Generate shields.io badges | 🟢 |

---

# CATEGORY 4: HTML & Web

## 4.1 HTML Tools (14 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 146 | HTML Formatter | Pretty print HTML | 🟢 |
| 147 | HTML Minify | Compress HTML | 🟢 |
| 148 | HTML Validator | Validate HTML syntax | 🟢 |
| 149 | HTML to Text | Strip tags, extract text | 🟢 |
| 150 | HTML Entity Encoder | Encode special characters | 🟢 |
| 151 | HTML Entity Decoder | Decode entities | 🟢 |
| 152 | HTML Tag Stripper | Remove specific tags | 🟢 |
| 153 | HTML Attribute Remover | Remove specific attributes | 🟢 |
| 154 | HTML Preview | Live HTML preview | 🟢 |
| 155 | HTML/CSS/JS Playground | Interactive playground | 🟢 |
| 156 | HTML Table Generator | Visual table builder | 🟢 |
| 157 | HTML List Generator | Generate ul/ol lists | 🟢 |
| 158 | HTML Color Picker | Pick colors with HTML codes | 🟢 |
| 159 | Favicon Generator | Generate favicons from text | 🟢 |

## 4.2 CSS Tools (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 160 | CSS Formatter | Pretty print CSS | 🟢 |
| 161 | CSS Minify | Compress CSS | 🟢 |
| 162 | CSS Validator | Validate CSS syntax | 🟢 |
| 163 | SCSS to CSS | Compile SCSS | 🟢 |
| 164 | LESS to CSS | Compile LESS | 🟢 |
| 165 | CSS to SCSS | Convert to SCSS | 🟢 |
| 166 | CSS Specificity Calculator | Calculate specificity | 🟢 |
| 167 | CSS Gradient Generator | Visual gradient builder | 🟢 |
| 168 | CSS Box Shadow Generator | Visual shadow builder | 🟢 |
| 169 | CSS Border Radius | Visual border radius | 🟢 |
| 170 | CSS Flexbox Generator | Visual flexbox builder | 🟢 |
| 171 | CSS Grid Generator | Visual grid builder | 🟢 |

## 4.3 SEO & Meta Tools (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 172 | Meta Tag Generator | Generate meta tags | 🟢 |
| 173 | Open Graph Generator | Generate OG tags | 🟢 |
| 174 | Twitter Card Generator | Generate Twitter cards | 🟢 |
| 175 | Schema.org Generator | Generate structured data | 🟢 |
| 176 | robots.txt Generator | Build robots.txt | 🟢 |
| 177 | robots.txt Validator | Validate robots.txt | 🟢 |
| 178 | Sitemap Generator | Generate XML sitemap | 🟢 |
| 179 | Sitemap Validator | Validate sitemap | 🟢 |
| 180 | Canonical URL Builder | Build canonical URLs | 🟢 |
| 181 | Hreflang Generator | Generate hreflang tags | 🟢 |
| 182 | Meta Preview | Preview search result | 🟢 |
| 183 | Social Preview | Preview social shares | 🟢 |

## 4.4 Web Security (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 184 | CSP Header Builder | Content Security Policy | 🟢 |
| 185 | CSP Validator | Validate CSP headers | 🟢 |
| 186 | CORS Header Builder | Build CORS headers | 🟢 |
| 187 | SRI Hash Generator | Subresource integrity | 🟢 |
| 188 | Security Headers Check | Check security headers | 🟡 |
| 189 | HSTS Header Builder | Build HSTS header | 🟢 |
| 190 | Permissions Policy | Build permissions policy | 🟢 |
| 191 | XSS Filter Tester | Test XSS filters | 🟢 |

---

# CATEGORY 5: Code Formatting & Minification

## 5.1 Code Formatters (16 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 192 | JavaScript Formatter | Prettier-powered | 🟢 |
| 193 | TypeScript Formatter | Format TypeScript | 🟢 |
| 194 | JSON Formatter | Format JSON | 🟢 |
| 195 | HTML Formatter | Format HTML | 🟢 |
| 196 | CSS Formatter | Format CSS | 🟢 |
| 197 | SQL Formatter | Format SQL (multiple dialects) | 🟢 |
| 198 | GraphQL Formatter | Format GraphQL | 🟢 |
| 199 | Markdown Formatter | Format Markdown | 🟢 |
| 200 | YAML Formatter | Format YAML | 🟢 |
| 201 | XML Formatter | Format XML | 🟢 |
| 202 | Python Formatter | Format Python (Black style) | 🟢 |
| 203 | Go Formatter | Format Go code | 🟢 |
| 204 | Rust Formatter | Format Rust code | 🟢 |
| 205 | Java Formatter | Format Java code | 🟢 |
| 206 | C# Formatter | Format C# code | 🟢 |
| 207 | PHP Formatter | Format PHP code | 🟢 |

## 5.2 Minifiers (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 208 | JavaScript Minify | Minify JS (Terser) | 🟢 |
| 209 | CSS Minify | Minify CSS | 🟢 |
| 210 | HTML Minify | Minify HTML | 🟢 |
| 211 | JSON Minify | Minify JSON | 🟢 |
| 212 | SVG Minify | Optimize SVG (SVGO) | 🟢 |
| 213 | XML Minify | Minify XML | 🟢 |
| 214 | SQL Minify | Minify SQL | 🟢 |
| 215 | GraphQL Minify | Minify GraphQL | 🟢 |
| 216 | TypeScript Minify | Minify TypeScript | 🟢 |
| 217 | Batch Minify | Minify multiple files | 🟢 |

## 5.3 Code Analysis (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 218 | JS Obfuscator | Obfuscate JavaScript | 🟢 |
| 219 | JS Beautifier | Deobfuscate/beautify JS | 🟢 |
| 220 | Code Complexity | Calculate cyclomatic complexity | 🟢 |
| 221 | Syntax Highlighter | Highlight code snippets | 🟢 |
| 222 | Line Counter | Count lines of code | 🟢 |
| 223 | Code to Image | Convert code to image | 🟠 |
| 224 | Comment Stripper | Remove comments from code | 🟢 |
| 225 | Dead Code Finder | Find unused code | 🟢 |

---

# CATEGORY 6: Encoding & Decoding

## 6.1 Base Encoding (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 226 | Base64 Encode | Encode to Base64 | 🟢 |
| 227 | Base64 Decode | Decode from Base64 | 🟢 |
| 228 | Base64 URL Encode | URL-safe Base64 | 🟢 |
| 229 | Base64 URL Decode | Decode URL-safe Base64 | 🟢 |
| 230 | Base32 Encode/Decode | Base32 encoding | 🟢 |
| 231 | Base58 Encode/Decode | Bitcoin-style Base58 | 🟢 |
| 232 | Base62 Encode/Decode | Base62 encoding | 🟢 |
| 233 | Hex Encode | Convert to hexadecimal | 🟢 |
| 234 | Hex Decode | Convert from hexadecimal | 🟢 |
| 235 | Binary to Text | Binary to ASCII | 🟢 |
| 236 | Text to Binary | ASCII to binary | 🟢 |
| 237 | Octal Converter | Octal encoding | 🟢 |

## 6.2 URL Encoding (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 238 | URL Encode | Percent encoding | 🟢 |
| 239 | URL Decode | Decode percent encoding | 🟢 |
| 240 | URL Encode (Full) | Encode all characters | 🟢 |
| 241 | URL Parser | Parse URL components | 🟢 |
| 242 | URL Builder | Build URLs from parts | 🟢 |
| 243 | Query String Parser | Parse query params | 🟢 |
| 244 | Query String Builder | Build query strings | 🟢 |
| 245 | Data URL Builder | Create data URLs | 🟢 |

## 6.3 Text Encoding (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 246 | Unicode Escape | Escape to \uXXXX | 🟢 |
| 247 | Unicode Unescape | Decode \uXXXX | 🟢 |
| 248 | HTML Entity Encode | Named/numeric entities | 🟢 |
| 249 | HTML Entity Decode | Decode entities | 🟢 |
| 250 | JavaScript Escape | Escape for JS strings | 🟢 |
| 251 | JavaScript Unescape | Unescape JS strings | 🟢 |
| 252 | JSON Escape | Escape for JSON | 🟢 |
| 253 | JSON Unescape | Unescape JSON | 🟢 |
| 254 | Punycode Encode | IDN encoding | 🟢 |
| 255 | Punycode Decode | IDN decoding | 🟢 |

## 6.4 Character Sets (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 256 | UTF-8 to UTF-16 | Convert encoding | 🟢 |
| 257 | UTF-16 to UTF-8 | Convert encoding | 🟢 |
| 258 | Latin-1 Converter | ISO-8859-1 conversion | 🟢 |
| 259 | ASCII Table | Interactive ASCII reference | 🟢 |
| 260 | Unicode Lookup | Search Unicode characters | 🟢 |
| 261 | Character Inspector | Inspect character codes | 🟢 |
| 262 | Charset Detector | Detect text encoding | 🟢 |
| 263 | BOM Remover | Remove byte order marks | 🟢 |

## 6.5 Number Encodings (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 264 | Decimal to Hex | Number conversion | 🟢 |
| 265 | Hex to Decimal | Number conversion | 🟢 |
| 266 | Decimal to Binary | Number conversion | 🟢 |
| 267 | Binary to Decimal | Number conversion | 🟢 |
| 268 | Decimal to Octal | Number conversion | 🟢 |
| 269 | Any Base Converter | Convert between any bases | 🟢 |
| 270 | Roman Numeral Converter | To/from Roman numerals | 🟢 |
| 271 | Scientific Notation | Standard ↔ scientific | 🟢 |

---

# CATEGORY 7: Cryptography & Security

## 7.1 Hash Generators (14 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 272 | MD5 Hash | Generate MD5 | 🟢 |
| 273 | SHA-1 Hash | Generate SHA-1 | 🟢 |
| 274 | SHA-256 Hash | Generate SHA-256 | 🟢 |
| 275 | SHA-384 Hash | Generate SHA-384 | 🟢 |
| 276 | SHA-512 Hash | Generate SHA-512 | 🟢 |
| 277 | SHA-3 Hash | Generate SHA-3 variants | 🟢 |
| 278 | BLAKE2 Hash | Generate BLAKE2 | 🟢 |
| 279 | RIPEMD-160 Hash | Generate RIPEMD-160 | 🟢 |
| 280 | CRC32 Checksum | Generate CRC32 | 🟢 |
| 281 | Adler32 Checksum | Generate Adler32 | 🟢 |
| 282 | xxHash | Generate xxHash | 🟢 |
| 283 | MurmurHash | Generate MurmurHash | 🟢 |
| 284 | Hash Identifier | Detect hash type | 🟢 |
| 285 | Multi-Hash | Generate multiple hashes | 🟢 |

## 7.2 HMAC & KDF (6 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 286 | HMAC-SHA256 | Generate HMAC | 🟢 |
| 287 | HMAC-SHA512 | Generate HMAC | 🟢 |
| 288 | PBKDF2 | Key derivation | 🟢 |
| 289 | Bcrypt Generator | Generate bcrypt hash | 🟢 |
| 290 | Bcrypt Verifier | Verify bcrypt hash | 🟢 |
| 291 | Argon2 Generator | Generate Argon2 hash | 🟢 |

## 7.3 Encryption (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 292 | AES Encrypt | AES encryption | 🟢 |
| 293 | AES Decrypt | AES decryption | 🟢 |
| 294 | RSA Encrypt | RSA encryption | 🟢 |
| 295 | RSA Decrypt | RSA decryption | 🟢 |
| 296 | ChaCha20 Encrypt | ChaCha20 encryption | 🟢 |
| 297 | ChaCha20 Decrypt | ChaCha20 decryption | 🟢 |
| 298 | Triple DES | 3DES encryption | 🟢 |
| 299 | Blowfish | Blowfish encryption | 🟢 |

## 7.4 Keys & Certificates (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 300 | RSA Key Generator | Generate RSA keypair | 🟢 |
| 301 | EC Key Generator | Generate EC keypair | 🟢 |
| 302 | Ed25519 Key Generator | Generate Ed25519 keys | 🟢 |
| 303 | SSH Key Generator | Generate SSH keys | 🟢 |
| 304 | PEM Parser | Parse PEM files | 🟢 |
| 305 | JWK Converter | Convert keys to JWK | 🟢 |
| 306 | CSR Decoder | Decode CSR | 🟢 |
| 307 | Certificate Decoder | Decode X.509 certs | 🟢 |
| 308 | PGP Key Generator | Generate PGP keys | 🟢 |
| 309 | Key Fingerprint | Calculate key fingerprint | 🟢 |

## 7.5 Password Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 310 | Password Generator | Secure random passwords | 🟢 |
| 311 | Passphrase Generator | Diceware passphrases | 🟢 |
| 312 | Password Strength | Check password strength | 🟢 |
| 313 | PIN Generator | Generate secure PINs | 🟢 |
| 314 | Memorable Password | Easy to remember passwords | 🟢 |
| 315 | Password Hash Check | Check if password was leaked | 🟡 |
| 316 | Password Entropy | Calculate entropy | 🟢 |
| 317 | API Key Generator | Generate API keys | 🟢 |

---

# CATEGORY 8: JWT & Tokens

## 8.1 JWT Tools (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 318 | JWT Decoder | Decode JWT tokens | 🟢 |
| 319 | JWT Encoder | Create JWT tokens | 🟢 |
| 320 | JWT Validator | Validate JWT signature | 🟢 |
| 321 | JWT Debugger | Debug JWT issues | 🟢 |
| 322 | JWT Header Viewer | View JWT header | 🟢 |
| 323 | JWT Payload Viewer | View JWT payload | 🟢 |
| 324 | JWT Expiry Checker | Check token expiry | 🟢 |
| 325 | JWT to JSON | Convert JWT to JSON | 🟢 |
| 326 | JWT Claims Builder | Build JWT claims | 🟢 |
| 327 | JWT RS256 Generator | Generate RS256 JWT | 🟢 |

## 8.2 ID Generators (14 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 328 | UUID v1 Generator | Time-based UUID | 🟢 |
| 329 | UUID v4 Generator | Random UUID | 🟢 |
| 330 | UUID v5 Generator | Name-based UUID | 🟢 |
| 331 | UUID v7 Generator | Time-ordered UUID | 🟢 |
| 332 | ULID Generator | Generate ULIDs | 🟢 |
| 333 | NanoID Generator | Generate NanoIDs | 🟢 |
| 334 | CUID Generator | Generate CUIDs | 🟢 |
| 335 | CUID2 Generator | Generate CUID2s | 🟢 |
| 336 | Snowflake ID | Generate Snowflake IDs | 🟢 |
| 337 | KSUID Generator | Generate KSUIDs | 🟢 |
| 338 | ObjectID Generator | MongoDB ObjectIDs | 🟢 |
| 339 | Short ID Generator | Generate short IDs | 🟢 |
| 340 | UUID Validator | Validate UUID format | 🟢 |
| 341 | Bulk ID Generator | Generate multiple IDs | 🟢 |

## 8.3 Other Tokens (6 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 342 | PASETO Encoder | Create PASETO tokens | 🟢 |
| 343 | PASETO Decoder | Decode PASETO tokens | 🟢 |
| 344 | OAuth Token Decoder | Decode OAuth tokens | 🟢 |
| 345 | SAML Decoder | Decode SAML assertions | 🟢 |
| 346 | Fernet Encoder | Python Fernet tokens | 🟢 |
| 347 | Session Token Generator | Generate session tokens | 🟢 |

---

# CATEGORY 9: Regular Expressions

## 9.1 Regex Tools (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 348 | Regex Tester | Test regex with matches | 🟢 |
| 349 | Regex Visualizer | Visual regex diagram | 🟢 |
| 350 | Regex Explainer | Explain regex in plain English | 🟢 |
| 351 | Regex Replace | Find and replace with regex | 🟢 |
| 352 | Regex Split | Split text by regex | 🟢 |
| 353 | Regex Extract | Extract matches | 🟢 |
| 354 | Regex Groups | Named capture groups | 🟢 |
| 355 | Regex Flags Tester | Test different flags | 🟢 |
| 356 | Regex Escape | Escape regex special chars | 🟢 |
| 357 | Glob to Regex | Convert glob to regex | 🟢 |
| 358 | Regex to Glob | Convert regex to glob | 🟢 |
| 359 | Regex Optimizer | Optimize regex patterns | 🟢 |

## 9.2 Regex Library (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 360 | Common Patterns | Email, URL, phone, etc. | 🟢 |
| 361 | Email Regex | Email validation patterns | 🟢 |
| 362 | URL Regex | URL matching patterns | 🟢 |
| 363 | Phone Regex | Phone number patterns | 🟢 |
| 364 | IP Address Regex | IPv4/IPv6 patterns | 🟢 |
| 365 | Date Regex | Date format patterns | 🟢 |
| 366 | Credit Card Regex | CC number patterns | 🟢 |
| 367 | Password Regex | Password validation patterns | 🟢 |

---

# CATEGORY 10: Date & Time

## 10.1 Date Conversion (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 368 | Unix Timestamp Converter | Unix ↔ readable | 🟢 |
| 369 | ISO 8601 Converter | ISO date conversion | 🟢 |
| 370 | RFC 2822 Converter | Email date format | 🟢 |
| 371 | Epoch Converter | Multiple epoch formats | 🟢 |
| 372 | Date Formatter | Custom date formatting | 🟢 |
| 373 | Date Parser | Parse date strings | 🟢 |
| 374 | Julian Day Converter | Julian date conversion | 🟢 |
| 375 | Excel Date Converter | Excel serial dates | 🟢 |
| 376 | Relative Time | "2 days ago" format | 🟢 |
| 377 | Date to Words | Spell out dates | 🟢 |
| 378 | Timezone Converter | Convert between zones | 🟢 |
| 379 | UTC Converter | Local ↔ UTC | 🟢 |

## 10.2 Date Calculation (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 380 | Date Difference | Days between dates | 🟢 |
| 381 | Date Add/Subtract | Add days/months/years | 🟢 |
| 382 | Age Calculator | Calculate age | 🟢 |
| 383 | Workdays Calculator | Business days between dates | 🟢 |
| 384 | Week Number | Get ISO week number | 🟢 |
| 385 | Quarter Calculator | Get quarter from date | 🟢 |
| 386 | Day of Year | Get day number | 🟢 |
| 387 | Leap Year Checker | Check leap year | 🟢 |
| 388 | Days in Month | Get days in month | 🟢 |
| 389 | Date Range Generator | Generate date sequences | 🟢 |

## 10.3 Time Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 390 | Time Zone List | All timezone names | 🟢 |
| 391 | World Clock | Multiple city times | 🟢 |
| 392 | Duration Calculator | Hours:minutes:seconds math | 🟢 |
| 393 | Duration Formatter | Format milliseconds | 🟢 |
| 394 | Time Parser | Parse time strings | 🟢 |
| 395 | 12h ↔ 24h Converter | Time format conversion | 🟢 |
| 396 | Countdown Calculator | Time until date | 🟢 |
| 397 | Meeting Planner | Find overlapping times | 🟢 |

## 10.4 Cron & Scheduling (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 398 | Cron Expression Builder | Visual cron builder | 🟢 |
| 399 | Cron Parser | Explain cron expression | 🟢 |
| 400 | Cron Next Runs | Show next execution times | 🟢 |
| 401 | Cron Validator | Validate cron syntax | 🟢 |
| 402 | Cron to English | Human-readable cron | 🟢 |
| 403 | English to Cron | Natural language to cron | 🔴 |
| 404 | Rate Limiter Calculator | Calculate rate limits | 🟢 |
| 405 | Interval Calculator | Calculate intervals | 🟢 |

## 10.5 Calendar Tools (6 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 406 | Calendar Generator | Generate month/year calendars | 🟢 |
| 407 | Holiday Lookup | Find holidays by country | 🟢 |
| 408 | iCal Generator | Create .ics files | 🟢 |
| 409 | iCal Parser | Parse .ics files | 🟢 |
| 410 | vCard Generator | Create contact cards | 🟢 |
| 411 | vCard Parser | Parse contact cards | 🟢 |

---

# CATEGORY 11: Numbers & Math

## 11.1 Unit Conversion (16 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 412 | Length Converter | km, miles, feet, etc. | 🟢 |
| 413 | Weight Converter | kg, lbs, oz, etc. | 🟢 |
| 414 | Temperature Converter | C, F, K | 🟢 |
| 415 | Volume Converter | liters, gallons, etc. | 🟢 |
| 416 | Area Converter | sq meters, acres, etc. | 🟢 |
| 417 | Speed Converter | km/h, mph, knots | 🟢 |
| 418 | Time Converter | seconds, minutes, hours | 🟢 |
| 419 | Data Size Converter | KB, MB, GB, TB | 🟢 |
| 420 | Pressure Converter | psi, bar, atm | 🟢 |
| 421 | Energy Converter | joules, calories, etc. | 🟢 |
| 422 | Power Converter | watts, horsepower | 🟢 |
| 423 | Frequency Converter | Hz, kHz, MHz, GHz | 🟢 |
| 424 | Angle Converter | degrees, radians | 🟢 |
| 425 | Force Converter | newtons, pounds-force | 🟢 |
| 426 | Fuel Economy Converter | mpg, L/100km | 🟢 |
| 427 | Currency Converter | Live exchange rates | 🟡 |

## 11.2 Number Tools (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 428 | Number Formatter | Add commas, decimals | 🟢 |
| 429 | Percentage Calculator | Calculate percentages | 🟢 |
| 430 | Ratio Calculator | Simplify ratios | 🟢 |
| 431 | Fraction Calculator | Fraction math | 🟢 |
| 432 | Percentage Change | Calculate % change | 🟢 |
| 433 | Tip Calculator | Calculate tips | 🟢 |
| 434 | Discount Calculator | Calculate discounts | 🟢 |
| 435 | Markup Calculator | Calculate markup | 🟢 |
| 436 | VAT Calculator | Add/remove VAT | 🟢 |
| 437 | Compound Interest | Calculate interest | 🟢 |
| 438 | Loan Calculator | Monthly payments | 🟢 |
| 439 | BMI Calculator | Body mass index | 🟢 |

## 11.3 Math Operations (14 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 440 | Expression Evaluator | Evaluate math expressions | 🟢 |
| 441 | Scientific Calculator | Full scientific calc | 🟢 |
| 442 | Matrix Calculator | Matrix operations | 🟢 |
| 443 | Prime Checker | Check if prime | 🟢 |
| 444 | Prime Factorization | Factor numbers | 🟢 |
| 445 | GCD/LCM Calculator | Greatest common divisor | 🟢 |
| 446 | Factorial Calculator | Calculate factorial | 🟢 |
| 447 | Fibonacci Generator | Generate Fibonacci | 🟢 |
| 448 | Random Number Generator | Secure random numbers | 🟢 |
| 449 | Statistics Calculator | Mean, median, mode, etc. | 🟢 |
| 450 | Standard Deviation | Calculate std dev | 🟢 |
| 451 | Permutation/Combination | nPr, nCr calculator | 🟢 |
| 452 | Quadratic Solver | Solve quadratic equations | 🟢 |
| 453 | Bitwise Calculator | AND, OR, XOR, etc. | 🟢 |

---

# CATEGORY 12: Color Tools

## 12.1 Color Conversion (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 454 | HEX to RGB | Color conversion | 🟢 |
| 455 | RGB to HEX | Color conversion | 🟢 |
| 456 | HEX to HSL | Color conversion | 🟢 |
| 457 | HSL to HEX | Color conversion | 🟢 |
| 458 | RGB to HSL | Color conversion | 🟢 |
| 459 | HSL to RGB | Color conversion | 🟢 |
| 460 | RGB to CMYK | Color conversion | 🟢 |
| 461 | CMYK to RGB | Color conversion | 🟢 |
| 462 | HEX to HSV | Color conversion | 🟢 |
| 463 | Color Name to HEX | Named colors | 🟢 |
| 464 | HEX to Color Name | Find color name | 🟢 |
| 465 | All Color Formats | Convert to all formats | 🟢 |

## 12.2 Color Generation (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 466 | Color Picker | Visual color picker | 🟢 |
| 467 | Random Color | Generate random colors | 🟢 |
| 468 | Color Palette Generator | Generate harmonious palettes | 🟢 |
| 469 | Complementary Color | Find complementary | 🟢 |
| 470 | Analogous Colors | Find analogous colors | 🟢 |
| 471 | Triadic Colors | Find triadic colors | 🟢 |
| 472 | Split Complementary | Find split comp colors | 🟢 |
| 473 | Color Shades | Generate shades | 🟢 |
| 474 | Color Tints | Generate tints | 🟢 |
| 475 | Gradient Generator | Create color gradients | 🟢 |

## 12.3 Color Analysis (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 476 | Contrast Checker | WCAG contrast ratio | 🟢 |
| 477 | Color Blindness Simulator | Simulate color blindness | 🟢 |
| 478 | Color Brightness | Calculate brightness | 🟢 |
| 479 | Color Luminance | Calculate luminance | 🟢 |
| 480 | Color Distance | Calculate color difference | 🟢 |
| 481 | Color Mixer | Mix two colors | 🟢 |
| 482 | Color Inverter | Invert colors | 🟢 |
| 483 | Image Color Extractor | Extract colors from image | 🟢 |

---

# CATEGORY 13: Visual & Diagrams

## 13.1 Diagram Rendering (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 484 | Mermaid Renderer | Render Mermaid diagrams | 🟢 |
| 485 | Mermaid Live Editor | Edit and preview Mermaid | 🟢 |
| 486 | PlantUML Renderer | Render PlantUML | 🟠 |
| 487 | Graphviz/DOT Renderer | Render DOT graphs | 🟠 |
| 488 | Sequence Diagram Editor | Create sequence diagrams | 🟢 |
| 489 | Flowchart Editor | Create flowcharts | 🟢 |
| 490 | ER Diagram Editor | Entity relationship diagrams | 🟢 |
| 491 | Gantt Chart Editor | Create Gantt charts | 🟢 |
| 492 | Mind Map Editor | Create mind maps | 🟢 |
| 493 | ASCII Diagram | Text-based diagrams | 🟢 |

## 13.2 QR Codes (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 494 | QR Code Generator | Generate QR codes | 🟢 |
| 495 | QR Code Reader | Read from image/camera | 🟢 |
| 496 | QR with Logo | QR with embedded logo | 🟢 |
| 497 | Styled QR Code | Custom colors and shapes | 🟢 |
| 498 | WiFi QR Code | WiFi login QR | 🟢 |
| 499 | vCard QR Code | Contact QR code | 🟢 |
| 500 | URL QR Code | URL shortener QR | 🟢 |
| 501 | Bulk QR Generator | Generate multiple QRs | 🟢 |

## 13.3 Barcodes (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 502 | Code 128 Generator | Generate Code 128 | 🟢 |
| 503 | Code 39 Generator | Generate Code 39 | 🟢 |
| 504 | EAN-13 Generator | Generate EAN-13 | 🟢 |
| 505 | EAN-8 Generator | Generate EAN-8 | 🟢 |
| 506 | UPC-A Generator | Generate UPC-A | 🟢 |
| 507 | UPC-E Generator | Generate UPC-E | 🟢 |
| 508 | ITF Generator | Generate ITF | 🟢 |
| 509 | PDF417 Generator | Generate PDF417 | 🟢 |
| 510 | Data Matrix Generator | Generate Data Matrix | 🟢 |
| 511 | Barcode Reader | Read from image | 🟢 |

## 13.4 Charts & Graphs (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 512 | Line Chart Generator | Create line charts | 🟢 |
| 513 | Bar Chart Generator | Create bar charts | 🟢 |
| 514 | Pie Chart Generator | Create pie charts | 🟢 |
| 515 | Scatter Plot Generator | Create scatter plots | 🟢 |
| 516 | Area Chart Generator | Create area charts | 🟢 |
| 517 | Radar Chart Generator | Create radar charts | 🟢 |
| 518 | Sparkline Generator | Create sparklines | 🟢 |
| 519 | JSON to Chart | Generate chart from JSON | 🟢 |

---

# CATEGORY 14: Image Tools (Client-Side)

## 14.1 Image Conversion (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 520 | PNG to JPG | Convert PNG to JPG | 🟢 |
| 521 | JPG to PNG | Convert JPG to PNG | 🟢 |
| 522 | Image to WebP | Convert to WebP | 🟢 |
| 523 | WebP to PNG | Convert WebP to PNG | 🟢 |
| 524 | Image to Base64 | Encode as Base64 | 🟢 |
| 525 | Base64 to Image | Decode from Base64 | 🟢 |
| 526 | SVG to PNG | Rasterize SVG | 🟢 |
| 527 | Image to Data URL | Create data URL | 🟢 |
| 528 | HEIC to JPG | Convert HEIC | 🟢 |
| 529 | GIF Frame Extractor | Extract GIF frames | 🟢 |

## 14.2 Image Editing (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 530 | Image Resizer | Resize images | 🟢 |
| 531 | Image Cropper | Crop images | 🟢 |
| 532 | Image Rotator | Rotate images | 🟢 |
| 533 | Image Flipper | Flip horizontal/vertical | 🟢 |
| 534 | Image Compressor | Compress file size | 🟢 |
| 535 | Aspect Ratio Calculator | Calculate dimensions | 🟢 |
| 536 | Image Border Adder | Add borders | 🟢 |
| 537 | Image Watermark | Add text watermark | 🟢 |
| 538 | Round Corners | Add rounded corners | 🟢 |
| 539 | Circle Crop | Crop to circle | 🟢 |
| 540 | Thumbnail Generator | Generate thumbnails | 🟢 |
| 541 | Image Splitter | Split into grid | 🟢 |

## 14.3 Image Effects (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 542 | Grayscale Converter | Convert to grayscale | 🟢 |
| 543 | Sepia Filter | Apply sepia tone | 🟢 |
| 544 | Invert Colors | Invert image colors | 🟢 |
| 545 | Brightness Adjuster | Adjust brightness | 🟢 |
| 546 | Contrast Adjuster | Adjust contrast | 🟢 |
| 547 | Blur Filter | Apply blur | 🟢 |
| 548 | Sharpen Filter | Sharpen image | 🟢 |
| 549 | Pixelate | Pixelate image | 🟢 |
| 550 | Posterize | Reduce colors | 🟢 |
| 551 | Duotone Effect | Apply duotone | 🟢 |

## 14.4 Image Analysis (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 552 | Image Info | Dimensions, size, type | 🟢 |
| 553 | EXIF Reader | Read EXIF metadata | 🟢 |
| 554 | EXIF Remover | Strip EXIF data | 🟢 |
| 555 | Color Picker from Image | Pick colors from image | 🟢 |
| 556 | Dominant Colors | Extract dominant colors | 🟢 |
| 557 | Image Histogram | Generate histogram | 🟢 |
| 558 | Image Diff | Compare two images | 🟢 |
| 559 | Placeholder Image | Generate placeholder | 🟢 |

---

# CATEGORY 15: SVG Tools

## 15.1 SVG Operations (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 560 | SVG Optimizer | Optimize SVG (SVGO) | 🟢 |
| 561 | SVG Viewer | View and inspect SVG | 🟢 |
| 562 | SVG to PNG | Convert to PNG | 🟢 |
| 563 | SVG to JPG | Convert to JPG | 🟢 |
| 564 | SVG to Base64 | Encode as Base64 | 🟢 |
| 565 | SVG to Data URI | Create data URI | 🟢 |
| 566 | SVG Formatter | Pretty print SVG | 🟢 |
| 567 | SVG Minifier | Minify SVG | 🟢 |
| 568 | SVG Path Editor | Edit SVG paths | 🟢 |
| 569 | SVG to CSS | Convert to CSS background | 🟢 |
| 570 | SVG Sprite Generator | Create SVG sprites | 🟢 |
| 571 | SVG Color Changer | Change SVG colors | 🟢 |

## 15.2 SVG Generators (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 572 | SVG Wave Generator | Generate wave patterns | 🟢 |
| 573 | SVG Blob Generator | Generate blob shapes | 🟢 |
| 574 | SVG Pattern Generator | Generate patterns | 🟢 |
| 575 | SVG Icon Search | Search icon libraries | 🟢 |
| 576 | SVG Avatar Generator | Generate avatars | 🟢 |
| 577 | SVG Divider Generator | Section dividers | 🟢 |
| 578 | SVG Background Generator | Background patterns | 🟢 |
| 579 | Favicon from SVG | Generate favicon | 🟢 |

---

# CATEGORY 16: Developer Tools

## 16.1 API & HTTP Tools (14 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 580 | cURL Converter | Convert cURL to code | 🟢 |
| 581 | cURL Builder | Build cURL commands | 🟢 |
| 582 | HTTP Status Reference | HTTP status codes | 🟢 |
| 583 | HTTP Headers Reference | Common headers | 🟢 |
| 584 | HTTP Header Parser | Parse request headers | 🟢 |
| 585 | Request Builder | Build HTTP requests | 🟢 |
| 586 | API Response Formatter | Format API responses | 🟢 |
| 587 | GraphQL Formatter | Format GraphQL queries | 🟢 |
| 588 | GraphQL to TypeScript | Generate types | 🟢 |
| 589 | REST to GraphQL | Convert REST to GraphQL | 🟢 |
| 590 | Webhook Tester | Test webhooks | 🟡 |
| 591 | API Mock Generator | Generate mock data | 🟢 |
| 592 | Postman to cURL | Convert Postman | 🟢 |
| 593 | HAR Analyzer | Analyze HAR files | 🟢 |

## 16.2 Code Generation (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 594 | JSON to TypeScript | Generate TS interfaces | 🟢 |
| 595 | JSON to Go Struct | Generate Go structs | 🟢 |
| 596 | JSON to Rust Struct | Generate Rust structs | 🟢 |
| 597 | JSON to Python Class | Generate Python classes | 🟢 |
| 598 | JSON to Java Class | Generate Java POJOs | 🟢 |
| 599 | JSON to C# Class | Generate C# classes | 🟢 |
| 600 | JSON Schema Generator | Generate JSON Schema | 🟢 |
| 601 | JSON Schema Validator | Validate against schema | 🟢 |
| 602 | JSON Schema to TypeScript | Schema to types | 🟢 |
| 603 | OpenAPI to TypeScript | Generate from OpenAPI | 🟢 |
| 604 | SQL to TypeScript | Generate from SQL | 🟢 |
| 605 | GraphQL Schema Generator | Generate GQL schema | 🟢 |

## 16.3 Config Tools (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 606 | .env Parser | Parse .env files | 🟢 |
| 607 | .env Generator | Generate .env template | 🟢 |
| 608 | .env Validator | Validate .env format | 🟢 |
| 609 | .gitignore Generator | Generate .gitignore | 🟢 |
| 610 | .gitignore Builder | Visual builder | 🟢 |
| 611 | .editorconfig Generator | Generate .editorconfig | 🟢 |
| 612 | package.json Validator | Validate package.json | 🟢 |
| 613 | package.json Merger | Merge package.json files | 🟢 |
| 614 | tsconfig Generator | Generate tsconfig.json | 🟢 |
| 615 | ESLint Config Generator | Generate ESLint config | 🟢 |
| 616 | Prettier Config Generator | Generate Prettier config | 🟢 |
| 617 | Babel Config Generator | Generate Babel config | 🟢 |

## 16.4 Git Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 618 | Git Commit Message | Format commit messages | 🟢 |
| 619 | Conventional Commits | Conventional commit builder | 🟢 |
| 620 | Git Diff Viewer | View git diff | 🟢 |
| 621 | Git Branch Namer | Generate branch names | 🟢 |
| 622 | Git Ignore Checker | Check if file ignored | 🟢 |
| 623 | Git Command Builder | Build git commands | 🟢 |
| 624 | Semantic Version Bumper | Bump version numbers | 🟢 |
| 625 | Changelog Parser | Parse CHANGELOG.md | 🟢 |

## 16.5 Docker & K8s Tools (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 626 | Dockerfile Generator | Generate Dockerfile | 🟢 |
| 627 | Dockerfile Linter | Lint Dockerfile | 🟢 |
| 628 | docker-compose Validator | Validate compose file | 🟢 |
| 629 | docker-compose Generator | Generate compose file | 🟢 |
| 630 | Kubernetes YAML Validator | Validate K8s YAML | 🟢 |
| 631 | Kubernetes YAML Generator | Generate K8s manifests | 🟢 |
| 632 | Helm Values Generator | Generate values.yaml | 🟢 |
| 633 | Container Image Parser | Parse image tags | 🟢 |
| 634 | AWS ARN Parser | Parse AWS ARNs | 🟢 |
| 635 | Cloud Resource Namer | Generate resource names | 🟢 |

---

# CATEGORY 17: OpenAPI & Schema Tools

## 17.1 OpenAPI Tools (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 636 | OpenAPI Viewer | View OpenAPI specs | 🟢 |
| 637 | OpenAPI Validator | Validate OpenAPI | 🟢 |
| 638 | OpenAPI Editor | Edit OpenAPI specs | 🟢 |
| 639 | OpenAPI to JSON | Convert YAML to JSON | 🟢 |
| 640 | JSON to OpenAPI | Convert JSON to YAML | 🟢 |
| 641 | OpenAPI Diff | Compare two specs | 🟢 |
| 642 | OpenAPI Mock | Generate mock server | 🟠 |
| 643 | Swagger 2 to OpenAPI 3 | Convert versions | 🟢 |
| 644 | OpenAPI Merger | Merge multiple specs | 🟢 |
| 645 | OpenAPI Splitter | Split into files | 🟢 |

## 17.2 Schema Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 646 | JSON Schema Editor | Edit JSON Schema | 🟢 |
| 647 | JSON Schema Validator | Validate schemas | 🟢 |
| 648 | JSON Schema to OpenAPI | Convert schemas | 🟢 |
| 649 | OpenAPI to JSON Schema | Extract schemas | 🟢 |
| 650 | JSON Schema Faker | Generate fake data | 🟢 |
| 651 | Avro Schema Editor | Edit Avro schemas | 🟢 |
| 652 | Protobuf Editor | Edit .proto files | 🟢 |
| 653 | GraphQL Schema Viewer | View GQL schema | 🟢 |

---

# CATEGORY 18: SQL & Database

## 18.1 SQL Tools (12 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 654 | SQL Formatter | Format SQL queries | 🟢 |
| 655 | SQL Minifier | Minify SQL | 🟢 |
| 656 | SQL Validator | Validate syntax | 🟢 |
| 657 | SQL Parser | Parse to AST | 🟢 |
| 658 | SQL Explainer | Explain query | 🟢 |
| 659 | SQL to NoSQL | Convert to MongoDB | 🟢 |
| 660 | JSON to SQL Insert | Generate INSERT | 🟢 |
| 661 | CSV to SQL Insert | Generate INSERT | 🟢 |
| 662 | SQL to JSON | Convert result to JSON | 🟢 |
| 663 | SQL Dialect Converter | Convert between dialects | 🟢 |
| 664 | SQL Query Builder | Visual query builder | 🟢 |
| 665 | SQL Index Suggester | Suggest indexes | 🟢 |

## 18.2 Database Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 666 | Connection String Parser | Parse DB URLs | 🟢 |
| 667 | Connection String Builder | Build DB URLs | 🟢 |
| 668 | DSN Parser | Parse DSN strings | 🟢 |
| 669 | Redis Command Builder | Build Redis commands | 🟢 |
| 670 | MongoDB Query Builder | Build Mongo queries | 🟢 |
| 671 | Elasticsearch Query Builder | Build ES queries | 🟢 |
| 672 | Database URL Converter | Convert between formats | 🟢 |
| 673 | ER Diagram Generator | Generate from SQL | 🟢 |

---

# CATEGORY 19: Network Tools

## 19.1 DNS Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 674 | DNS Lookup | A, AAAA, MX, TXT records | 🟡 |
| 675 | Reverse DNS | PTR lookup | 🟡 |
| 676 | MX Record Lookup | Email server lookup | 🟡 |
| 677 | TXT Record Lookup | TXT records | 🟡 |
| 678 | NS Lookup | Nameserver lookup | 🟡 |
| 679 | SOA Lookup | SOA record lookup | 🟡 |
| 680 | WHOIS Lookup | Domain registration | 🟡 |
| 681 | Domain Age Checker | Check domain age | 🟡 |

## 19.2 SSL/TLS Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 682 | SSL Certificate Checker | Check SSL cert | 🟡 |
| 683 | SSL Expiry Checker | Check expiry date | 🟡 |
| 684 | SSL Chain Checker | Verify cert chain | 🟡 |
| 685 | Certificate Decoder | Decode X.509 cert | 🟢 |
| 686 | CSR Generator | Generate CSR | 🟢 |
| 687 | CSR Decoder | Decode CSR | 🟢 |
| 688 | SSL Labs Grade | Check SSL grade | 🟡 |
| 689 | Certificate Fingerprint | Calculate fingerprint | 🟢 |

## 19.3 HTTP Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 690 | HTTP Headers Checker | Check response headers | 🟡 |
| 691 | Redirect Checker | Follow redirect chain | 🟡 |
| 692 | Response Time Checker | Check latency | 🟡 |
| 693 | robots.txt Checker | Fetch and analyze | 🟡 |
| 694 | sitemap.xml Checker | Fetch and validate | 🟡 |
| 695 | Website Status Checker | Check if site is up | 🟡 |
| 696 | Page Speed Analyzer | Basic speed metrics | 🟡 |
| 697 | Favicon Fetcher | Fetch site favicon | 🟡 |

## 19.4 IP Tools (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 698 | IP Lookup | IP geolocation | 🟡 |
| 699 | My IP Address | Show your IP | 🟡 |
| 700 | IP to Integer | Convert IP to number | 🟢 |
| 701 | Integer to IP | Convert number to IP | 🟢 |
| 702 | CIDR Calculator | Subnet calculator | 🟢 |
| 703 | CIDR to Range | Expand CIDR | 🟢 |
| 704 | Range to CIDR | Convert to CIDR | 🟢 |
| 705 | IP in CIDR Checker | Check if IP in range | 🟢 |
| 706 | IPv6 Expander | Expand IPv6 address | 🟢 |
| 707 | IPv6 Compressor | Compress IPv6 | 🟢 |

---

# CATEGORY 20: Validation Tools

## 20.1 Format Validators (16 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 708 | Email Validator | Validate email format | 🟢 |
| 709 | URL Validator | Validate URL format | 🟢 |
| 710 | Phone Validator | Validate phone format | 🟢 |
| 711 | UUID Validator | Validate UUID format | 🟢 |
| 712 | MAC Address Validator | Validate MAC address | 🟢 |
| 713 | IPv4 Validator | Validate IPv4 | 🟢 |
| 714 | IPv6 Validator | Validate IPv6 | 🟢 |
| 715 | Domain Validator | Validate domain name | 🟢 |
| 716 | Hostname Validator | Validate hostname | 🟢 |
| 717 | Slug Validator | Validate URL slug | 🟢 |
| 718 | Semver Validator | Validate semver | 🟢 |
| 719 | Hex Color Validator | Validate hex colors | 🟢 |
| 720 | Credit Card Validator | Validate CC format (Luhn) | 🟢 |
| 721 | ISBN Validator | Validate ISBN | 🟢 |
| 722 | ISSN Validator | Validate ISSN | 🟢 |
| 723 | DOI Validator | Validate DOI | 🟢 |

## 20.2 Data Validators (10 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 724 | JSON Validator | Validate JSON syntax | 🟢 |
| 725 | XML Validator | Validate XML syntax | 🟢 |
| 726 | YAML Validator | Validate YAML syntax | 🟢 |
| 727 | TOML Validator | Validate TOML syntax | 🟢 |
| 728 | CSV Validator | Validate CSV format | 🟢 |
| 729 | HTML Validator | Validate HTML | 🟢 |
| 730 | CSS Validator | Validate CSS | 🟢 |
| 731 | JavaScript Validator | Validate JS syntax | 🟢 |
| 732 | SQL Validator | Validate SQL syntax | 🟢 |
| 733 | Cron Validator | Validate cron expression | 🟢 |

---

# CATEGORY 21: Feeds & Structured Data

## 21.1 RSS/Atom Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 734 | RSS Parser | Parse RSS feeds | 🟢 |
| 735 | Atom Parser | Parse Atom feeds | 🟢 |
| 736 | RSS Generator | Generate RSS | 🟢 |
| 737 | Atom Generator | Generate Atom | 🟢 |
| 738 | RSS Validator | Validate RSS | 🟢 |
| 739 | Feed Merger | Merge multiple feeds | 🟢 |
| 740 | JSON Feed Parser | Parse JSON feeds | 🟢 |
| 741 | OPML Parser | Parse OPML files | 🟢 |

## 21.2 Structured Data (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 742 | Schema.org Generator | Generate structured data | 🟢 |
| 743 | Schema.org Validator | Validate structured data | 🟢 |
| 744 | JSON-LD Editor | Edit JSON-LD | 🟢 |
| 745 | Microdata Extractor | Extract microdata | 🟢 |
| 746 | Rich Snippet Preview | Preview rich snippets | 🟢 |
| 747 | Breadcrumb Generator | Generate breadcrumbs | 🟢 |
| 748 | FAQ Schema Generator | Generate FAQ schema | 🟢 |
| 749 | Product Schema Generator | Generate product schema | 🟢 |

---

# CATEGORY 22: Communication Formats

## 22.1 Email Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 750 | Email Header Parser | Parse email headers | 🟢 |
| 751 | Email Template Builder | Build HTML emails | 🟢 |
| 752 | MIME Type Lookup | Find MIME types | 🟢 |
| 753 | Email to Markdown | Convert email to MD | 🟢 |
| 754 | Email Address Parser | Parse email addresses | 🟢 |
| 755 | Email Signature Generator | Generate signatures | 🟢 |
| 756 | SPF Record Generator | Generate SPF records | 🟢 |
| 757 | DKIM Validator | Validate DKIM | 🟢 |

## 22.2 Messaging Formats (6 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 758 | Slack Formatter | Format for Slack | 🟢 |
| 759 | Discord Formatter | Format for Discord | 🟢 |
| 760 | Telegram Formatter | Format for Telegram | 🟢 |
| 761 | Teams Formatter | Format for MS Teams | 🟢 |
| 762 | IRC Formatter | Format for IRC | 🟢 |
| 763 | BBCode Formatter | Format BBCode | 🟢 |

---

# CATEGORY 23: AI-Powered Tools

> Powered by **Gemini 2.5 Flash** via OpenRouter
> Cost: $0.15/M input, $0.60/M output | 2M context window
> Credits: 1-10 per operation based on input size

## 23.1 Text AI (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 764 | Text Summarizer | Summarize long text | 🔴 |
| 765 | Text Rewriter | Rewrite text | 🔴 |
| 766 | Grammar Checker | Check grammar | 🔴 |
| 767 | Tone Adjuster | Adjust text tone | 🔴 |
| 768 | Translation | Translate text | 🔴 |
| 769 | Language Detector | Detect language | 🔴 |
| 770 | Keyword Extractor (AI) | Extract keywords | 🔴 |
| 771 | Sentiment Analyzer | Analyze sentiment | 🔴 |

## 23.2 Code AI (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 772 | Code Explainer | Explain code | 🔴 |
| 773 | Code Commenter | Add comments | 🔴 |
| 774 | Code Reviewer | Review code | 🔴 |
| 775 | Bug Finder | Find potential bugs | 🔴 |
| 776 | Code Converter | Convert between languages | 🔴 |
| 777 | Regex Generator | Generate from description | 🔴 |
| 778 | SQL Generator | Generate from description | 🔴 |
| 779 | Test Generator | Generate unit tests | 🔴 |

## 23.3 Other AI (6 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 780 | Commit Message Generator | Generate commit messages | 🔴 |
| 781 | PR Description Generator | Generate PR descriptions | 🔴 |
| 782 | Documentation Generator | Generate docs | 🔴 |
| 783 | Name Generator | Generate project names | 🔴 |
| 784 | Alt Text Generator | Generate image alt text | 🔴 |
| 785 | JSON to Description | Describe JSON structure | 🔴 |

---

# CATEGORY 24: Miscellaneous Tools

## 24.1 String Utilities (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 786 | String Length | Calculate length | 🟢 |
| 787 | String Hash | Various string hashes | 🟢 |
| 788 | String Similarity | Compare similarity | 🟢 |
| 789 | Levenshtein Distance | Edit distance | 🟢 |
| 790 | Soundex Generator | Generate Soundex | 🟢 |
| 791 | Metaphone Generator | Generate Metaphone | 🟢 |
| 792 | String Obfuscator | Obfuscate strings | 🟢 |
| 793 | Character Repeater | Repeat characters | 🟢 |

## 24.2 Fun Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 794 | Morse Code Converter | Text ↔ Morse | 🟢 |
| 795 | NATO Alphabet | Convert to NATO | 🟢 |
| 796 | Pig Latin Converter | Convert to Pig Latin | 🟢 |
| 797 | Leet Speak Converter | Convert to 1337 | 🟢 |
| 798 | Emoji Converter | Text to emoji | 🟢 |
| 799 | Zalgo Text Generator | Generate Zalgo text | 🟢 |
| 800 | Upside Down Text | Flip text upside down | 🟢 |
| 801 | Fancy Text Generator | Unicode styled text | 🟢 |

## 24.3 Reference Tools (8 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 802 | HTTP Status Reference | All HTTP codes | 🟢 |
| 803 | MIME Type Reference | All MIME types | 🟢 |
| 804 | HTML Entity Reference | All HTML entities | 🟢 |
| 805 | Keyboard Shortcut Reference | Common shortcuts | 🟢 |
| 806 | Emoji Reference | Searchable emoji list | 🟢 |
| 807 | Country Code Reference | ISO country codes | 🟢 |
| 808 | Currency Code Reference | ISO currency codes | 🟢 |
| 809 | Language Code Reference | ISO language codes | 🟢 |

## 24.4 Generators (6 tools)

| # | Tool | Description | Tier |
|---|------|-------------|------|
| 810 | Privacy Policy Generator | Generate privacy policy | 🟢 |
| 811 | Terms of Service Generator | Generate ToS | 🟢 |
| 812 | Cookie Policy Generator | Generate cookie policy | 🟢 |
| 813 | Disclaimer Generator | Generate disclaimer | 🟢 |
| 814 | GDPR Statement Generator | Generate GDPR statement | 🟢 |
| 815 | Copyright Notice Generator | Generate copyright | 🟢 |

---

# Summary

## Tool Count by Category

| # | Category | Tools |
|---|----------|-------|
| 1 | Data Formats & Conversion | 61 |
| 2 | Text & String Manipulation | 52 |
| 3 | Markdown & Documentation | 32 |
| 4 | HTML & Web | 46 |
| 5 | Code Formatting & Minification | 34 |
| 6 | Encoding & Decoding | 46 |
| 7 | Cryptography & Security | 46 |
| 8 | JWT & Tokens | 30 |
| 9 | Regular Expressions | 20 |
| 10 | Date & Time | 44 |
| 11 | Numbers & Math | 42 |
| 12 | Color Tools | 30 |
| 13 | Visual & Diagrams | 36 |
| 14 | Image Tools | 40 |
| 15 | SVG Tools | 20 |
| 16 | Developer Tools | 56 |
| 17 | OpenAPI & Schema Tools | 18 |
| 18 | SQL & Database | 20 |
| 19 | Network Tools | 34 |
| 20 | Validation Tools | 26 |
| 21 | Feeds & Structured Data | 16 |
| 22 | Communication Formats | 14 |
| 23 | AI-Powered Tools | 22 |
| 24 | Miscellaneous Tools | 30 |
| | **TOTAL** | **815** |

## Tool Count by Tier

| Tier | Icon | Count | Cost |
|------|------|-------|------|
| Client-side | 🟢 | ~750 | Free within limits (see thresholds) |
| Server Light | 🟡 | ~30 | 1 credit |
| Server Heavy | 🟠 | ~13 | 2-5 credits |
| AI-Powered | 🔴 | ~22 | 1-10 credits |

---

## Revenue Model Summary

### AI Provider
**Gemini 2.5 Flash** via OpenRouter
- Input: $0.15/M tokens | Output: $0.60/M tokens
- 2M context window | Reliable & fast

### User Tiers

```
Anonymous (no login)
├── 🟢 tools: FREE (50 ops/day, 100KB limit, ads)
├── Batch: Not available
└── 🟡🟠🔴 tools: Not available

Logged-in (Google/GitHub)
├── 🟢 tools: FREE (200 ops/day, 500KB limit, ads)
├── Batch: Up to 5 items
└── 🟡🟠🔴 tools: Requires credits

Credit User (any purchase)
├── 🟢 tools: Unlimited, no ads, 10MB limit
├── 🟢 large input: 1-3 credits (>500KB)
├── 🟢 batch: 1-5 credits (>5 items)
├── 🟡 server light: 1 credit
├── 🟠 server heavy: 2-5 credits
└── 🔴 AI tools: 1-10 credits
```

### Credit Packages

| Package | Credits | Price | Per Credit |
|---------|---------|-------|------------|
| Starter | 100 | $1 | $0.010 |
| Basic | 500 | $5 | $0.010 |
| Standard | 1,200 | $10 | $0.0083 |
| Pro | 3,500 | $25 | $0.0071 |
| Power | 8,000 | $50 | $0.0063 |

### AI Credit Costs

| Type | Input Limit | Credits | Margin |
|------|-------------|---------|--------|
| Simple | ~750 words | 1 | 97% |
| Medium | ~3K words | 2 | 95% |
| Complex | ~7.5K words | 5 | 94% |
| Large | ~37K words | 10 | 90% |

---

## High-Priority Launch Tools (Top 50)

These should be built first based on search volume and competitive advantage:

1. JSON Formatter
2. JSON Validator
3. Base64 Encode/Decode
4. URL Encode/Decode
5. JWT Decoder
6. UUID Generator
7. Regex Tester
8. Unix Timestamp Converter
9. Markdown Preview
10. SHA-256 Hash
11. Password Generator
12. QR Code Generator
13. Color Converter
14. JSON to YAML
15. Text Diff
16. Cron Expression Builder
17. Unit Converter
18. HTML Entity Encoder
19. Lorem Ipsum Generator
20. Case Converter
21. Mermaid Renderer
22. JSON to TypeScript
23. YAML Formatter
24. CSV to JSON
25. SQL Formatter
26. HTML Formatter
27. JavaScript Formatter
28. JSON Diff
29. Image Resizer
30. Contrast Checker
31. Word Counter
32. DNS Lookup
33. SSL Certificate Checker
34. XML Formatter
35. HTTP Status Reference
36. .gitignore Generator
37. Meta Tag Generator
38. Color Palette Generator
39. JSON Path Query
40. Slug Generator
41. Line Sorter
42. CIDR Calculator
43. cURL Converter
44. JSON Minify
45. SVG Optimizer
46. Email Validator
47. Date Formatter
48. Number Base Converter
49. CSS Gradient Generator
50. Barcode Generator

---

*This catalog represents all possible tools. Implementation should be phased, starting with the Top 50 high-priority tools.*
