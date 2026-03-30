import type { BlogPost } from "../types";

export const urlEncoderDecoderGuide: BlogPost = {
  slug: "url-encoder-decoder-guide",
  title: "URL Encoder & Decoder: How URL Encoding Works",
  description:
    "Learn what URL encoding is, why it exists, and how percent-encoding keeps your web requests safe and valid.",
  publishedAt: "2026-03-30",
  readingTimeMinutes: 8,
  category: "Encoding",
  ctaTools: [
    { name: "URL Encoder", href: "/tools/encoding/url-encode" },
    { name: "URL Decoder", href: "/tools/encoding/url-decode" },
  ],
  content: `## What Is URL Encoding?

URL encoding — also called **percent-encoding** — is a mechanism for representing characters in a Uniform Resource Locator (URL) that would otherwise be unsafe or have special meaning in the URL syntax. The name comes from the encoding format itself: each unsafe character is replaced by a percent sign (\`%\`) followed by two hexadecimal digits representing the character's ASCII (or UTF-8) byte value.

For example, the space character (ASCII 32, or \`0x20\`) becomes \`%20\`. An ampersand (\`&\`) becomes \`%26\`. A forward slash (\`/\`) — which has a structural role in URLs — becomes \`%2F\` when it needs to appear as literal data rather than a path separator.

URL encoding is defined in [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), the specification that governs URI syntax. Understanding it is essential for web developers, API consumers, and anyone building or debugging network requests.

---

## Why URL Encoding Exists

URLs were designed to be ASCII-only strings with a specific syntax. Certain characters play structural roles:

| Character | Role in URL |
|-----------|-------------|
| \`?\` | Separates path from query string |
| \`&\` | Separates query parameters |
| \`=\` | Separates parameter name from value |
| \`#\` | Introduces a fragment identifier |
| \`/\` | Separates path segments |
| \`:\` | Separates scheme from host, or port |
| \`+\` | Sometimes used as a space in query strings |

If you want to include any of these characters as **data** — for instance, a user searches for "C++ language" — you must encode them so the URL parser does not misinterpret them as structural characters. Similarly, characters outside the ASCII range (like accented letters or emoji) must be encoded because URLs are fundamentally ASCII.

Without encoding, a URL like:

\`\`\`
https://example.com/search?q=hello world&lang=C++
\`\`\`

would be ambiguous or broken. After encoding:

\`\`\`
https://example.com/search?q=hello%20world&lang=C%2B%2B
\`\`\`

Now the URL is unambiguous and can be transmitted safely.

---

## The Percent-Encoding Algorithm

The algorithm for percent-encoding a character is straightforward:

1. Represent the character in UTF-8 (most characters are a single byte; characters outside the Basic Multilingual Plane use up to four bytes).
2. For each byte, write a percent sign followed by the byte value in uppercase hexadecimal.

Here are some worked examples:

| Original | UTF-8 bytes | Encoded |
|----------|-------------|---------|
| Space | 0x20 | \`%20\` |
| \`!\` | 0x21 | \`%21\` |
| \`@\` | 0x40 | \`%40\` |
| \`é\` (U+00E9) | 0xC3 0xA9 | \`%C3%A9\` |
| \`€\` (U+20AC) | 0xE2 0x82 0xAC | \`%E2%82%AC\` |
| 😀 (U+1F600) | 0xF0 0x9F 0x98 0x80 | \`%F0%9F%98%80\` |

### Unreserved Characters

Not every character needs encoding. RFC 3986 defines a set of **unreserved characters** that are safe in any part of a URL without encoding:

- Uppercase and lowercase letters: \`A–Z\`, \`a–z\`
- Digits: \`0–9\`
- The four symbols: \`-\`, \`_\`, \`.\`, \`~\`

Everything else — including characters with special meaning in URLs and any non-ASCII character — should be percent-encoded when used as data.

---

## \`encodeURIComponent\` vs \`encodeURI\` in JavaScript

JavaScript provides two built-in functions for URL encoding, and choosing the wrong one is a common source of bugs.

### \`encodeURI\`

\`encodeURI\` is designed to encode a **complete URL**. It leaves all characters with structural meaning in URLs untouched, encoding only characters that are truly unsafe in any context.

Characters NOT encoded by \`encodeURI\`:
\`A–Z a–z 0–9 ; , / ? : @ & = + $ - _ . ! ~ * ' ( ) #\`

Example:
\`\`\`javascript
encodeURI("https://example.com/search?q=hello world")
// => "https://example.com/search?q=hello%20world"
\`\`\`

Notice that \`?\`, \`=\`, and \`&\` are left alone because \`encodeURI\` treats them as structural.

### \`encodeURIComponent\`

\`encodeURIComponent\` is designed to encode a **single component** — a query parameter value, a path segment, or any other piece of data that you are inserting into a URL. It encodes all reserved characters, including the structural ones.

Characters NOT encoded by \`encodeURIComponent\`:
\`A–Z a–z 0–9 - _ . ! ~ * ' ( )\`

Example:
\`\`\`javascript
const query = "C++ & Java"
encodeURIComponent(query)
// => "C%2B%2B%20%26%20Java"
\`\`\`

**Rule of thumb:** When building query string parameters, always use \`encodeURIComponent\` on each value. When encoding a full pre-built URL, use \`encodeURI\`.

---

## Query String Encoding: The \`+\` vs \`%20\` Difference

There are actually two slightly different encoding schemes used in web forms:

1. **RFC 3986 percent-encoding** — spaces become \`%20\`
2. **application/x-www-form-urlencoded** — spaces become \`+\`, and \`+\` itself becomes \`%2B\`

When an HTML form submits via GET, browsers use the \`application/x-www-form-urlencoded\` format, so you will often see \`+\` in query strings. When constructing URLs programmatically, you typically use RFC 3986 percent-encoding (\`%20\` for spaces).

Server-side frameworks usually handle this transparently, but if you are ever manually parsing query strings or building URLs at a low level, you need to know which convention applies.

\`\`\`javascript
// Form encoding (application/x-www-form-urlencoded)
new URLSearchParams({ q: "hello world" }).toString()
// => "q=hello+world"

// RFC 3986 encoding
"/search?q=" + encodeURIComponent("hello world")
// => "/search?q=hello%20world"
\`\`\`

---

## URL Decoding

Decoding is the reverse: replace each \`%XX\` sequence with the byte it represents, then interpret the resulting bytes as UTF-8 text.

In JavaScript:

\`\`\`javascript
decodeURIComponent("C%2B%2B%20%26%20Java")
// => "C++ & Java"

decodeURI("https://example.com/search?q=hello%20world")
// => "https://example.com/search?q=hello world"
\`\`\`

A key safety note: never decode a URL before parsing its structure. If an attacker encodes a path traversal sequence like \`%2F\` (slash) or \`%2E%2E\` (dot-dot), decoding before parsing can cause your application to interpret a different path than intended. Always parse the URL structure first, then decode the individual components.

---

## Practical Scenarios

### Building API Requests

When constructing API URLs with dynamic parameters, always encode your values:

\`\`\`javascript
const baseUrl = "https://api.example.com/search"
const params = new URLSearchParams({
  query: "San Francisco, CA",
  filter: "price<100",
  tags: "food & drink",
})
const url = \`\${baseUrl}?\${params.toString()}\`
// => "https://api.example.com/search?query=San+Francisco%2C+CA&filter=price%3C100&tags=food+%26+drink"
\`\`\`

Using the \`URLSearchParams\` API is the safest approach in modern JavaScript environments — it handles encoding automatically and correctly.

### Debugging Broken Links

When a URL appears broken in browser developer tools, the encoded form can be hard to read. Decoding it reveals the original intent:

\`\`\`
%E6%97%A5%E6%9C%AC%E8%AA%9E
\`\`\`

Decoded: \`日本語\` (Japanese for "Japanese language")

### OAuth and Authentication

OAuth flows and PKCE challenges pass data through URL query parameters. The \`code_verifier\`, \`redirect_uri\`, and \`state\` parameters must all be properly encoded. Improper encoding is a common cause of OAuth callback failures.

---

## Common Mistakes and Pitfalls

**Double-encoding:** Applying encoding twice produces strings like \`%2520\` (where \`%25\` is the encoding of the \`%\` sign, and \`20\` follows literally). Always check whether a value has already been encoded before encoding it again.

**Encoding entire URLs instead of components:** Using \`encodeURIComponent\` on a full URL will encode the \`://\` and path separators, breaking the URL completely.

**Not encoding path segments:** Developers often remember to encode query parameters but forget that path segments can also contain user data that needs encoding.

**Assuming ASCII:** Modern APIs and internationalized domain names can contain non-ASCII characters. Always use UTF-8 encoding as your byte representation before percent-encoding.

---

## URL Encoding in Other Languages

The same concepts apply across all programming languages, though the API names vary:

| Language | Encode component | Decode component |
|----------|-----------------|-----------------|
| JavaScript | \`encodeURIComponent()\` | \`decodeURIComponent()\` |
| Python | \`urllib.parse.quote()\` | \`urllib.parse.unquote()\` |
| Java | \`URLEncoder.encode()\` | \`URLDecoder.decode()\` |
| Go | \`url.QueryEscape()\` | \`url.QueryUnescape()\` |
| Ruby | \`URI.encode_www_form_component()\` | \`URI.decode_www_form_component()\` |
| PHP | \`urlencode()\` / \`rawurlencode()\` | \`urldecode()\` / \`rawurldecode()\` |

In Python, \`quote()\` defaults to not encoding \`/\`, which is useful for path segments. Use \`quote(value, safe="")\` to encode slashes when encoding query parameter values.

---

## Try It Yourself

URL encoding and decoding is one of those tasks that comes up constantly in web development — from constructing API requests and debugging network traffic to building search features and handling internationalized content. Understanding the underlying mechanics makes it much easier to diagnose problems when something is not working as expected.

Use the tools below to encode or decode any URL or string instantly. Paste in a URL with special characters and see the encoded form, or paste an encoded string to reveal the original text.

---

## Encode and Decode URLs Instantly

Stop guessing what percent-encoded characters mean or manually converting character codes. The URL Encoder and URL Decoder tools on utils.live handle the conversion instantly — just paste your text and get the result.
`,
};
