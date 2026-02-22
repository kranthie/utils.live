import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  faqs: z
    .string()
    .default(
      '[{"question":"What is this?","answer":"This is an example FAQ."},{"question":"How does it work?","answer":"It generates structured data."}]'
    )
    .describe("JSON array of FAQ items with question and answer fields"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated FAQ Schema.org JSON-LD"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  let faqs: Array<{ question: string; answer: string }>;

  try {
    faqs = JSON.parse(input.faqs) as Array<{
      question: string;
      answer: string;
    }>;
    if (!Array.isArray(faqs)) {
      throw new Error("FAQs must be an array");
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Invalid JSON in faqs field");
    }
    throw e;
  }

  if (faqs.length === 0) {
    throw new Error("At least one FAQ item is required");
  }

  for (let i = 0; i < faqs.length; i++) {
    if (!faqs[i]!.question || !faqs[i]!.answer) {
      throw new Error(
        `FAQ item ${i + 1} must have both 'question' and 'answer' fields`
      );
    }
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const script = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;
  return { output: script };
}

export const faqSchemaGenerator = defineTool({
  meta: {
    id: "feeds/faq-schema-generator",
    name: "FAQ Schema Generator",
    description:
      "Free online FAQ Schema generator — create FAQPage JSON-LD structured data for Google rich results instantly in your browser. No data is stored. Outputs a ready-to-embed script tag with Question and Answer entities.",
    category: "feeds",
    subgroup: "Structured Data",
    tier: ToolTier.CLIENT,
    keywords: [
      "faq",
      "schema",
      "json-ld",
      "structured",
      "data",
      "seo",
      "question",
      "rich",
      "results",
    ],
    ui: { outputRenderer: "code", outputLanguage: "html" },
    examples: [
      {
        title: "Business FAQ with 2 questions",
        description:
          "Generate FAQPage JSON-LD for business hours and location questions",
        input: {
          faqs: '[{"question":"What are your hours?","answer":"We are open Monday to Friday, 9am to 5pm."},{"question":"Where are you located?","answer":"123 Main Street, Portland, OR."}]',
        },
        output: "FAQPage JSON-LD with 2 questions",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
