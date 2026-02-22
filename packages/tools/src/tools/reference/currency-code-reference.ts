import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  filter: z
    .string()
    .optional()
    .describe("Search by currency code, name, or symbol"),
});
const outputSchema = z.object({
  output: z.string().describe("Currency codes reference"),
});

const CURRENCIES: Array<[string, string, string]> = [
  ["USD", "US Dollar", "$"],
  ["EUR", "Euro", "\u20AC"],
  ["GBP", "British Pound", "\u00A3"],
  ["JPY", "Japanese Yen", "\u00A5"],
  ["CNY", "Chinese Yuan", "\u00A5"],
  ["INR", "Indian Rupee", "\u20B9"],
  ["AUD", "Australian Dollar", "A$"],
  ["CAD", "Canadian Dollar", "C$"],
  ["CHF", "Swiss Franc", "CHF"],
  ["HKD", "Hong Kong Dollar", "HK$"],
  ["SGD", "Singapore Dollar", "S$"],
  ["SEK", "Swedish Krona", "kr"],
  ["NOK", "Norwegian Krone", "kr"],
  ["DKK", "Danish Krone", "kr"],
  ["NZD", "New Zealand Dollar", "NZ$"],
  ["ZAR", "South African Rand", "R"],
  ["BRL", "Brazilian Real", "R$"],
  ["MXN", "Mexican Peso", "MX$"],
  ["KRW", "South Korean Won", "\u20A9"],
  ["TRY", "Turkish Lira", "\u20BA"],
  ["RUB", "Russian Ruble", "\u20BD"],
  ["PLN", "Polish Zloty", "z\u0142"],
  ["THB", "Thai Baht", "\u0E3F"],
  ["IDR", "Indonesian Rupiah", "Rp"],
  ["MYR", "Malaysian Ringgit", "RM"],
  ["PHP", "Philippine Peso", "\u20B1"],
  ["CZK", "Czech Koruna", "K\u010D"],
  ["ILS", "Israeli Shekel", "\u20AA"],
  ["CLP", "Chilean Peso", "CLP$"],
  ["PEN", "Peruvian Sol", "S/."],
  ["COP", "Colombian Peso", "COL$"],
  ["ARS", "Argentine Peso", "ARS$"],
  ["TWD", "Taiwan Dollar", "NT$"],
  ["SAR", "Saudi Riyal", "SR"],
  ["AED", "UAE Dirham", "AED"],
  ["EGP", "Egyptian Pound", "E\u00A3"],
  ["NGN", "Nigerian Naira", "\u20A6"],
  ["KES", "Kenyan Shilling", "KSh"],
  ["UAH", "Ukrainian Hryvnia", "\u20B4"],
  ["VND", "Vietnamese Dong", "\u20AB"],
  ["BTC", "Bitcoin", "\u20BF"],
  ["ETH", "Ethereum", "\u039E"],
];

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  let filtered = CURRENCIES;
  if (input.filter) {
    const q = input.filter.toLowerCase();
    filtered = filtered.filter(
      ([code, name, sym]) =>
        code.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        sym.toLowerCase().includes(q)
    );
  }
  const header = `${"Code".padEnd(6)}${"Symbol".padEnd(8)}Currency Name`;
  const lines = filtered.map(
    ([code, name, sym]) => `${code.padEnd(6)}${sym.padEnd(8)}${name}`
  );
  return { output: [header, "-".repeat(40), ...lines].join("\n") };
}

export const currencyCodeReference = defineTool({
  meta: {
    id: "reference/currency-code-reference",
    name: "Currency Code Reference",
    description:
      "Free online currency code reference — look up ISO 4217 codes, symbols, and names for 40+ world currencies instantly in your browser. No data is stored. Search by code, name, or symbol — includes fiat currencies and crypto (BTC, ETH).",
    category: "reference",
    tier: ToolTier.CLIENT,
    keywords: [
      "currency",
      "code",
      "iso",
      "iso-4217",
      "money",
      "symbol",
      "reference",
      "lookup",
      "exchange",
      "fiat",
      "crypto",
    ],
    examples: [
      {
        title: "Find Euro currency info",
        description: "Look up the ISO 4217 code and symbol for Euro",
        input: { filter: "euro" },
        output:
          "Code  Symbol  Currency Name\n----------------------------------------\nEUR   \u20AC       Euro",
      },
      {
        title: "Look up Bitcoin",
        description: "Search for Bitcoin's currency code and symbol",
        input: { filter: "bitcoin" },
        output:
          "Code  Symbol  Currency Name\n----------------------------------------\nBTC   \u20BF       Bitcoin",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
