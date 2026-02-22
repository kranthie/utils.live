import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Raw email headers"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed email headers as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const headers: Record<string, string | string[]> = {};
  const lines = input.input.split(/\r?\n/);
  let currentKey = "";
  let currentValue = "";

  for (const line of lines) {
    // Empty line signals end of headers
    if (line.trim() === "") break;

    // Continuation line (starts with whitespace)
    if (/^\s/.test(line) && currentKey) {
      currentValue += " " + line.trim();
      continue;
    }

    // Save previous header
    if (currentKey) {
      const existing = headers[currentKey];
      if (existing) {
        if (Array.isArray(existing)) {
          existing.push(currentValue);
        } else {
          headers[currentKey] = [existing, currentValue];
        }
      } else {
        headers[currentKey] = currentValue;
      }
    }

    // Parse new header
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      currentKey = line.substring(0, colonIdx).trim();
      currentValue = line.substring(colonIdx + 1).trim();
    }
  }

  // Save last header
  if (currentKey) {
    const existing = headers[currentKey];
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(currentValue);
      } else {
        headers[currentKey] = [existing, currentValue];
      }
    } else {
      headers[currentKey] = currentValue;
    }
  }

  // Extract key information
  const result: Record<string, unknown> = {
    headers,
    summary: {
      from: headers["From"] ?? headers["from"] ?? "",
      to: headers["To"] ?? headers["to"] ?? "",
      subject: headers["Subject"] ?? headers["subject"] ?? "",
      date: headers["Date"] ?? headers["date"] ?? "",
      messageId:
        headers["Message-ID"] ??
        headers["Message-Id"] ??
        headers["message-id"] ??
        "",
    },
  };

  // Trace route (Received headers)
  const received = headers["Received"] ?? headers["received"];
  if (received) {
    result.receivedHops = Array.isArray(received) ? received.length : 1;
  }

  // Authentication results
  const authResults =
    headers["Authentication-Results"] ?? headers["authentication-results"];
  if (authResults) {
    result.authenticationResults = authResults;
  }

  const spf = headers["Received-SPF"] ?? headers["received-spf"];
  if (spf) result.spf = spf;

  const dkim = headers["DKIM-Signature"] ?? headers["dkim-signature"];
  if (dkim) result.hasDkim = true;

  return { output: JSON.stringify(result, null, 2) };
}

export const emailHeaderParser = defineTool({
  meta: {
    id: "communication/email-header-parser",
    name: "Email Header Parser",
    description:
      "Free online email header parser — paste raw SMTP headers and get structured JSON instantly in your browser. No data is stored. Extracts From, To, Subject, Date, Message-ID, traces Received hops, and detects SPF/DKIM authentication.",
    category: "communication",
    subgroup: "Email",
    tier: ToolTier.CLIENT,
    keywords: [
      "email",
      "header",
      "parse",
      "smtp",
      "mail",
      "received",
      "trace",
      "routing",
      "rfc822",
      "mta",
    ],
    examples: [
      {
        title: "Headers with Received hop trace",
        description:
          "Parse SMTP headers including two Received hops to trace delivery path",
        input:
          "From: Jane Doe <jane@example.com>\nTo: support@example.com\nSubject: Invoice #4021 attached\nDate: Mon, 13 Jan 2025 14:22:00 +0000\nMessage-ID: <msg-4021@mail.example.com>\nReceived: from smtp.example.com (10.0.0.1) by mx.example.com; Mon, 13 Jan 2025 14:22:01 +0000\nReceived: from client.example.com (192.168.1.5) by smtp.example.com; Mon, 13 Jan 2025 14:21:59 +0000",
        output:
          '{\n  "headers": {\n    "From": "Jane Doe <jane@example.com>",\n    "To": "support@example.com",\n    "Subject": "Invoice #4021 attached",\n    "Date": "Mon, 13 Jan 2025 14:22:00 +0000",\n    "Message-ID": "<msg-4021@mail.example.com>",\n    "Received": [\n      "from smtp.example.com (10.0.0.1) by mx.example.com; Mon, 13 Jan 2025 14:22:01 +0000",\n      "from client.example.com (192.168.1.5) by smtp.example.com; Mon, 13 Jan 2025 14:21:59 +0000"\n    ]\n  },\n  "summary": {\n    "from": "Jane Doe <jane@example.com>",\n    "to": "support@example.com",\n    "subject": "Invoice #4021 attached",\n    "date": "Mon, 13 Jan 2025 14:22:00 +0000",\n    "messageId": "<msg-4021@mail.example.com>"\n  },\n  "receivedHops": 2\n}',
      },
    ],
    ui: { outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
