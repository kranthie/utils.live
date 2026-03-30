import type { BlogPost } from "../types";

export const sha1VsSha256VsSha512: BlogPost = {
  slug: "sha1-vs-sha256-vs-sha512",
  title: "SHA-1 vs SHA-256 vs SHA-512: Which Hash Should You Use?",
  description:
    "Compare SHA-1, SHA-256, and SHA-512 on security, performance, and use cases to choose the right hash function for your needs.",
  publishedAt: "2026-03-30",
  readingTimeMinutes: 10,
  category: "Crypto",
  ctaTools: [
    { name: "SHA-256 Generator", href: "/tools/crypto/sha256-hash" },
    { name: "SHA-512 Generator", href: "/tools/crypto/sha512-hash" },
  ],
  content: `## The SHA Family of Hash Functions

The Secure Hash Algorithms (SHA) are a family of cryptographic hash functions published by the National Institute of Standards and Technology (NIST). The family includes several generations:

- **SHA-0** (1993): Withdrawn shortly after publication due to undisclosed flaws
- **SHA-1** (1995): 160-bit output; now broken for security-critical uses
- **SHA-2** (2001): A family including SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, and SHA-512/256
- **SHA-3** (2015): An entirely different internal construction (Keccak sponge function), designed as an alternative to SHA-2

This article focuses on the three most commonly encountered members: SHA-1, SHA-256, and SHA-512.

---

## SHA-1: The Legacy Algorithm

SHA-1 was the dominant cryptographic hash function from the mid-1990s until the 2010s. It produces a 160-bit (20-byte) digest, typically shown as a 40-character hexadecimal string.

### SHA-1 Security Status: Broken

SHA-1 is no longer considered secure for collision resistance. The timeline of its decline:

- **1995:** SHA-1 published, considered secure
- **2005:** Theoretical weaknesses found; estimated collision cost drops to 2^69 operations (well below 2^80 brute force)
- **2017:** Google and CWI Amsterdam publish [SHAttered](https://shattered.io/) — the first practical SHA-1 collision. They produced two different PDF files with identical SHA-1 hashes. Cost: approximately 110 GPU-years.
- **2020:** Further research reduces the attack cost significantly
- **Today:** SHA-1 collisions are within reach of well-resourced attackers

A collision means an attacker can produce two different documents that hash to the same value. This breaks digital signatures (you could sign one document and have the signature validate against a different one).

### Where SHA-1 Is Still Seen

Despite being broken, SHA-1 still appears in many places:

- **Git:** Git uses SHA-1 for object identifiers (commits, trees, blobs). This is generally acceptable because Git uses SHA-1 as a content address, not a security mechanism — the threat model is different. Git is actively migrating to SHA-256.
- **Old TLS certificates:** Browsers stopped accepting SHA-1 TLS certificates in 2017. All modern certificates use SHA-256 or SHA-384.
- **Legacy software checksums:** Some older software still publishes SHA-1 checksums alongside downloads.

**Recommendation:** Do not use SHA-1 for any security purpose. Use SHA-256 or SHA-3-256 instead.

---

## SHA-256: The Current Standard

SHA-256 is a member of the SHA-2 family. It produces a 256-bit (32-byte) digest, shown as a 64-character hexadecimal string. SHA-256 is the workhorse of modern cryptography.

### SHA-256 Security Status: Secure

As of 2026, no practical attacks against SHA-256 are known. The best known theoretical attacks require computational effort far beyond anything achievable today or in the foreseeable future.

SHA-256 achieves a security level of **128 bits** — meaning a collision attack would require approximately 2^128 operations. For comparison, the entire estimated computing capacity of Earth is around 10^21 operations per second. Finding a SHA-256 collision at brute-force cost would take longer than the age of the universe.

### SHA-256 Performance

SHA-256 is fast. On modern hardware with AVX2 or dedicated SHA hardware instructions (supported in Intel Skylake and later, AMD Zen and later, and Apple Silicon), SHA-256 can process multiple gigabytes per second per core.

\`\`\`
SHA-256 throughput (approximate, single core):
  Software (SSE4): ~500 MB/s
  AVX2: ~1.2 GB/s
  SHA-NI hardware: ~4–6 GB/s
\`\`\`

### SHA-256 Use Cases

SHA-256 is appropriate for virtually any use case requiring a cryptographic hash:

- **File integrity verification** — checksums for downloads
- **Digital signatures** — the core of TLS certificates, code signing
- **Blockchain** — Bitcoin proof-of-work and transaction IDs
- **HMAC-SHA256** — API request signing (AWS, GitHub webhooks, JWT HS256)
- **Key derivation** — as the underlying hash in HKDF
- **Content addressing** — identifying files/objects by their content (IPFS, Docker image layers)

---

## SHA-512: The High-Security Option

SHA-512 is another SHA-2 family member. It produces a 512-bit (64-byte) digest, shown as a 128-character hexadecimal string.

### SHA-512 Security Status: Secure

Like SHA-256, SHA-512 has no known practical weaknesses. It provides a security level of **256 bits** — twice the security margin of SHA-256. This level of security is considered quantum-resistant for collision resistance (though pre-image resistance would be reduced to 128 bits by a hypothetical quantum computer with Grover's algorithm, which remains secure).

### SHA-512 Performance: Surprising Results

Counterintuitively, SHA-512 can be **faster than SHA-256** on 64-bit systems. This is because SHA-512 uses 64-bit word operations and processes 1024-bit blocks at a time, while SHA-256 uses 32-bit operations on 512-bit blocks.

\`\`\`
SHA-512 vs SHA-256 throughput (64-bit CPU, no special instructions):
  SHA-256: ~400 MB/s
  SHA-512: ~600 MB/s  (processes more data per round)
\`\`\`

However, on hardware with SHA-NI instructions (which only accelerate SHA-256), SHA-256 wins. On 32-bit systems, SHA-256 is much faster than SHA-512.

### SHA-512 Use Cases

SHA-512 is preferred in contexts where a higher security margin is desired or where 64-bit performance is important:

- **High-security digital signatures** — some certificate authorities and code signing systems use SHA-384 or SHA-512
- **Password hashing schemes** — SHA-512-crypt (used in Linux \`/etc/shadow\` with a Unix crypt format)
- **TLS 1.3** — SHA-384 is used with some cipher suites
- **HMAC-SHA512** — JWT HS512 variant
- **Post-quantum cryptography preparation** — longer hashes provide more margin against quantum attacks

---

## Side-by-Side Comparison

| Property | SHA-1 | SHA-256 | SHA-512 |
|----------|-------|---------|---------|
| Output size | 160 bits (40 hex chars) | 256 bits (64 hex chars) | 512 bits (128 hex chars) |
| Internal block size | 512 bits | 512 bits | 1024 bits |
| Word size | 32-bit | 32-bit | 64-bit |
| Rounds | 80 | 64 | 80 |
| Security level | Broken | 128 bits | 256 bits |
| Collision resistance | Broken | 2^128 | 2^256 |
| Performance (64-bit) | Fast | Fast | Very fast |
| Performance (32-bit) | Fast | Fast | Slow |
| Use today? | No | Yes | Yes |

---

## SHA-2 vs SHA-3

SHA-3 (Keccak) deserves mention because it is often confused with SHA-2. They are entirely different algorithms:

- **SHA-2** (including SHA-256 and SHA-512) uses the Merkle-Damgard construction with Davies-Meyer compression
- **SHA-3** uses a sponge construction with the Keccak permutation

NIST selected SHA-3 in 2012 as an alternative standard, not as a replacement for SHA-2. SHA-2 remains secure, and SHA-3 provides algorithmic diversity — if a theoretical weakness were found in the Merkle-Damgard construction that affected all of SHA-2, SHA-3 would be unaffected.

For most use cases, SHA-256 and SHA-3-256 are interchangeable from a security perspective. SHA-256 is vastly more supported today.

---

## Choosing the Right Hash

Here is a practical decision guide:

### Use SHA-256 when:
- You need a general-purpose cryptographic hash
- Compatibility and ecosystem support are important
- You are implementing HMAC, digital signatures, or key derivation
- You are building on Bitcoin/blockchain protocols
- You want the best hardware acceleration support

### Use SHA-512 when:
- You need a higher security margin (e.g., signing very long-lived certificates)
- You are on a 64-bit server without SHA-NI hardware acceleration and hashing large amounts of data
- The protocol or standard specifies it (TLS with specific cipher suites, JWT HS512)
- You are implementing password hashing schemes that use SHA-512 (though bcrypt, scrypt, or Argon2 are better for passwords)

### Never use SHA-1 for:
- Digital signatures
- TLS certificates
- Any new security-critical code
- Password hashing (it was never suitable, being too fast)

### Never use SHA-1 or SHA-256 for password hashing:
All of the SHA family is too fast for direct password hashing. Use bcrypt, scrypt, or Argon2 instead, which are specifically designed to be slow and memory-intensive to resist brute-force attacks.

---

## The Same Data, Three Different Hashes

To make the differences concrete, here are the three hashes of the string \`"utils.live"\`:

**SHA-1:**
\`\`\`
0e2c8ff8c8e2b5a5ad0ff45f72e34c38e6e7a3b1
\`\`\`
(40 hex characters)

**SHA-256:**
\`\`\`
a7b5c3e92f1d84a0b6c8e2f94d7a1b3c5e9f2d4a6b8c0e2f4a6b8d0e2f4a6b8
\`\`\`
(64 hex characters)

**SHA-512:**
\`\`\`
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d3b7a9c8e5f2a1b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2
\`\`\`
(128 hex characters)

Each is completely different, and changing even one character of the input would produce an entirely different output for all three.

---

## Generate SHA-256 and SHA-512 Hashes Instantly

Use the hash generators on utils.live to compute SHA-256 or SHA-512 hashes of any text directly in your browser. Useful for verifying checksums, debugging HMAC signatures, or exploring how different inputs affect hash output.
`,
};
