import type { BlogPost } from "../types";

export const uuidGeneratorGuide: BlogPost = {
  slug: "uuid-generator-guide",
  title: "UUID Generator: What Are UUIDs and How to Generate Them",
  description:
    "Everything you need to know about UUIDs — the differences between v1, v4, and v7, use cases, and how to generate them online.",
  publishedAt: "2026-03-29",
  readingTimeMinutes: 5,
  ctaTools: [
    {
      name: "UUID v4 Generator",
      href: "/tools/identifiers/uuid-v4-generator",
    },
  ],
  content: `## What Is a UUID?

A Universally Unique Identifier (UUID) is a 128-bit label used to identify information in computer systems. The format is standardized in [RFC 4122](https://datatracker.ietf.org/doc/html/rfc4122) and looks like this:

\`\`\`
550e8400-e29b-41d4-a716-446655440000
\`\`\`

The canonical form is 32 hexadecimal digits displayed in five groups separated by hyphens, in the pattern \`8-4-4-4-12\`. The version and variant bits are embedded within the UUID itself, so you can determine which generation method was used just by looking at a UUID.

UUIDs are designed to be globally unique without requiring central coordination. Two independently running processes can each generate a UUID and be confident they will not collide — the probability of a collision across trillions of UUIDs is astronomically small.

---

## The UUID Versions

### UUID v1 — Timestamp + MAC Address

Version 1 UUIDs are generated from the current timestamp (100-nanosecond intervals since 15 October 1582) combined with the MAC address of the generating machine.

**Pros:** Monotonically increasing within a single machine, contains creation time.

**Cons:** Leaks the generating machine's MAC address and the creation timestamp, raising privacy concerns. The timestamp bits are split across the UUID fields in a non-intuitive order, which makes sorting unreliable.

**Example:** \`6ba7b810-9dad-11d1-80b4-00c04fd430c8\`

### UUID v3 — Namespace + Name (MD5)

Version 3 UUIDs are generated deterministically by hashing a namespace UUID and a name string using MD5. Given the same namespace and name, you always get the same UUID.

**Use case:** Generating stable IDs from existing identifiers (e.g., creating a UUID for a URL or a user's email address).

**Cons:** MD5 is cryptographically broken; prefer v5 for new applications.

### UUID v4 — Random

Version 4 UUIDs are generated from 122 bits of cryptographically secure random data (the remaining 6 bits encode version and variant). They have no relationship to each other and no embedded metadata.

**Pros:** Simple, widely supported, no privacy concerns, collision probability is negligible.

**Cons:** Not sortable by time. When used as database primary keys, random v4 UUIDs cause index fragmentation in B-tree indexes (writes land in random positions rather than at the end).

**Example:** \`f47ac10b-58cc-4372-a567-0e02b2c3d479\`

This is the most commonly used UUID version for general-purpose identifiers.

### UUID v5 — Namespace + Name (SHA-1)

Version 5 works exactly like v3 but uses SHA-1 instead of MD5. It is the preferred choice when you need deterministic, namespace-scoped UUIDs.

**Use case:** Same as v3 — generating stable UUIDs from URLs, email addresses, or other named entities.

### UUID v7 — Unix Timestamp-Ordered (New)

UUID v7 is a newer version (added in a 2024 RFC update) that addresses the primary weakness of v4: database performance. It encodes a Unix millisecond timestamp in the most significant bits, making v7 UUIDs monotonically increasing and naturally sortable.

**Pros:** Time-sortable, database-friendly (sequential inserts into B-tree indexes), contains creation time.

**Cons:** Slightly less random than v4 (48 of the 128 bits are the timestamp), and support in libraries is still rolling out.

**Example:** \`01856ab0-d000-7000-8000-abc123def456\`

---

## Choosing the Right UUID Version

| Scenario                                         | Recommended Version |
|--------------------------------------------------|---------------------|
| General-purpose unique ID                        | v4                  |
| Database primary key (performance matters)       | v7                  |
| Deterministic ID from a known string             | v5                  |
| You need the creation timestamp embedded         | v7 (preferred) or v1 |
| Legacy systems requiring v1 or v3                | v1 or v3            |

**The practical rule:** Use **v4** by default. Switch to **v7** if you are using UUIDs as primary keys in a relational database and care about insert performance at scale.

---

## Common Use Cases

### Database Primary Keys

UUIDs as primary keys make distributed systems much simpler: each service or client can generate its own IDs without consulting a central authority. This is why frameworks like Hibernate, Django, and Rails all have first-class UUID support.

The trade-off is size: a UUID takes 16 bytes vs. 4 bytes for a 32-bit integer — small but worth knowing.

### Idempotency Keys

When retrying API requests (e.g., a payment that may have timed out), you send a UUID with each request. The server uses it to detect and reject duplicate requests. Stripe, Braintree, and many payment processors require an idempotency key for this reason.

### Distributed Systems and Microservices

In a system with multiple services writing to different databases, UUIDs eliminate the coordination overhead needed for auto-incrementing integers. Each service generates its own IDs independently.

### Session and Token Identifiers

Session IDs, CSRF tokens, password reset tokens, and email verification links often use random UUIDs (v4) because their unpredictability is the security property.

---

## Try It Online

Generate UUIDs instantly with the utils.live UUID Generator — single or bulk, no sign-up, no tracking, all processing happens in your browser.
`,
};
