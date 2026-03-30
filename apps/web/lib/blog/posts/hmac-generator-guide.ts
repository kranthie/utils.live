import type { BlogPost } from "../types";

export const hmacGeneratorGuide: BlogPost = {
  slug: "hmac-generator-guide",
  title: "HMAC Generator: Message Authentication Codes Explained",
  description:
    "Learn how HMAC works, why it is used for API authentication and webhook verification, and how to implement it correctly.",
  publishedAt: "2026-03-30",
  readingTimeMinutes: 9,
  category: "Crypto",
  ctaTools: [
    { name: "HMAC Generator", href: "/tools/crypto/hmac-generator" },
  ],
  content: `## What Is HMAC?

HMAC — Hash-based Message Authentication Code — is a specific construction for creating a Message Authentication Code (MAC) using a cryptographic hash function and a secret key. It was defined in [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104) in 1997 and remains a foundational security primitive in modern web development.

An HMAC provides two guarantees simultaneously:

1. **Integrity:** The message has not been tampered with since the MAC was computed.
2. **Authenticity:** The MAC was produced by someone who holds the secret key.

A plain cryptographic hash like SHA-256 provides only integrity — anyone can compute a hash, so a hash alone cannot prove that a particular party produced it. HMAC adds the secret key, making it a verifiable proof of origin.

---

## The HMAC Construction

The HMAC algorithm is defined as:

\`\`\`
HMAC(K, m) = H((K' XOR opad) || H((K' XOR ipad) || m))
\`\`\`

Where:
- \`H\` is a cryptographic hash function (e.g., SHA-256)
- \`K\` is the secret key
- \`K'\` is the key padded to the hash function's block size
- \`ipad\` is the byte \`0x36\` repeated to the block size
- \`opad\` is the byte \`0x5C\` repeated to the block size
- \`||\` denotes concatenation

In plain terms: the key is XORed with fixed padding values, the inner hash is computed over the padded key concatenated with the message, and then the outer hash wraps that result. This double-hashing construction provides provable security properties even when the underlying hash function has certain theoretical weaknesses.

### HMAC Variants

HMAC can use any cryptographic hash function. The most common variants are:

| Variant | Output size | Common uses |
|---------|-------------|-------------|
| HMAC-SHA1 | 160 bits | Legacy; avoid for new systems |
| HMAC-SHA256 | 256 bits | JWT HS256, AWS Signature V4, GitHub webhooks |
| HMAC-SHA384 | 384 bits | Higher security applications |
| HMAC-SHA512 | 512 bits | JWT HS512, maximum security |
| HMAC-MD5 | 128 bits | Legacy; do not use |

For new systems, HMAC-SHA256 is the standard choice. HMAC-SHA512 is appropriate when you need a larger output or a higher security margin.

---

## HMAC vs Plain Hashing

A common mistake is using a plain hash concatenated with a key instead of HMAC:

\`\`\`
WRONG: SHA256(key + message)
WRONG: SHA256(message + key)
RIGHT: HMAC-SHA256(key, message)
\`\`\`

The naive \`SHA256(key + message)\` construction is vulnerable to a **length extension attack**. SHA-256 is based on the Merkle-Damgard construction, which means an attacker who knows \`H(key + message)\` can compute \`H(key + message + extension)\` for any extension string, without knowing the key. This completely breaks the authentication guarantee.

HMAC's double-hash construction is specifically designed to prevent this attack. Never roll your own MAC construction — always use HMAC.

---

## HMAC in API Authentication

HMAC is widely used to authenticate API requests. The pattern works as follows:

1. The API provider gives you a secret key when you register.
2. To make a request, you construct a string to sign (often including the HTTP method, path, timestamp, and body hash).
3. You compute HMAC-SHA256 of that string using your secret key.
4. You include the HMAC in the request (usually as a header).
5. The server recomputes the HMAC using the same key and string, and compares it to the provided value.

If the HMAC matches, the server knows the request was sent by someone with the correct secret key and that the request has not been tampered with.

### AWS Signature Version 4

AWS uses a sophisticated HMAC-based signing scheme where the HMAC key is derived from the secret key, date, region, and service:

\`\`\`
kSecret = "AWS4" + secret_access_key
kDate = HMAC(kSecret, date)
kRegion = HMAC(kDate, region)
kService = HMAC(kRegion, service)
kSigning = HMAC(kService, "aws4_request")
signature = HMAC(kSigning, string_to_sign)
\`\`\`

This key derivation ensures that a signing key for one region/service cannot be used for another, limiting the blast radius if a signing key is compromised.

---

## HMAC for Webhook Verification

Webhooks (HTTP callbacks) are a common pattern where a service sends an HTTP POST to your server when an event occurs. Since your server is exposed to the internet, you need to verify that incoming webhook requests actually come from the service you subscribed to, not from an attacker.

The standard solution is HMAC. The webhook provider computes an HMAC of the request body using your shared secret and includes it in a header. Your server verifies it.

### GitHub Webhooks

GitHub signs webhook payloads with HMAC-SHA256. The signature is sent in the \`X-Hub-Signature-256\` header:

\`\`\`javascript
const crypto = require("crypto")

function verifyGitHubWebhook(payload, signature, secret) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
\`\`\`

### Stripe Webhooks

Stripe uses a similar approach with HMAC-SHA256, with an additional timestamp to prevent replay attacks:

\`\`\`javascript
function verifyStripeWebhook(payload, sigHeader, secret) {
  const [timestampPart, hmacPart] = sigHeader.split(",")
  const timestamp = timestampPart.split("=")[1]
  const signature = hmacPart.split("=")[1]

  const signedPayload = \`\${timestamp}.\${payload}\`
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex")
  )
}
\`\`\`

The timestamp prevents an attacker from recording a valid webhook request and replaying it later.

---

## HMAC in JSON Web Tokens (JWT)

JWT supports several signature algorithms. The \`HS256\`, \`HS384\`, and \`HS512\` algorithms use HMAC with SHA-256, SHA-384, and SHA-512 respectively.

A JWT with HS256 is structured as:

\`\`\`
header.payload.signature
\`\`\`

Where the signature is:

\`\`\`
HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)
\`\`\`

This allows any party with the shared secret to both create and verify JWTs. For use cases where only the issuer should create tokens (like an auth server), asymmetric algorithms (RS256, ES256) are preferred because the public key for verification can be shared without revealing the private signing key.

---

## Implementing HMAC in Code

### Node.js

\`\`\`javascript
const crypto = require("crypto")

function computeHmac(key, message, algorithm = "sha256") {
  return crypto
    .createHmac(algorithm, key)
    .update(message)
    .digest("hex")
}

const mac = computeHmac("my-secret-key", "Hello, world!")
console.log(mac)
\`\`\`

### Python

\`\`\`python
import hmac
import hashlib

def compute_hmac(key: str, message: str) -> str:
    return hmac.new(
        key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

mac = compute_hmac("my-secret-key", "Hello, world!")
print(mac)
\`\`\`

### Go

\`\`\`go
import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
)

func computeHMAC(key, message string) string {
    mac := hmac.New(sha256.New, []byte(key))
    mac.Write([]byte(message))
    return hex.EncodeToString(mac.Sum(nil))
}
\`\`\`

### Browser (Web Crypto API)

\`\`\`javascript
async function computeHmac(key, message) {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const messageData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData)
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}
\`\`\`

---

## Critical: Use Constant-Time Comparison

When verifying an HMAC, **never use a regular string comparison**. Normal string comparison returns as soon as it finds a mismatch, which creates a timing side-channel:

\`\`\`javascript
// WRONG - timing attack vulnerable
if (receivedMac === expectedMac) { ... }

// RIGHT - constant time comparison
if (crypto.timingSafeEqual(Buffer.from(receivedMac), Buffer.from(expectedMac))) { ... }
\`\`\`

An attacker can measure response times to determine how many bytes of their guessed HMAC matched the expected value, eventually discovering the expected HMAC byte by byte. Constant-time comparison prevents this.

In Python, use \`hmac.compare_digest()\`. In Go, use \`hmac.Equal()\`. Most cryptography libraries provide a safe comparison function.

---

## Key Management Best Practices

The security of HMAC depends entirely on the secrecy of the key:

- **Use a cryptographically random key.** Generate keys with \`crypto.randomBytes(32)\` (Node.js), \`secrets.token_bytes(32)\` (Python), or an equivalent CSPRNG. A 32-byte (256-bit) random key is standard for HMAC-SHA256.
- **Never hardcode keys** in source code. Use environment variables or a secrets manager.
- **Use different keys for different purposes.** Don't use the same key for webhook verification, JWT signing, and API authentication.
- **Rotate keys periodically.** Design your system to support key rotation without downtime.
- **Keep keys server-side.** HMAC requires the key to verify signatures. If users have the key, they can forge signatures.

---

## Test and Debug HMAC Signatures Instantly

Computing and verifying HMAC signatures by hand during development can be tedious. The HMAC Generator on utils.live lets you compute HMAC values for any key, message, and hash algorithm instantly — perfect for debugging webhook verification code or testing API signing implementations.
`,
};
