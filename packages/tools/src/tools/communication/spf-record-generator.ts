import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  domain: z.string().default("example.com").describe("Your domain name"),
  includeGoogle: z
    .boolean()
    .default(false)
    .describe("Include Google Workspace"),
  includeMicrosoft: z
    .boolean()
    .default(false)
    .describe("Include Microsoft 365"),
  includeMailgun: z.boolean().default(false).describe("Include Mailgun"),
  includeSendgrid: z.boolean().default(false).describe("Include SendGrid"),
  includeAmazonSes: z.boolean().default(false).describe("Include Amazon SES"),
  customIps: z
    .string()
    .optional()
    .describe("Custom IP addresses (comma-separated)"),
  customIncludes: z
    .string()
    .optional()
    .describe("Custom include domains (comma-separated)"),
  policy: z
    .enum(["~all", "-all", "?all", "+all"])
    .default("~all")
    .describe("SPF policy (softfail, fail, neutral, pass)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated SPF DNS record"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const parts: string[] = ["v=spf1"];

  if (input.includeGoogle) parts.push("include:_spf.google.com");
  if (input.includeMicrosoft) parts.push("include:spf.protection.outlook.com");
  if (input.includeMailgun) parts.push("include:mailgun.org");
  if (input.includeSendgrid) parts.push("include:sendgrid.net");
  if (input.includeAmazonSes) parts.push("include:amazonses.com");

  if (input.customIncludes) {
    const includes = input.customIncludes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const inc of includes) {
      parts.push(`include:${inc}`);
    }
  }

  if (input.customIps) {
    const ips = input.customIps
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const ip of ips) {
      if (ip.includes(":")) {
        parts.push(`ip6:${ip}`);
      } else {
        parts.push(`ip4:${ip}`);
      }
    }
  }

  parts.push(input.policy);

  const record = parts.join(" ");

  const lines: string[] = [];
  lines.push(`DNS TXT Record for ${input.domain}:`);
  lines.push("");
  lines.push(`  Name: ${input.domain}`);
  lines.push(`  Type: TXT`);
  lines.push(`  Value: ${record}`);
  lines.push("");
  lines.push("Policy explanation:");
  switch (input.policy) {
    case "~all":
      lines.push(
        "  ~all (softfail): Emails from unauthorized senders are marked but not rejected"
      );
      break;
    case "-all":
      lines.push(
        "  -all (fail): Emails from unauthorized senders should be rejected"
      );
      break;
    case "?all":
      lines.push(
        "  ?all (neutral): No policy assertion about unauthorized senders"
      );
      break;
    case "+all":
      lines.push("  +all (pass): All senders are authorized (NOT recommended)");
      break;
  }

  const lookupCount = parts.filter(
    (p) => p.startsWith("include:") || p.startsWith("a:") || p.startsWith("mx:")
  ).length;
  lines.push("");
  lines.push(
    `DNS lookup count: ${lookupCount}/10 (SPF allows max 10 DNS lookups)`
  );
  if (lookupCount > 10) {
    lines.push(
      "WARNING: Exceeds 10 DNS lookup limit! Consider reducing includes."
    );
  }

  return { output: lines.join("\n") };
}

export const spfRecordGenerator = defineTool({
  meta: {
    id: "communication/spf-record-generator",
    name: "SPF Record Generator",
    description:
      "Free online SPF record generator — build SPF DNS TXT records for your domain instantly in your browser. No data is stored. Supports Google Workspace, Microsoft 365, Mailgun, SendGrid, Amazon SES, custom IPs, and DNS lookup counting.",
    category: "communication",
    subgroup: "Email",
    tier: ToolTier.CLIENT,
    keywords: [
      "spf",
      "dns",
      "email",
      "authentication",
      "record",
      "domain",
      "txt",
      "softfail",
      "sender-policy",
    ],
    examples: [
      {
        title: "Google Workspace + SendGrid SPF",
        description:
          "Generate an SPF record for a domain using Google Workspace and SendGrid",
        input: {
          domain: "example.com",
          includeGoogle: true,
          includeSendgrid: true,
          policy: "~all",
        },
        output:
          "DNS TXT Record for example.com:\n\n  Name: example.com\n  Type: TXT\n  Value: v=spf1 include:_spf.google.com include:sendgrid.net ~all\n\nPolicy explanation:\n  ~all (softfail): Emails from unauthorized senders are marked but not rejected\n\nDNS lookup count: 2/10 (SPF allows max 10 DNS lookups)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
