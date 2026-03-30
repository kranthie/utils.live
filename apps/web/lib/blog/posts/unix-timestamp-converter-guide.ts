import type { BlogPost } from "../types";

export const unixTimestampConverterGuide: BlogPost = {
  slug: "unix-timestamp-converter-guide",
  title: "Unix Timestamp Converter: Working with Epoch Time",
  description:
    "Learn what Unix timestamps are, how epoch time works, and how to convert timestamps in any programming language.",
  publishedAt: "2026-03-30",
  readingTimeMinutes: 8,
  category: "DateTime",
  ctaTools: [
    { name: "Unix Timestamp Converter", href: "/tools/datetime/unix-timestamp" },
  ],
  content: `## What Is a Unix Timestamp?

A Unix timestamp is an integer that represents a point in time as the number of seconds elapsed since the **Unix Epoch**: midnight on January 1, 1970, Coordinated Universal Time (UTC). It is also called epoch time, POSIX time, or Unix time.

For example, the timestamp \`1711756800\` represents \`2024-03-30 00:00:00 UTC\`.

Unix timestamps are the backbone of time handling in nearly every operating system, database, and programming environment. They are simple, unambiguous, and time-zone independent — properties that make them ideal for storing and transmitting time data.

---

## Why Does the Epoch Start on January 1, 1970?

The Unix epoch was established in the early 1970s when Unix was developed at Bell Labs. The choice of January 1, 1970 was somewhat arbitrary — it was a convenient recent date that fit neatly as a round number and allowed the 32-bit integer systems of the time to represent dates far into the future.

The original Unix systems used 32-bit signed integers for timestamps. A 32-bit signed integer can hold values from approximately \`-2,147,483,648\` to \`2,147,483,647\`. Starting from the epoch, 32-bit timestamps would overflow on **January 19, 2038** at 03:14:07 UTC — the notorious "Year 2038 problem" (Y2K38). Modern 64-bit systems resolve this: a 64-bit Unix timestamp can represent dates roughly 292 billion years in either direction from the epoch.

---

## Seconds vs Milliseconds vs Microseconds

Unix timestamps come in several granularities, and confusing them is a common source of bugs:

| Unit | Typical value (March 2024) | Used by |
|------|--------------------------|---------|
| Seconds | \`1711756800\` | Unix shell, most C APIs, databases |
| Milliseconds | \`1711756800000\` | JavaScript \`Date.now()\`, Java, many REST APIs |
| Microseconds | \`1711756800000000\` | High-resolution timers, Python \`time.time_ns()\` |
| Nanoseconds | \`1711756800000000000\` | Linux \`CLOCK_REALTIME\`, Go \`time.UnixNano()\` |

The most common confusion is between seconds and milliseconds. A timestamp of \`1711756800\` is 13 digits as milliseconds vs 10 digits as seconds. As a rough rule: if your timestamp is 10 digits, it is in seconds; if it is 13 digits, it is in milliseconds.

\`\`\`javascript
// JavaScript always works in milliseconds
const nowMs = Date.now()         // e.g., 1711756800000
const nowS = Math.floor(nowMs / 1000)  // convert to seconds

// Convert back to a Date object from seconds
const date = new Date(1711756800 * 1000)
\`\`\`

---

## Converting Timestamps in Code

### JavaScript / TypeScript

\`\`\`javascript
// Current Unix timestamp in seconds
const unixSeconds = Math.floor(Date.now() / 1000)

// Current timestamp in milliseconds
const unixMs = Date.now()

// Convert a Unix timestamp (seconds) to a Date object
const date = new Date(1711756800 * 1000)
console.log(date.toISOString())  // => "2024-03-30T00:00:00.000Z"

// Convert a Date to Unix timestamp (seconds)
const ts = Math.floor(new Date("2024-03-30T00:00:00Z").getTime() / 1000)
console.log(ts)  // => 1711756800

// Format a timestamp for display
const formatted = new Date(1711756800 * 1000).toLocaleString("en-US", {
  timeZone: "America/New_York",
})
\`\`\`

### Python

\`\`\`python
import time
from datetime import datetime, timezone

# Current Unix timestamp (float, with fractional seconds)
ts = time.time()

# Convert timestamp to datetime (UTC)
dt = datetime.fromtimestamp(1711756800, tz=timezone.utc)
print(dt.isoformat())  # => 2024-03-30T00:00:00+00:00

# Convert datetime to timestamp
dt = datetime(2024, 3, 30, tzinfo=timezone.utc)
ts = dt.timestamp()
print(int(ts))  # => 1711756800
\`\`\`

### Go

\`\`\`go
import (
    "fmt"
    "time"
)

// Current Unix timestamp
now := time.Now().Unix()

// Convert timestamp to time.Time
t := time.Unix(1711756800, 0).UTC()
fmt.Println(t.Format(time.RFC3339))  // => 2024-03-30T00:00:00Z

// Convert time.Time to timestamp
ts := time.Date(2024, 3, 30, 0, 0, 0, 0, time.UTC).Unix()
fmt.Println(ts)  // => 1711756800
\`\`\`

### SQL (PostgreSQL)

\`\`\`sql
-- Convert Unix timestamp to timestamp
SELECT to_timestamp(1711756800);
-- => 2024-03-30 00:00:00+00

-- Convert timestamp to Unix timestamp
SELECT EXTRACT(EPOCH FROM TIMESTAMP WITH TIME ZONE '2024-03-30 00:00:00 UTC');
-- => 1711756800

-- Get current Unix timestamp
SELECT EXTRACT(EPOCH FROM NOW());
\`\`\`

---

## Time Zones and Unix Timestamps

A crucial property of Unix timestamps is that they are **always UTC**. A timestamp of \`1711756800\` represents the same instant in time everywhere on Earth. Time zones only matter when converting a timestamp to a human-readable date/time string for display.

This is a common source of confusion:

\`\`\`javascript
// Same timestamp, different display times
const ts = 1711756800 * 1000

new Date(ts).toLocaleString("en-US", { timeZone: "UTC" })
// => "3/30/2024, 12:00:00 AM"

new Date(ts).toLocaleString("en-US", { timeZone: "America/New_York" })
// => "3/29/2024, 8:00:00 PM"  (UTC-4 in DST)

new Date(ts).toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
// => "3/30/2024, 9:00:00 AM"  (UTC+9)
\`\`\`

The underlying timestamp is identical in all three cases. The time zone only affects how it is displayed.

**Best practice:** Store all timestamps as UTC in your database. Apply time zone conversion only when displaying to users, using the user's local time zone preference.

---

## ISO 8601 and Unix Timestamps

ISO 8601 is the international standard for date/time strings (e.g., \`"2024-03-30T00:00:00Z"\`). Unix timestamps and ISO 8601 strings are two common ways to represent the same moment:

| Format | Example | Pros | Cons |
|--------|---------|------|------|
| Unix timestamp (s) | \`1711756800\` | Compact, easy arithmetic | Not human-readable |
| Unix timestamp (ms) | \`1711756800000\` | Native in JavaScript | Even less readable |
| ISO 8601 | \`"2024-03-30T00:00:00Z"\` | Human-readable, widely supported | Longer, string sorting depends on format |

For APIs, ISO 8601 with explicit UTC offset (\`Z\` or \`+00:00\`) is generally preferred for readability. For databases and internal storage, either works; integers are slightly more efficient to index and compare.

---

## Arithmetic with Timestamps

One of the biggest advantages of Unix timestamps is that time arithmetic is just integer arithmetic:

\`\`\`javascript
const ONE_HOUR = 3600
const ONE_DAY = 86400
const ONE_WEEK = 604800

const now = Math.floor(Date.now() / 1000)

const oneHourAgo = now - ONE_HOUR
const tomorrow = now + ONE_DAY
const nextWeek = now + ONE_WEEK

// How many days since a past event?
const eventTs = 1700000000
const daysSince = Math.floor((now - eventTs) / ONE_DAY)
\`\`\`

Contrast this with date object arithmetic, which requires handling month boundaries, leap years, DST transitions, and so on. For durations measured in fixed units (seconds, minutes, hours, days), timestamp arithmetic is far simpler.

For calendar-based arithmetic (e.g., "add one month," "find the last business day of the quarter"), use a proper date library like Temporal (native JS), date-fns, or Luxon, which handle all the edge cases correctly.

---

## Daylight Saving Time Pitfalls

Daylight Saving Time (DST) is a recurring source of bugs when working with local time zones. Key facts:

- When DST begins, clocks "spring forward" — one hour is skipped. A local time in that skipped hour is ambiguous.
- When DST ends, clocks "fall back" — one hour occurs twice. A local time in that repeated hour is ambiguous.
- Not all countries observe DST, and transition dates vary by jurisdiction.
- DST rules change periodically (governments change them).

Unix timestamps are immune to these problems because they are UTC. If you store and transmit timestamps as UTC Unix time, DST never affects your data. Bugs arise only when converting to local time for display.

---

## The Y2038 Problem

Systems using 32-bit signed integers for Unix timestamps will overflow at \`2,147,483,647\` seconds past the epoch — which falls on **January 19, 2038 at 03:14:07 UTC**. After this point, a 32-bit timestamp rolls over to negative values, representing dates in 1901.

Many embedded systems, older databases, and legacy code still use 32-bit timestamps. The fix is straightforward: use 64-bit integers. Most modern languages and databases already do this by default. However, data stored as 32-bit integers in files, databases, or binary protocols may require migration.

---

## Convert Timestamps Instantly

Need to know what a Unix timestamp means in human-readable time, or convert a date to a timestamp for an API call? The Unix Timestamp Converter on utils.live handles both directions instantly — no installation required.
`,
};
