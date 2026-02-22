import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  subject: z.string().default("Hello from Us").describe("Email subject"),
  heading: z.string().default("Welcome!").describe("Main heading"),
  body: z
    .string()
    .default("Thank you for signing up. We are glad to have you.")
    .describe("Email body text"),
  ctaText: z.string().optional().describe("Call-to-action button text"),
  ctaUrl: z.string().optional().describe("Call-to-action button URL"),
  footerText: z
    .string()
    .default("© 2025 Company Name. All rights reserved.")
    .describe("Footer text"),
  primaryColor: z.string().default("#007bff").describe("Primary color (hex)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated HTML email template"),
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
  const bodyParagraphs = input.body
    .split("\n")
    .filter(Boolean)
    .map(
      (p) =>
        `              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #333333;">${escapeHtml(p)}</p>`
    )
    .join("\n");

  let ctaHtml = "";
  if (input.ctaText && input.ctaUrl) {
    ctaHtml = `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
                <tr>
                  <td style="border-radius: 4px; background: ${escapeHtml(input.primaryColor)};">
                    <a href="${escapeHtml(input.ctaUrl)}" style="background: ${escapeHtml(input.primaryColor)}; border: 1px solid ${escapeHtml(input.primaryColor)}; border-radius: 4px; color: #ffffff; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; line-height: 1; padding: 12px 24px; text-decoration: none;">${escapeHtml(input.ctaText)}</a>
                  </td>
                </tr>
              </table>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: ${escapeHtml(input.primaryColor)}; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(input.heading)}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
${bodyParagraphs}
${ctaHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #999999;">${escapeHtml(input.footerText)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { output: html };
}

export const emailTemplateBuilder = defineTool({
  meta: {
    id: "communication/email-template-builder",
    name: "Email Template Builder",
    description:
      "Free online email template builder — create responsive HTML email templates instantly in your browser. No data is stored. Generates table-based layouts compatible with Outlook, Gmail, and Apple Mail with customizable colors, CTA buttons, and footer.",
    category: "communication",
    subgroup: "Email",
    tier: ToolTier.CLIENT,
    keywords: [
      "email",
      "template",
      "html",
      "builder",
      "newsletter",
      "responsive",
      "outlook",
      "gmail",
      "marketing",
      "campaign",
    ],
    examples: [
      {
        title: "Order shipped notification",
        description:
          "Build a transactional email template with a CTA button for order tracking",
        input: {
          subject: "Your Order Has Shipped",
          heading: "Order Shipped!",
          body: "Hi Alex,\nGreat news — your order #7892 has shipped and is on its way.",
          ctaText: "Track Your Order",
          ctaUrl: "https://example.com/track/7892",
          footerText: "© 2025 Acme Store. All rights reserved.",
          primaryColor: "#2d7ff9",
        },
        output:
          "<!DOCTYPE html><!-- Full HTML email template with header, body, CTA button, and footer -->",
      },
    ],
    ui: { outputRenderer: "html", outputLanguage: "html" },
  },
  inputSchema,
  outputSchema,
  execute,
});
