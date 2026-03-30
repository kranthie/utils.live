import type { BlogPost } from "../types";

export const aesEncryptionGuide: BlogPost = {
  slug: "aes-encryption-guide",
  title: "AES Encryption Online: Symmetric Encryption Explained",
  description:
    "Understand how AES encryption works, the difference between AES modes, and when to use symmetric vs asymmetric encryption.",
  publishedAt: "2026-03-30",
  readingTimeMinutes: 11,
  category: "Crypto",
  ctaTools: [
    { name: "AES Encryption Tool", href: "/tools/crypto/aes-encrypt" },
  ],
  content: `## What Is AES?

AES — the Advanced Encryption Standard — is a symmetric block cipher adopted as a US federal standard in 2001. It replaced DES (Data Encryption Standard) and 3DES, which had become inadequate due to their smaller key sizes.

AES was selected through a public competition run by NIST. The winning algorithm, Rijndael, was designed by Belgian cryptographers Joan Daemen and Vincent Rijmen. It was chosen for its combination of strong security, efficient software and hardware implementation, and elegant mathematical structure.

"Symmetric" means the same key is used for both encryption and decryption — in contrast to asymmetric (public-key) encryption, where a key pair is used. AES is fast, widely supported, and is the most widely deployed encryption algorithm in the world.

---

## AES Key Sizes

AES supports three key lengths, each providing a different security level:

| Key Size | Security Level | Use Case |
|----------|---------------|----------|
| AES-128 | 128 bits | Standard; more than sufficient for most applications |
| AES-192 | 192 bits | Rare; between 128 and 256 |
| AES-256 | 256 bits | High security; required by some standards (NSA Suite B) |

Despite the name difference, AES-128, AES-192, and AES-256 all use the same block size of 128 bits. The key size affects the number of rounds:
- AES-128: 10 rounds
- AES-192: 12 rounds
- AES-256: 14 rounds

AES-128 is generally considered secure for all practical purposes — a brute-force attack would require 2^128 operations. AES-256 provides a larger margin, which is important for post-quantum security considerations (a quantum computer with Grover's algorithm would effectively halve the security level, reducing AES-256 to 128-bit security).

---

## How AES Works (High Level)

AES operates on 128-bit (16-byte) blocks of data. If your plaintext is longer than 16 bytes, a **mode of operation** determines how multiple blocks are processed.

### The Key Schedule

Before encryption begins, AES expands the original key into a series of round keys using a key schedule algorithm. Each round uses a different derived round key.

### The Four Operations

Each round of AES (except the last) applies four operations in sequence:

1. **SubBytes:** Each byte of the block is substituted using a fixed lookup table (the S-Box). This provides non-linearity, which is essential for security.

2. **ShiftRows:** The rows of the 4x4 byte matrix are cyclically shifted by different amounts (0, 1, 2, and 3 positions). This provides diffusion across columns.

3. **MixColumns:** Each column of the matrix is multiplied by a fixed polynomial in a Galois Field (GF(2^8)). This mixes the bytes within each column, providing further diffusion.

4. **AddRoundKey:** The current block is XORed with the round key derived from the key schedule.

The final round omits the MixColumns step.

### Decryption

AES decryption runs the inverse of each operation in reverse order. The inverse S-Box (InvSubBytes), inverse shift (InvShiftRows), and inverse column mix (InvMixColumns) undo the encryption transformations.

---

## Modes of Operation

A single AES operation encrypts exactly one 128-bit block. For real data, you need a **mode of operation** that specifies how to handle multiple blocks. The choice of mode dramatically affects security properties.

### ECB (Electronic Codebook) — Never Use This

ECB encrypts each block independently with the same key. This is catastrophically insecure: identical plaintext blocks produce identical ciphertext blocks, leaking patterns in the data.

The classic illustration is the "ECB penguin" — encrypting an image with ECB preserves the visual structure of the original image in the ciphertext. ECB should never be used except in very specific low-level building-block scenarios.

### CBC (Cipher Block Chaining)

CBC XORs each plaintext block with the previous ciphertext block before encrypting. The first block is XORed with a random **Initialization Vector (IV)**.

**Key properties:**
- Requires a random, unique IV for each encryption (never reuse an IV with the same key)
- Encryption is sequential (cannot be parallelized)
- Decryption can be parallelized
- Vulnerable to padding oracle attacks if not implemented carefully
- Requires padding to fill the last block to 16 bytes (typically PKCS#7 padding)

CBC was the standard mode for many years but has largely been superseded by authenticated encryption modes.

### CTR (Counter Mode)

CTR converts AES from a block cipher into a stream cipher. It encrypts successive values of a counter, producing a keystream that is XORed with the plaintext.

**Key properties:**
- Requires a unique nonce (number used once) per encryption
- Encryption and decryption are identical operations (XOR with keystream)
- Fully parallelizable — blocks can be encrypted/decrypted in any order
- No padding required
- Does NOT provide authentication — a separate MAC is needed

### GCM (Galois/Counter Mode) — The Modern Standard

GCM combines CTR mode encryption with a Galois field authentication tag, providing **Authenticated Encryption with Associated Data (AEAD)**. This is the recommended mode for virtually all new applications.

**Key properties:**
- Encrypts and authenticates in a single pass
- The authentication tag (typically 128 bits) detects any tampering with the ciphertext
- Supports Additional Authenticated Data (AAD) — metadata that is authenticated but not encrypted
- Requires a unique 96-bit nonce per encryption (critical — nonce reuse catastrophically breaks GCM)
- Fully parallelizable
- No padding required

GCM is used in TLS 1.2 and 1.3 (AES-128-GCM and AES-256-GCM cipher suites), HTTPS, and most modern encrypted protocols.

---

## Authenticated Encryption: Why It Matters

Using AES in CBC or CTR mode without authentication is dangerous. Without a MAC, an attacker can modify the ciphertext, and the decryption will succeed but produce corrupted plaintext. This enables attacks like:

- **Bit-flipping attacks:** Flipping bits in the ciphertext predictably flips bits in the decrypted plaintext in CTR mode
- **Padding oracle attacks:** In CBC mode, an attacker can exploit error messages about invalid padding to decrypt ciphertext byte by byte

The solution is **Encrypt-then-MAC**: encrypt the data, then compute a MAC (e.g., HMAC-SHA256) over the ciphertext. Verify the MAC before decrypting.

Even better, use an AEAD mode like GCM, which handles both encryption and authentication in one operation.

---

## Initialization Vectors and Nonces

IVs (Initialization Vectors) and nonces are closely related but have different requirements depending on the mode:

**For CBC mode:**
- Must be random and unpredictable (not just unique)
- 16 bytes (128 bits)
- Safe to transmit alongside the ciphertext

**For GCM mode:**
- Must be unique — never reuse a nonce with the same key, ever
- 12 bytes (96 bits) recommended by the specification
- Can be a random value (statistically safe if generated properly) or a counter
- If you encrypt more than ~2^32 messages with the same key, random nonce collision probability becomes non-negligible — rotate your key

The IV/nonce is not secret. It is transmitted alongside the ciphertext.

---

## Key Derivation

Raw user-provided passwords must never be used directly as AES keys. Passwords are low-entropy and variable-length; AES keys must be high-entropy and fixed-length.

Use a **Key Derivation Function (KDF)** to derive a key from a password:

### PBKDF2

\`\`\`javascript
const { pbkdf2 } = require("crypto")

pbkdf2(password, salt, 600000, 32, "sha256", (err, key) => {
  // key is a 32-byte Buffer suitable for AES-256
})
\`\`\`

PBKDF2 with SHA-256, at least 600,000 iterations (NIST 2023 recommendation), and a random 16-byte salt.

### scrypt

\`\`\`javascript
const { scrypt } = require("crypto")

scrypt(password, salt, 32, { N: 131072, r: 8, p: 1 }, (err, key) => {
  // key is a 32-byte Buffer suitable for AES-256
})
\`\`\`

scrypt is memory-hard and more resistant to GPU/ASIC attacks than PBKDF2.

### Argon2

The winner of the Password Hashing Competition (2015). Argon2id is the recommended variant for password-based key derivation. Use a library like \`argon2\` in Node.js.

---

## AES Implementation Example

\`\`\`javascript
const { randomBytes, createCipheriv, createDecipheriv } = require("crypto")

function encrypt(plaintext, key) {
  const nonce = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, nonce)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ])
  const tag = cipher.getAuthTag()

  // Prepend nonce and tag to ciphertext for storage/transmission
  return Buffer.concat([nonce, tag, ciphertext]).toString("base64")
}

function decrypt(encoded, key) {
  const data = Buffer.from(encoded, "base64")
  const nonce = data.subarray(0, 12)
  const tag = data.subarray(12, 28)
  const ciphertext = data.subarray(28)

  const decipher = createDecipheriv("aes-256-gcm", key, nonce)
  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString("utf8")
}
\`\`\`

---

## AES vs RSA: Symmetric vs Asymmetric Encryption

| Property | AES (Symmetric) | RSA (Asymmetric) |
|----------|----------------|-----------------|
| Keys | Same key for encrypt and decrypt | Public key encrypts, private key decrypts |
| Speed | Very fast (GB/s) | Very slow (KB/s for encryption) |
| Key size | 128–256 bits | 2048–4096 bits |
| Key distribution | Requires secure channel to share key | Public key can be shared openly |
| Use case | Bulk data encryption | Key exchange, signatures |

In practice, most systems use both: RSA or Elliptic Curve (ECDH) to establish a shared secret, then AES to encrypt the actual data. This is exactly how TLS works.

---

## Encrypt and Decrypt Data with AES Instantly

Use the AES Encryption Tool on utils.live to encrypt and decrypt text with AES-256-GCM directly in your browser. Useful for exploring how AES encryption works, testing key and IV combinations, or encrypting small pieces of data for storage or transmission.
`,
};
