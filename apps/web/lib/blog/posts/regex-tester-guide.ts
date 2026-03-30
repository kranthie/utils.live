import type { BlogPost } from "../types";

export const regexTesterGuide: BlogPost = {
  slug: "regex-tester-guide",
  title: "Regex Tester: Learn Regular Expressions with Live Examples",
  description:
    "A practical guide to regular expressions with syntax overview, common patterns, and a live online regex tester.",
  publishedAt: "2026-03-29",
  readingTimeMinutes: 8,
  ctaTools: [{ name: "Regex Tester", href: "/tools/regex/regex-tester" }],
  content: `## What Are Regular Expressions?

A regular expression (regex or regexp) is a sequence of characters that defines a search pattern. You use them to find, match, extract, or replace text that follows a particular structure. Regex is baked into virtually every programming language — JavaScript, Python, Go, Ruby, Java, Rust — and countless command-line tools like \`grep\`, \`sed\`, and \`awk\`.

Learning regex pays outsized dividends: a single well-crafted pattern can replace dozens of lines of string-parsing code.

---

## Basic Syntax

### Literals

The simplest regex is a literal string. The pattern \`cat\` matches the exact characters c, a, t in that order. It would match in "concatenate" and "category" as well as the word "cat".

### The Dot (.)

A dot matches **any single character** except a newline:

- Pattern: \`c.t\`
- Matches: \`cat\`, \`cut\`, \`cot\`, \`c3t\`, \`c t\`
- Does not match: \`ct\` (no middle character)

### Anchors

Anchors do not match characters — they match **positions**:

| Anchor | Meaning                          |
|--------|----------------------------------|
| \`^\`    | Start of the string (or line)    |
| \`$\`    | End of the string (or line)      |
| \`\\b\`   | Word boundary                    |
| \`\\B\`   | Not a word boundary              |

Pattern \`^hello\` matches "hello world" but not "say hello".

Pattern \`world$\` matches "hello world" but not "worldwide".

### Quantifiers

Quantifiers control how many times a pattern element must appear:

| Quantifier | Meaning                              |
|------------|--------------------------------------|
| \`*\`        | 0 or more times                      |
| \`+\`        | 1 or more times                      |
| \`?\`        | 0 or 1 times (optional)              |
| \`{n}\`      | Exactly n times                      |
| \`{n,}\`     | At least n times                     |
| \`{n,m}\`    | Between n and m times (inclusive)    |

Pattern \`colou?r\` matches both "color" and "colour" because \`u\` is optional.

Pattern \`\\d{4}\` matches exactly four digits.

---

## Character Classes

Square brackets define a **character class** — a set of characters where any one of them can match at that position:

| Pattern      | Matches                                      |
|--------------|----------------------------------------------|
| \`[aeiou]\`   | Any single vowel                             |
| \`[a-z]\`     | Any lowercase letter                         |
| \`[A-Z0-9]\`  | Any uppercase letter or digit                |
| \`[^aeiou]\`  | Any character that is NOT a vowel (negation) |

**Shorthand character classes** cover common sets:

| Shorthand | Equivalent         | Meaning                         |
|-----------|--------------------|---------------------------------|
| \`\\d\`      | \`[0-9]\`            | Any digit                       |
| \`\\D\`      | \`[^0-9]\`           | Any non-digit                   |
| \`\\w\`      | \`[a-zA-Z0-9_]\`     | Any word character              |
| \`\\W\`      | \`[^a-zA-Z0-9_]\`    | Any non-word character          |
| \`\\s\`      | \`[ \\t\\n\\r\\f\\v]\` | Any whitespace                  |
| \`\\S\`      | Non-whitespace     | Any non-whitespace character    |

---

## Groups and Alternation

### Capturing Groups \`( )\`

Parentheses create a **capturing group** — a sub-expression whose matched text is captured and can be referenced:

\`\`\`
(\\d{4})-(\\d{2})-(\\d{2})
\`\`\`

Applied to "2026-03-29":
- Group 1: \`2026\`
- Group 2: \`03\`
- Group 3: \`29\`

### Non-Capturing Groups \`(?:)\`

When you need grouping for quantifiers but don't need the capture, use \`(?:)\`:

\`\`\`
(?:https?|ftp)://
\`\`\`

This matches "http://", "https://", or "ftp://" without capturing.

### Alternation \`|\`

The pipe character acts as an OR operator:

\`\`\`
cat|dog|bird
\`\`\`

Matches "cat", "dog", or "bird".

---

## Common Flags

Most regex engines support flags (also called modifiers) that change matching behavior:

| Flag | Meaning                                          |
|------|--------------------------------------------------|
| \`g\`  | Global — find all matches, not just the first    |
| \`i\`  | Case-insensitive matching                        |
| \`m\`  | Multiline — \`^\` and \`$\` match line boundaries   |
| \`s\`  | Dot-all — \`.` matches newlines too               |

In JavaScript: \`/pattern/gi\`

In Python: \`re.compile(r"pattern", re.IGNORECASE | re.MULTILINE)\`

---

## Practical Pattern Examples

### Email Address (Simplified)

\`\`\`
^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$
\`\`\`

Matches: \`alice@example.com\`, \`user.name+tag@company.co.uk\`

### URL

\`\`\`
https?:\\/\\/[^\\s/$.?#].[^\\s]*
\`\`\`

Matches: \`https://example.com\`, \`http://sub.domain.org/path?q=1\`

### US Phone Number

\`\`\`
^(\\+1[\\s.-]?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$
\`\`\`

Matches: \`555-867-5309\`, \`(555) 867-5309\`, \`+1 555.867.5309\`

### IPv4 Address

\`\`\`
^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$
\`\`\`

Matches: \`192.168.1.1\`, \`10.0.0.255\`

### Hex Color Code

\`\`\`
^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$
\`\`\`

Matches: \`#ff5733\`, \`#FFF\`, \`#4a90e2\`

---

## Tips for Debugging Regex

1. **Start simple, build up.** Match the core part first, then add boundary conditions, optional parts, and flags one at a time.

2. **Use a live tester.** Immediate visual feedback showing which parts of your test string match is far faster than reading docs and guessing.

3. **Watch out for greedy vs lazy quantifiers.** By default, \`+\` and \`*\` are greedy — they match as much as possible. Add \`?\` after them (\`+?\`, \`*?\`) to make them lazy (match as little as possible).

4. **Escape special characters.** If you need to match a literal dot, parenthesis, or other metacharacter, prefix it with a backslash: \`\\.\`, \`\\(\`, \`\\)\`.

5. **Anchor your patterns.** Without \`^\` and \`$\`, your pattern may match substrings you did not intend to allow.

6. **Test against negative cases.** Make sure your pattern does NOT match invalid inputs — just as important as making sure it does match valid ones.

---

## Try It Online

Test and debug your regex patterns in real time with the utils.live Regex Tester. Paste your pattern and test strings, toggle flags, and see matches highlighted instantly — all without installing anything.
`,
};
