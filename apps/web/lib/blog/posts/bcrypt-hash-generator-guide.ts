import type { BlogPost } from "../types";

export const bcryptHashGeneratorGuide: BlogPost = {
  slug: "bcrypt-hash-generator-guide",
  title: "BCrypt Hash Generator: Password Hashing Best Practices",
  description:
    "Learn why bcrypt is the right choice for password hashing, how the algorithm works, and how to implement it correctly.",
  publishedAt: "2026-03-30",
  readingTimeMinutes: 10,
  category: "Crypto",
  ctaTools: [
    { name: "BCrypt Generator", href: "/tools/crypto/bcrypt-generator" },
  ],
  content: `## Why Password Hashing Is Different

When users create accounts on your application, you must store something that lets you verify their password later — but you must never store the password itself. Even in a perfectly secured database, plaintext passwords are catastrophic if the database is ever breached. The attacker immediately has every user's password, and since people reuse passwords, the breach affects accounts on other services too.

The naive solution — hashing passwords with SHA-256 or MD5 — is dangerously insufficient. General-purpose hash functions are designed to be fast. Modern hardware can compute billions of SHA-256 hashes per second. This means an attacker with a breached database of SHA-256-hashed passwords can try billions of password guesses per second, cracking most common passwords in seconds or minutes.

Password hashing requires a completely different set of properties from general cryptographic hashing:

1. **Slowness:** The hash must take long enough (50–300ms) that brute-forcing is impractical
2. **Tunable cost:** The algorithm's work factor must be adjustable to keep pace with faster hardware
3. **Salting:** Each password hash must be unique, defeating precomputed rainbow table attacks

bcrypt satisfies all three of these requirements and has been a trusted standard for password hashing since 1999.

---

## What Is bcrypt?

bcrypt is a password hashing function designed by Niels Provos and David Mazieres, based on the Blowfish block cipher. It was presented at USENIX in 1999 and has remained a standard recommendation for password hashing for over 25 years — remarkable longevity in cryptography.

The name comes from Blowfish and crypt, the traditional Unix password hashing function.

### bcrypt Output Format

A bcrypt hash looks like this:

\`\`\`
$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
\`\`\`

This is not just a hash — it is a self-contained record that includes everything needed for verification:

| Part | Example | Meaning |
|------|---------|---------|
| Version | \`$2b$\` | bcrypt algorithm version |
| Cost factor | \`12\`  | Work factor (2^12 = 4,096 iterations) |
| Salt | First 22 chars after cost | Random 128-bit salt, base64-encoded |
| Hash | Remaining 31 chars | The actual password hash |

The full string is exactly 60 characters. Because the salt is stored alongside the hash, you do not need to store the salt separately — just the bcrypt string.

---

## The Cost Factor (Work Factor)

The cost factor (also called the work factor or rounds) is the most important parameter to understand. It controls how computationally expensive the hash is to compute.

bcrypt runs \`2^cost\` iterations of its key schedule. Doubling the cost factor doubles the time to compute the hash.

| Cost factor | Approximate time on a modern server (2024) |
|-------------|-------------------------------------------|
| 10 | ~100ms |
| 11 | ~200ms |
| 12 | ~400ms |
| 13 | ~800ms |
| 14 | ~1600ms |

**The OWASP recommendation as of 2023:** Use a cost factor of 10 or higher, targeting 100ms or more per hash on your production hardware.

The key insight: as hardware gets faster, you increase the cost factor to maintain the same hashing time. bcrypt was designed for this — the cost factor is stored in the hash, so you can re-hash passwords with a higher cost factor when users next log in.

### Cost Factor Impact on Attackers

An attacker trying to brute-force bcrypt-hashed passwords faces the same cost per guess:

- With bcrypt cost 12 (~400ms per hash on a server): ~2.5 guesses per second per CPU core
- Even with 100 CPU cores: 250 guesses per second
- For a password from the top 100,000 most common passwords: ~6.7 minutes to try all of them
- For an 8-character random password (lowercase + digits, 36^8 = 2.8 trillion combinations): 357 years

Compare this to SHA-256: modern GPUs can compute ~10 billion SHA-256 hashes per second. Those same 100,000 common passwords would be cracked in under 1 millisecond.

---

## How bcrypt Works

### The Blowfish Key Schedule

bcrypt is built around Blowfish's key schedule, which is intentionally slow to initialize. Blowfish's key setup involves 18 32-bit P-entries and four 8x32-bit S-boxes, requiring 521 key-dependent computations.

### The EksBlowfish Algorithm

bcrypt uses a modified version called "Expensive Key Schedule Blowfish" (EksBlowfish):

1. **Initialize:** Set up the Blowfish state with the password and salt
2. **Iterate:** Run the Blowfish key schedule \`2^cost\` times, alternating between the salt and password as keys
3. **Encrypt:** Encrypt a magic constant ("OrpheanBeholderScryDoubt") 64 times
4. **Output:** The resulting 192-bit value, combined with the salt and cost factor, forms the final bcrypt string

The expensive key setup makes bcrypt resistant to both CPU-based and GPU-based attacks, because the memory-access patterns of the Blowfish S-boxes are difficult to optimize on GPUs.

---

## Implementing bcrypt

### Node.js

\`\`\`javascript
const bcrypt = require("bcrypt")

// Hash a password
async function hashPassword(password) {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Verify a password
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

// Usage
const hash = await hashPassword("user-password-here")
console.log(hash)
// => "$2b$12$..."

const isValid = await verifyPassword("user-password-here", hash)
console.log(isValid)  // => true
\`\`\`

### Python

\`\`\`python
import bcrypt

# Hash a password
def hash_password(password: str) -> bytes:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt)

# Verify a password
def verify_password(password: str, hashed: bytes) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed)

# Usage
hashed = hash_password("user-password-here")
is_valid = verify_password("user-password-here", hashed)
print(is_valid)  # => True
\`\`\`

### PHP

\`\`\`php
// Hash a password
$hash = password_hash($password, PASSWORD_BCRYPT, ["cost" => 12]);

// Verify a password
if (password_verify($password, $hash)) {
    // Password is correct
}

// Check if rehashing is needed (e.g., cost factor increased)
if (password_needs_rehash($hash, PASSWORD_BCRYPT, ["cost" => 12])) {
    $hash = password_hash($password, PASSWORD_BCRYPT, ["cost" => 12]);
    // Save new hash to database
}
\`\`\`

### Go

\`\`\`go
import "golang.org/x/crypto/bcrypt"

// Hash
hashed, err := bcrypt.GenerateFromPassword([]byte(password), 12)

// Verify
err = bcrypt.CompareHashAndPassword(hashed, []byte(password))
isValid := err == nil
\`\`\`

---

## bcrypt Limitations and How to Handle Them

### 72-Character Password Limit

bcrypt silently truncates passwords longer than 72 bytes. A password of 73+ characters is treated identically to its first 72 characters — creating a subtle security issue where users with long passwords might not realize they are only protecting against the first 72 characters.

**Solution:** Pre-hash with SHA-256 before bcrypt, then base64-encode the result:

\`\`\`javascript
const crypto = require("crypto")
const bcrypt = require("bcrypt")

function hashPassword(password) {
  // Pre-hash with SHA-256 to handle >72 char passwords
  const prehash = crypto
    .createHash("sha256")
    .update(password)
    .digest("base64")
  return bcrypt.hash(prehash, 12)
}

function verifyPassword(password, hash) {
  const prehash = crypto
    .createHash("sha256")
    .update(password)
    .digest("base64")
  return bcrypt.compare(prehash, hash)
}
\`\`\`

### bcrypt Is Not Memory-Hard

bcrypt is computationally expensive but not particularly memory-hard. Attackers with custom ASIC hardware can potentially compute bcrypt faster than general-purpose CPUs. For maximum security in high-value applications, consider scrypt or Argon2id, which are both memory-hard.

OWASP recommendations for 2024:
- **First choice:** Argon2id with appropriate memory (64MB+) and iteration parameters
- **Second choice:** scrypt with N=32768, r=8, p=1
- **Third choice:** bcrypt with cost factor 10+
- **Fourth choice:** PBKDF2-SHA256 with 600,000+ iterations (FIPS-compliant environments)

For most web applications, bcrypt remains an excellent and widely-supported choice.

---

## Upgrading Password Hash Algorithms

If you have an existing system using MD5 or SHA-based password hashes and need to upgrade to bcrypt, a common pattern is to migrate on login:

\`\`\`javascript
async function loginUser(username, password, db) {
  const user = await db.findUser(username)

  if (user.hashAlgorithm === "sha256") {
    // Old SHA-256 hash — verify the old way
    const oldHash = sha256(password)
    if (!timingSafeEqual(oldHash, user.passwordHash)) {
      throw new Error("Invalid password")
    }

    // Upgrade to bcrypt
    const newHash = await bcrypt.hash(password, 12)
    await db.updateUser(username, {
      passwordHash: newHash,
      hashAlgorithm: "bcrypt"
    })
  } else {
    // Modern bcrypt hash
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) throw new Error("Invalid password")
  }
}
\`\`\`

This transparently upgrades users as they log in, without requiring a forced password reset.

---

## Never Store Passwords, Only Hashes

The fundamental rule: your application should never be able to retrieve a user's password. Only the user knows their password. Your system stores a bcrypt hash, and when the user authenticates, you verify the provided password against the stored hash. If the database is breached, the attacker has only the bcrypt hashes — cracking them at meaningful scale is computationally infeasible.

---

## Generate bcrypt Hashes Instantly

Use the BCrypt Generator on utils.live to hash passwords and verify bcrypt strings in your browser. Perfect for testing authentication code, exploring different cost factors, or understanding the output format.
`,
};
