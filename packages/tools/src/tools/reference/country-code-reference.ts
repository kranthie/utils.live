import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  filter: z.string().optional().describe("Search by country name or code"),
});
const outputSchema = z.object({
  output: z.string().describe("Country codes reference"),
});

const COUNTRIES: Array<[string, string, string, string]> = [
  ["US", "USA", "United States", "+1"],
  ["GB", "GBR", "United Kingdom", "+44"],
  ["CA", "CAN", "Canada", "+1"],
  ["AU", "AUS", "Australia", "+61"],
  ["DE", "DEU", "Germany", "+49"],
  ["FR", "FRA", "France", "+33"],
  ["JP", "JPN", "Japan", "+81"],
  ["CN", "CHN", "China", "+86"],
  ["IN", "IND", "India", "+91"],
  ["BR", "BRA", "Brazil", "+55"],
  ["MX", "MEX", "Mexico", "+52"],
  ["KR", "KOR", "South Korea", "+82"],
  ["IT", "ITA", "Italy", "+39"],
  ["ES", "ESP", "Spain", "+34"],
  ["NL", "NLD", "Netherlands", "+31"],
  ["SE", "SWE", "Sweden", "+46"],
  ["NO", "NOR", "Norway", "+47"],
  ["DK", "DNK", "Denmark", "+45"],
  ["FI", "FIN", "Finland", "+358"],
  ["CH", "CHE", "Switzerland", "+41"],
  ["AT", "AUT", "Austria", "+43"],
  ["BE", "BEL", "Belgium", "+32"],
  ["PT", "PRT", "Portugal", "+351"],
  ["PL", "POL", "Poland", "+48"],
  ["IE", "IRL", "Ireland", "+353"],
  ["NZ", "NZL", "New Zealand", "+64"],
  ["SG", "SGP", "Singapore", "+65"],
  ["IL", "ISR", "Israel", "+972"],
  ["AE", "ARE", "United Arab Emirates", "+971"],
  ["SA", "SAU", "Saudi Arabia", "+966"],
  ["ZA", "ZAF", "South Africa", "+27"],
  ["NG", "NGA", "Nigeria", "+234"],
  ["EG", "EGY", "Egypt", "+20"],
  ["KE", "KEN", "Kenya", "+254"],
  ["AR", "ARG", "Argentina", "+54"],
  ["CL", "CHL", "Chile", "+56"],
  ["CO", "COL", "Colombia", "+57"],
  ["PE", "PER", "Peru", "+51"],
  ["TH", "THA", "Thailand", "+66"],
  ["VN", "VNM", "Vietnam", "+84"],
  ["PH", "PHL", "Philippines", "+63"],
  ["ID", "IDN", "Indonesia", "+62"],
  ["MY", "MYS", "Malaysia", "+60"],
  ["TW", "TWN", "Taiwan", "+886"],
  ["HK", "HKG", "Hong Kong", "+852"],
  ["RU", "RUS", "Russia", "+7"],
  ["UA", "UKR", "Ukraine", "+380"],
  ["TR", "TUR", "Turkey", "+90"],
  ["GR", "GRC", "Greece", "+30"],
  ["CZ", "CZE", "Czech Republic", "+420"],
  ["RO", "ROU", "Romania", "+40"],
  ["HU", "HUN", "Hungary", "+36"],
  ["BG", "BGR", "Bulgaria", "+359"],
];

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  let filtered = COUNTRIES;
  if (input.filter) {
    const q = input.filter.toLowerCase();
    filtered = filtered.filter(
      ([a2, a3, name, phone]) =>
        a2.toLowerCase().includes(q) ||
        a3.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        phone.includes(q)
    );
  }
  const header = `${"ISO2".padEnd(6)}${"ISO3".padEnd(6)}${"Phone".padEnd(8)}Country`;
  const lines = filtered.map(
    ([a2, a3, name, phone]) =>
      `${a2.padEnd(6)}${a3.padEnd(6)}${phone.padEnd(8)}${name}`
  );
  return { output: [header, "-".repeat(50), ...lines].join("\n") };
}

export const countryCodeReference = defineTool({
  meta: {
    id: "reference/country-code-reference",
    name: "Country Code Reference",
    description:
      "Free online country code lookup — find ISO 3166 alpha-2, alpha-3, and international dialing codes instantly in your browser. No data is stored. Covers 50+ countries with search by name, ISO code, or phone prefix.",
    category: "reference",
    tier: ToolTier.CLIENT,
    keywords: [
      "country",
      "code",
      "iso",
      "iso-3166",
      "alpha-2",
      "alpha-3",
      "phone",
      "dial",
      "international",
      "reference",
      "lookup",
    ],
    examples: [
      {
        title: "Find Japan's codes",
        description:
          "Look up ISO alpha-2, alpha-3, and international dialing code for Japan",
        input: { filter: "japan" },
        output:
          "ISO2  ISO3  Phone   Country\n--------------------------------------------------\nJP    JPN   +81     Japan",
      },
      {
        title: "Search by phone prefix +49",
        description:
          "Find which country uses the +49 international dialing code",
        input: { filter: "+49" },
        output:
          "ISO2  ISO3  Phone   Country\n--------------------------------------------------\nDE    DEU   +49     Germany",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
