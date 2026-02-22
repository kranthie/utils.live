import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string to convert to/from RFC 2822"),
});

const outputSchema = z.object({
  output: z.string().describe("RFC 2822 formatted date string"),
  rfc2822: z.string().describe("RFC 2822 format"),
  iso: z.string().describe("ISO 8601 format"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function toRfc2822(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = days[date.getUTCDay()]!;
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mon = months[date.getUTCMonth()]!;
  const yyyy = date.getUTCFullYear();
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");

  return `${day}, ${dd} ${mon} ${yyyy} ${hh}:${mm}:${ss} +0000`;
}

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  const num = Number(str);
  let date: Date;
  if (!isNaN(num)) {
    date = num < 4102444800 ? new Date(num * 1000) : new Date(num);
  } else {
    date = new Date(str);
  }

  if (isNaN(date.getTime())) {
    throw new Error("Unable to parse input as a date");
  }

  const rfc2822 = toRfc2822(date);
  const iso = date.toISOString();

  return {
    output: `RFC 2822: ${rfc2822}\nISO 8601: ${iso}`,
    rfc2822,
    iso,
  };
}

export const rfc2822Converter = defineTool({
  meta: {
    id: "datetime/rfc2822-converter",
    name: "RFC 2822 Converter",
    description:
      "Free online RFC 2822 converter — convert dates to and from RFC 2822 email date format instantly in your browser. No data is stored. Shows both RFC 2822 and ISO 8601 representations.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["rfc2822", "email", "date", "format", "convert"],
    examples: [
      {
        title: "Convert to RFC 2822",
        description: "Convert an ISO date to RFC 2822 email date format",
        input: "2025-07-04T15:30:00Z",
        output:
          "RFC 2822: Fri, 04 Jul 2025 15:30:00 +0000\nISO 8601: 2025-07-04T15:30:00.000Z",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
