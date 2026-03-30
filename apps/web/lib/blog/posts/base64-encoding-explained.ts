import type { BlogPost } from "../types";

export const base64EncodingExplained: BlogPost = {
  slug: "base64-encoding-explained",
  title: "Base64 Encoding Explained: How to Encode and Decode Online",
  description:
    "Learn what Base64 encoding is, how it works, and common use cases like data URLs, JWTs, and API authentication.",
  publishedAt: "2026-03-29",
  readingTimeMinutes: 7,
  ctaTools: [
    { name: "Base64 Encoder", href: "/tools/encoding/base64-encode" },
    { name: "Base64 Decoder", href: "/tools/encoding/base64-decode" },
  ],
  content: `## What Is Base64 Encoding?

Base64 is a binary-to-text encoding scheme that represents binary data using a set of 64 printable ASCII characters. The name comes directly from this 64-character alphabet: uppercase letters A–Z, lowercase letters a–z, digits 0–9, and the two symbols \`+\` and \`/\`. A padding character \`=\` is also used to make the output length a multiple of four.

Base64 is **not encryption**. It is a reversible encoding — anyone who receives a Base64 string can trivially decode it back to the original data without any key or secret. The purpose of Base64 is purely representational: to safely transport binary data through systems that are designed to handle only text.

---

## How the Encoding Algorithm Works

Base64 works by grouping the input bytes into 3-byte (24-bit) chunks, then splitting each chunk into four 6-bit groups. Each 6-bit value (0–63) maps to a character in the Base64 alphabet.

For example, encoding the ASCII string \`"Man"\`:

| Character | M (77) | a (97) | n (110) |
|-----------|--------|--------|---------|
| Binary    | 01001101 | 01100001 | 01101110 |

Combined: \`010011010110000101101110\`

Split into 6-bit groups: \`010011\` \`010110\` \`000101\` \`101110\`

Decimal values: 19, 22, 5, 46

Base64 characters: \`T\`, \`W\`, \`F\`, \`u\` → **\`TWFu\`**

When the input length is not divisible by 3, padding characters (\`=\` or \`==\`) are appended to the output so that its length is always a multiple of 4.

Because every 3 bytes become 4 characters, Base64-encoded data is approximately **33% larger** than the original.

---

## Common Use Cases

### 1. Data URLs (Inline Images and Assets)

Browsers support the \`data:\` URI scheme, which lets you embed file contents directly in HTML or CSS without a separate HTTP request:

\`\`\`html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..." />
\`\`\`

This is useful for small icons, logos, or images in email templates where external URL references may be blocked.

### 2. JSON Web Tokens (JWTs)

JWTs use a variant called **Base64url** — identical to standard Base64 but with \`+\` replaced by \`-\` and \`/\` replaced by \`_\`, and with padding omitted. This makes the token safe to use in URLs and HTTP headers without percent-encoding.

A JWT looks like this:

\`\`\`
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
\`\`\`

Each of the three dot-separated sections is independently Base64url-encoded.

### 3. MIME Email Attachments

The MIME standard uses Base64 to encode binary email attachments (PDFs, images, spreadsheets) so they can travel safely through mail servers that only handle 7-bit ASCII text. You will see \`Content-Transfer-Encoding: base64\` headers in raw email source files.

### 4. HTTP Basic Authentication

Basic Auth credentials are transmitted by Base64-encoding the string \`username:password\` and placing the result in the \`Authorization\` HTTP header:

\`\`\`
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
\`\`\`

Decoding \`dXNlcm5hbWU6cGFzc3dvcmQ=\` yields \`username:password\`.

### 5. Storing Binary Data in JSON or XML

JSON has no native binary type. When an API needs to transfer binary blobs (images, cryptographic keys, certificates), Base64 encoding allows them to be embedded cleanly in a JSON string field.

---

## When Should You Use Base64?

Use Base64 when:

- You need to embed binary content (images, files, keys) in a text-only medium (JSON, XML, HTML, email).
- You are passing data through a system that may corrupt or reject raw binary bytes.
- You are working with protocols that use Base64 by convention (JWTs, Basic Auth, data URLs).

Avoid Base64 when:

- You simply need to store or transfer binary files directly — HTTP handles binary natively, so Base64 only adds overhead.
- You are trying to protect sensitive data. Base64 is trivially reversible.

---

## Security Considerations

Because Base64 is not encryption, you should never use it to obscure passwords, tokens, or other secrets. A common mistake is seeing a Base64 string and assuming it is hashed or encrypted — it is not. Any developer with access to the string can decode it instantly.

When using Basic Auth, always pair it with HTTPS/TLS. The Base64-encoded credentials in the header are completely exposed over plain HTTP.

Similarly, JWT payloads are readable by anyone who holds the token. Do not store sensitive information such as passwords or payment details in a JWT payload unless the token itself is encrypted (JWE).

---

## Quick Reference

| Input          | Base64 Output          |
|----------------|------------------------|
| \`hello\`       | \`aGVsbG8=\`            |
| \`hello world\` | \`aGVsbG8gd29ybGQ=\`    |
| \`{"id":1}\`    | \`eyJpZCI6MX0=\`         |

---

## Try It Online

Need to encode or decode a Base64 string right now? Use the free tools at utils.live — no sign-up required, runs entirely in your browser, and your data never leaves your device.
`,
};
