import type { BlogPost } from "../types";

export const jwtDecoderGuide: BlogPost = {
  slug: "jwt-decoder-guide",
  title: "JWT Decoder Guide: How to Read and Inspect JSON Web Tokens",
  description:
    "Understand JWT structure (header.payload.signature), how to decode tokens online, and key security considerations.",
  publishedAt: "2026-03-29",
  readingTimeMinutes: 6,
  category: "JWT",
  ctaTools: [{ name: "JWT Decoder", href: "/tools/jwt/jwt-decoder" }],
  content: `## What Is a JSON Web Token?

A JSON Web Token (JWT) is a compact, URL-safe way to represent claims between two parties. Pronounced "jot," JWTs are the de-facto standard for stateless authentication in modern web applications. When a user logs in, the server issues a JWT. The client stores it and sends it along with every subsequent request. The server can then verify the token without consulting a database session store.

The JWT specification is defined in [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519).

---

## The Three-Part Structure

A JWT always consists of exactly three Base64url-encoded sections separated by dots (\`.\`):

\`\`\`
header.payload.signature
\`\`\`

A real token looks like this:

\`\`\`
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3IxMjMiLCJuYW1lIjoiQWxpY2UiLCJpYXQiOjE3NDMxOTIwMDAsImV4cCI6MTc0MzI3ODQwMH0.4Adcj3UFYjPiqgrmgbqZkfOxwSbH_yZFxgTEXFCKHcU
\`\`\`

### Part 1 — Header

The header is a JSON object describing the token type and the signing algorithm used:

\`\`\`json
{
  "alg": "HS256",
  "typ": "JWT"
}
\`\`\`

Common algorithm values include \`HS256\` (HMAC-SHA256, shared secret), \`RS256\` (RSA, asymmetric key pair), and \`ES256\` (Elliptic Curve).

### Part 2 — Payload (Claims)

The payload contains the claims — statements about the subject of the token plus any additional application data:

\`\`\`json
{
  "sub": "usr123",
  "name": "Alice",
  "iat": 1743192000,
  "exp": 1743278400
}
\`\`\`

JWT defines a set of **registered claim names**:

| Claim | Full Name      | Meaning                                      |
|-------|----------------|----------------------------------------------|
| \`iss\` | Issuer         | Who issued the token (e.g., \`"auth.example.com"\`) |
| \`sub\` | Subject        | Who the token is about (usually a user ID)    |
| \`aud\` | Audience       | Who the token is intended for                 |
| \`exp\` | Expiration     | Unix timestamp after which the token is invalid |
| \`iat\` | Issued At      | Unix timestamp when the token was created     |
| \`nbf\` | Not Before     | Token must not be accepted before this time   |
| \`jti\` | JWT ID         | Unique identifier to prevent replay attacks   |

You can also add your own **private claims** — any key-value pairs your application needs, such as \`"role": "admin"\` or \`"orgId": "acme-corp"\`.

### Part 3 — Signature

The signature ensures the token was not tampered with. It is computed by taking the encoded header and payload, concatenating them with a dot, and running the result through the signing algorithm with a secret or private key:

\`\`\`
HMACSHA256(
  base64url(header) + "." + base64url(payload),
  secret
)
\`\`\`

Only the issuer who holds the secret or private key can produce a valid signature. Anyone can **read** the header and payload (they are just Base64url), but only the keyholder can **create** a valid signature.

---

## How to Decode a JWT

Decoding a JWT means reading its header and payload — not verifying its signature. Because the header and payload are merely Base64url-encoded JSON, you can decode them with any Base64 decoder:

1. Split the token on \`.\` to get three parts.
2. Base64url-decode the first part → header JSON.
3. Base64url-decode the second part → payload JSON.
4. The third part is the signature (binary, not meaningful to read directly).

Note that Base64url differs from standard Base64: \`-\` replaces \`+\`, \`_\` replaces \`/\`, and padding (\`=\`) is omitted.

---

## Common Use Cases

### OAuth 2.0 / OpenID Connect

Identity providers like Google, Auth0, and Okta issue JWTs as ID tokens and access tokens. The client decodes the ID token to learn who the user is (name, email, picture) without making an extra API call.

### Stateless API Authentication

REST APIs issue a JWT at login. The client sends \`Authorization: Bearer <token>\` with every request. The server validates the signature and reads claims directly from the token — no session database lookup required.

### Service-to-Service Communication

Microservices can use JWTs to authenticate calls between services. Each service verifies the token signature and checks the \`aud\` claim to confirm the token was intended for it.

---

## Security Considerations

### Never Trust Client-Decoded Data for Authorization

Although you can decode a JWT in the browser to extract the user's name for display purposes, **never make authorization decisions based on client-side decoded claims**. Always verify the signature on the server and re-read the claims from the verified token.

### Always Verify on the Server

Your backend must validate:
- The signature is valid (using the correct secret or public key).
- The \`exp\` claim has not passed.
- The \`iss\` matches the expected issuer.
- The \`aud\` matches your service.

### The \`alg: "none"\` Vulnerability

Early JWT libraries had a critical bug: they accepted tokens with \`"alg": "none"\` and an empty signature. Always use a library that explicitly rejects the \`none\` algorithm in production.

### Keep Secrets Secret

For HS256, the HMAC secret must be kept confidential. A weak or leaked secret allows an attacker to forge arbitrary tokens. Use a cryptographically random secret of at least 256 bits.

### Short Expiration Windows

JWTs are stateless — once issued, you cannot invalidate them (without a blocklist). Use short \`exp\` windows (15–60 minutes for access tokens) and issue refresh tokens to obtain new access tokens without requiring re-login.

---

## Try It Online

Paste any JWT into the utils.live JWT Decoder to instantly see its decoded header, payload, and expiration status — all processed locally in your browser.
`,
};
