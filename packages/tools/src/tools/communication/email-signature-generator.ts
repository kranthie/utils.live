import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  name: z.string().default("John Doe").describe("Full name"),
  title: z.string().default("Software Engineer").describe("Job title"),
  company: z.string().default("Acme Inc.").describe("Company name"),
  email: z.string().default("john@example.com").describe("Email address"),
  phone: z.string().optional().describe("Phone number"),
  website: z.string().optional().describe("Website URL"),
  linkedin: z.string().optional().describe("LinkedIn profile URL"),
  twitter: z.string().optional().describe("Twitter/X handle"),
  style: z
    .enum(["professional", "minimal", "creative"])
    .default("professional")
    .describe("Signature style"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated HTML email signature"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function execute(input: Input): Output {
  const e = escapeHtml;
  const style = input.style;

  let html = "";

  if (style === "minimal") {
    html = `<div style="font-family: Arial, sans-serif; font-size: 13px; color: #333;">
  <strong>${e(input.name)}</strong><br>
  ${e(input.title)} | ${e(input.company)}<br>
  <a href="mailto:${e(input.email)}" style="color: #0066cc; text-decoration: none;">${e(input.email)}</a>`;
    if (input.phone) html += ` | ${e(input.phone)}`;
    if (input.website)
      html += `<br><a href="${e(input.website)}" style="color: #0066cc; text-decoration: none;">${e(input.website)}</a>`;
    html += `\n</div>`;
  } else if (style === "creative") {
    html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Segoe UI', Arial, sans-serif;">
  <tr>
    <td style="border-left: 4px solid #e74c3c; padding-left: 16px;">
      <div style="font-size: 18px; font-weight: bold; color: #2c3e50;">${e(input.name)}</div>
      <div style="font-size: 13px; color: #e74c3c; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0;">${e(input.title)}</div>
      <div style="font-size: 13px; color: #7f8c8d; margin-bottom: 8px;">${e(input.company)}</div>
      <div style="font-size: 12px; color: #95a5a6;">
        <a href="mailto:${e(input.email)}" style="color: #2c3e50; text-decoration: none;">${e(input.email)}</a>`;
    if (input.phone) html += ` &bull; ${e(input.phone)}`;
    html += `\n      </div>`;
    if (input.website || input.linkedin || input.twitter) {
      html += `\n      <div style="margin-top: 8px; font-size: 12px;">`;
      if (input.website)
        html += `<a href="${e(input.website)}" style="color: #e74c3c; text-decoration: none; margin-right: 12px;">Website</a>`;
      if (input.linkedin)
        html += `<a href="${e(input.linkedin)}" style="color: #0077b5; text-decoration: none; margin-right: 12px;">LinkedIn</a>`;
      if (input.twitter)
        html += `<a href="https://twitter.com/${e(input.twitter.replace("@", ""))}" style="color: #1da1f2; text-decoration: none;">Twitter</a>`;
      html += `</div>`;
    }
    html += `\n    </td>
  </tr>
</table>`;
  } else {
    // Professional
    html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 13px; color: #333333;">
  <tr>
    <td style="padding-right: 16px; border-right: 2px solid #007bff; vertical-align: top;">
      <div style="font-size: 16px; font-weight: bold; color: #222222;">${e(input.name)}</div>
      <div style="font-size: 13px; color: #666666;">${e(input.title)}</div>
      <div style="font-size: 13px; color: #007bff; font-weight: bold;">${e(input.company)}</div>
    </td>
    <td style="padding-left: 16px; vertical-align: top;">
      <div><a href="mailto:${e(input.email)}" style="color: #333; text-decoration: none;">${e(input.email)}</a></div>`;
    if (input.phone) html += `\n      <div>${e(input.phone)}</div>`;
    if (input.website)
      html += `\n      <div><a href="${e(input.website)}" style="color: #007bff; text-decoration: none;">${e(input.website)}</a></div>`;
    html += `\n    </td>
  </tr>`;
    if (input.linkedin || input.twitter) {
      html += `\n  <tr>
    <td colspan="2" style="padding-top: 8px; font-size: 12px;">`;
      if (input.linkedin)
        html += `<a href="${e(input.linkedin)}" style="color: #0077b5; text-decoration: none; margin-right: 12px;">LinkedIn</a>`;
      if (input.twitter)
        html += `<a href="https://twitter.com/${e(input.twitter.replace("@", ""))}" style="color: #1da1f2; text-decoration: none;">Twitter</a>`;
      html += `\n    </td>
  </tr>`;
    }
    html += `\n</table>`;
  }

  return { output: html };
}

export const emailSignatureGenerator = defineTool({
  meta: {
    id: "communication/email-signature-generator",
    name: "Email Signature Generator",
    description:
      "Free online email signature generator — create professional HTML email signatures instantly in your browser. No data is stored. Choose from professional, minimal, or creative styles with optional phone, website, LinkedIn, and Twitter links.",
    category: "communication",
    subgroup: "Email",
    tier: ToolTier.CLIENT,
    keywords: [
      "email",
      "signature",
      "html",
      "generate",
      "professional",
      "outlook",
      "gmail",
      "template",
      "business",
    ],
    examples: [
      {
        title: "Professional signature with contact info",
        description:
          "Generate a professional-style HTML signature with phone and website",
        input: {
          name: "Jane Smith",
          title: "Product Manager",
          company: "Acme Inc",
          email: "jane.smith@example.com",
          phone: "+1 (555) 123-4567",
          website: "https://example.com",
          style: "professional",
        },
        output:
          '<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 13px; color: #333333;">\n  <tr>\n    <td style="padding-right: 16px; border-right: 2px solid #007bff; vertical-align: top;">\n      <div style="font-size: 16px; font-weight: bold; color: #222222;">Jane Smith</div>\n      <div style="font-size: 13px; color: #666666;">Product Manager</div>\n      <div style="font-size: 13px; color: #007bff; font-weight: bold;">Acme Inc</div>\n    </td>\n    <td style="padding-left: 16px; vertical-align: top;">\n      <div><a href="mailto:jane.smith@example.com" style="color: #333; text-decoration: none;">jane.smith@example.com</a></div>\n      <div>+1 (555) 123-4567</div>\n      <div><a href="https://example.com" style="color: #007bff; text-decoration: none;">https://example.com</a></div>\n    </td>\n  </tr>\n</table>',
      },
    ],
    ui: { outputRenderer: "html", outputLanguage: "html" },
  },
  inputSchema,
  outputSchema,
  execute,
});
