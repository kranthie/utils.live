import type { BlogPost } from "../types";

export const jsonFormatterValidatorGuide: BlogPost = {
  slug: "json-formatter-validator-guide",
  title: "JSON Formatter & Validator: How to Pretty-Print and Validate JSON",
  description:
    "Learn the JSON specification, how to format and validate JSON data, and common mistakes that cause parse errors.",
  publishedAt: "2026-03-30",
  readingTimeMinutes: 9,
  category: "JSON",
  ctaTools: [
    { name: "JSON Formatter", href: "/tools/json/json-formatter" },
    { name: "JSON Validator", href: "/tools/json/json-validator" },
  ],
  content: `## What Is JSON?

JSON — JavaScript Object Notation — is a lightweight, text-based data interchange format. Despite its JavaScript origins, it is language-independent and has become the dominant format for APIs, configuration files, and data storage across virtually every programming ecosystem.

JSON is defined in [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) and [ECMA-404](https://www.ecma-international.org/publications-and-standards/standards/ecma-404/). The specification is remarkably compact — the entire JSON grammar fits on a single page — yet its simplicity is a large part of why it succeeded.

---

## The JSON Data Types

JSON supports exactly six value types:

### 1. String
A sequence of Unicode characters wrapped in double quotes. Control characters must be escaped.

\`\`\`json
"Hello, world!"
"Line one\\nLine two"
"Unicode: \\u00E9"
\`\`\`

### 2. Number
An integer or floating-point value. No distinction between integer and float types. No special values like \`Infinity\` or \`NaN\`.

\`\`\`json
42
-17
3.14159
6.022e23
\`\`\`

### 3. Boolean
Lowercase \`true\` or \`false\`.

### 4. Null
Lowercase \`null\` — represents the absence of a value.

### 5. Array
An ordered list of values (of any type) enclosed in square brackets.

\`\`\`json
[1, "two", true, null, [3, 4]]
\`\`\`

### 6. Object
An unordered collection of key-value pairs enclosed in curly braces. Keys must be strings (double-quoted). Values can be any JSON type.

\`\`\`json
{
  "name": "Alice",
  "age": 30,
  "active": true,
  "address": {
    "city": "Seattle",
    "zip": "98101"
  }
}
\`\`\`

---

## What JSON Formatting Means

**Minified JSON** packs all the data onto one line with no whitespace beyond what is structurally required. This reduces file size and is ideal for network transmission:

\`\`\`json
{"name":"Alice","age":30,"active":true,"address":{"city":"Seattle","zip":"98101"}}
\`\`\`

**Pretty-printed JSON** adds indentation and line breaks to make the structure visually clear. This is far easier to read and debug:

\`\`\`json
{
  "name": "Alice",
  "age": 30,
  "active": true,
  "address": {
    "city": "Seattle",
    "zip": "98101"
  }
}
\`\`\`

The two forms are semantically equivalent — any JSON parser will produce the same data structure from both.

### Standard Formatting Rules

- **Indentation:** Typically 2 or 4 spaces. Tabs are valid but less common. Be consistent within a project.
- **Trailing newline:** Many linters and editors require a newline at the end of the file.
- **Key sorting:** Not required by the spec, but sorting keys alphabetically makes diffs easier to read and is enforced by some tools.
- **No trailing commas:** JSON does not allow a comma after the last item in an array or object. This is one of the most common mistakes for developers coming from JavaScript (which does allow trailing commas in code).

---

## JSON Validation: What Makes JSON Invalid?

The JSON specification is strict. Any deviation produces invalid JSON that will cause a parse error. Here are the most common mistakes:

### Trailing Commas

This is perhaps the single most frequent JSON error:

\`\`\`json
{
  "name": "Alice",
  "age": 30,
}
\`\`\`

The comma after \`30\` is invalid. Remove it.

### Single Quotes Instead of Double Quotes

JSON strings **must** use double quotes. Single quotes are not valid.

\`\`\`json
{ 'name': 'Alice' }
\`\`\`

This is invalid JSON. Use:

\`\`\`json
{ "name": "Alice" }
\`\`\`

### Unquoted Keys

Object keys must be quoted strings:

\`\`\`json
{ name: "Alice" }
\`\`\`

This is JavaScript object literal syntax, not JSON. Valid JSON requires:

\`\`\`json
{ "name": "Alice" }
\`\`\`

### Comments

JSON does not support comments. Neither \`//\` nor \`/* */\` are valid:

\`\`\`json
{
  // This is invalid
  "name": "Alice" /* also invalid */
}
\`\`\`

If you need human-readable configuration with comments, consider JSONC (JSON with Comments, supported by VS Code and TypeScript's \`tsconfig.json\`) or YAML.

### Undefined, NaN, and Infinity

These JavaScript values have no JSON equivalent:

\`\`\`javascript
// None of these are valid JSON values
{ "value": undefined }
{ "value": NaN }
{ "value": Infinity }
\`\`\`

Use \`null\`, a sentinel number, or a string like \`"Infinity"\` instead.

### Unescaped Control Characters in Strings

Characters with code points U+0000 through U+001F (tab, newline, carriage return, etc.) must be escaped if they appear in strings:

\`\`\`json
"value": "line one
line two"
\`\`\`

Use \`\\n\` for newlines and \`\\t\` for tabs:

\`\`\`json
"value": "line one\\nline two"
\`\`\`

### Duplicate Keys

The JSON spec says duplicate keys "should" be unique, but technically allows them. In practice, behavior is undefined — different parsers may return the first value, the last value, or throw an error. Always use unique keys.

---

## Parsing and Formatting JSON in Code

### JavaScript

\`\`\`javascript
// Parse a JSON string into a JavaScript object
const data = JSON.parse('{"name":"Alice","age":30}')

// Serialize with pretty-printing (2-space indent)
const formatted = JSON.stringify(data, null, 2)
console.log(formatted)

// Minify
const minified = JSON.stringify(data)
\`\`\`

### Python

\`\`\`python
import json

# Parse
data = json.loads('{"name": "Alice", "age": 30}')

# Pretty-print
formatted = json.dumps(data, indent=2)
print(formatted)

# Minify
minified = json.dumps(data, separators=(",", ":"))
\`\`\`

### Command Line with \`jq\`

\`jq\` is the standard Unix tool for processing JSON:

\`\`\`bash
# Pretty-print
echo '{"name":"Alice","age":30}' | jq .

# Extract a field
echo '{"name":"Alice","age":30}' | jq .name
# => "Alice"

# Minify
cat data.json | jq -c .
\`\`\`

---

## JSON Schema Validation

Beyond syntax validation (checking that JSON is structurally valid), **JSON Schema** allows you to validate the data structure and types against a defined contract. For example:

\`\`\`json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["name", "age"]
}
\`\`\`

A JSON Schema validator can check that incoming API data matches this contract — that \`name\` is indeed a string, \`age\` is a non-negative integer, and so on. This is useful for:

- API input validation
- Configuration file validation
- Contract testing between services
- Code generation from a schema definition

Popular JSON Schema libraries include Ajv (JavaScript), jsonschema (Python), and many others in virtually every language.

---

## JSON vs Related Formats

| Format | Pros | Cons |
|--------|------|------|
| JSON | Universal support, simple spec, fast parsers | No comments, verbose for some data |
| YAML | Human-friendly, supports comments | Complex spec, whitespace-sensitive, subtle gotchas |
| TOML | Great for config files, clear types | Less tooling support, less common in APIs |
| MessagePack | Binary JSON, much more compact | Not human-readable |
| Protocol Buffers | Extremely fast and compact | Requires schema definition, not human-readable |

For REST APIs and configuration, JSON remains the most practical choice due to its universal support and tooling ecosystem.

---

## Tips for Working with Large JSON Files

**Stream instead of loading everything into memory.** For files larger than a few hundred megabytes, use streaming parsers. In Node.js, libraries like \`stream-json\` allow you to process JSON line by line. In Python, \`ijson\` provides an iterator-based API.

**Use NDJSON (Newline-Delimited JSON) for large datasets.** NDJSON stores one JSON object per line, making it easy to process with standard Unix tools and stream line by line:

\`\`\`
{"id": 1, "name": "Alice"}
{"id": 2, "name": "Bob"}
{"id": 3, "name": "Carol"}
\`\`\`

**Compress for transmission.** Minified JSON compresses extremely well with gzip or Brotli. HTTP responses with JSON bodies should use compression.

---

## Format and Validate JSON Instantly

Whether you have a minified API response that you need to read, or a JSON file with a mysterious parse error, the JSON Formatter and JSON Validator tools on utils.live handle it in your browser. Paste your JSON to instantly format it with proper indentation, or validate it and see exactly which line contains the error.
`,
};
