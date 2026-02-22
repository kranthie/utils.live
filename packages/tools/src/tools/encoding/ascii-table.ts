import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  range: z
    .enum(["printable", "control", "full", "extended"])
    .default("printable")
    .describe(
      "Range: printable (32-126), control (0-31), full (0-127), extended (0-255)"
    ),
  format: z
    .enum(["table", "compact"])
    .default("table")
    .describe("Output format: table (detailed) or compact"),
});

const outputSchema = z.object({
  output: z.string().describe("ASCII reference table"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const CONTROL_NAMES: Record<number, string> = {
  0: "NUL",
  1: "SOH",
  2: "STX",
  3: "ETX",
  4: "EOT",
  5: "ENQ",
  6: "ACK",
  7: "BEL",
  8: "BS",
  9: "TAB",
  10: "LF",
  11: "VT",
  12: "FF",
  13: "CR",
  14: "SO",
  15: "SI",
  16: "DLE",
  17: "DC1",
  18: "DC2",
  19: "DC3",
  20: "DC4",
  21: "NAK",
  22: "SYN",
  23: "ETB",
  24: "CAN",
  25: "EM",
  26: "SUB",
  27: "ESC",
  28: "FS",
  29: "GS",
  30: "RS",
  31: "US",
  127: "DEL",
};

function execute(input: Input): Output {
  const range = input.range;
  const format = input.format;

  let start = 0;
  let end = 127;

  switch (range) {
    case "printable":
      start = 32;
      end = 126;
      break;
    case "control":
      start = 0;
      end = 31;
      break;
    case "full":
      start = 0;
      end = 127;
      break;
    case "extended":
      start = 0;
      end = 255;
      break;
  }

  if (format === "compact") {
    const lines: string[] = [];
    lines.push("Dec  Hex  Oct  Char");
    lines.push("---  ---  ---  ----");
    for (let i = start; i <= end; i++) {
      const dec = i.toString().padStart(3, " ");
      const hex = i.toString(16).toUpperCase().padStart(2, "0");
      const oct = i.toString(8).padStart(3, "0");
      let char: string;
      if (i < 32 || i === 127) {
        char = CONTROL_NAMES[i] || "???";
      } else if (i > 127 && i < 160) {
        char = "---";
      } else {
        char = String.fromCharCode(i);
      }
      lines.push(`${dec}  0x${hex}  ${oct}  ${char}`);
    }
    return { output: lines.join("\n") };
  }

  // Detailed table format
  const lines: string[] = [];
  lines.push("Dec  | Hex  | Oct  | Bin        | Char | Description");
  lines.push("-----|------|------|------------|------|------------");

  for (let i = start; i <= end; i++) {
    const dec = i.toString().padStart(3, " ");
    const hex = "0x" + i.toString(16).toUpperCase().padStart(2, "0");
    const oct = i.toString(8).padStart(3, "0");
    const bin = i.toString(2).padStart(8, "0");
    let char: string;
    let desc: string;

    const controlName = CONTROL_NAMES[i];
    if (controlName) {
      char = "  ";
      desc = controlName;
    } else if (i > 127 && i < 160) {
      char = "  ";
      desc = "Control";
    } else {
      char = String.fromCharCode(i);
      desc = getCharDescription(i);
    }

    lines.push(
      `${dec}  | ${hex} | ${oct}  | ${bin}   | ${char.padEnd(4)} | ${desc}`
    );
  }

  return { output: lines.join("\n") };
}

function getCharDescription(code: number): string {
  if (code === 32) return "Space";
  if (code >= 48 && code <= 57) return "Digit " + String.fromCharCode(code);
  if (code >= 65 && code <= 90) return "Uppercase " + String.fromCharCode(code);
  if (code >= 97 && code <= 122)
    return "Lowercase " + String.fromCharCode(code);
  if (code >= 33 && code <= 47) return "Punctuation";
  if (code >= 58 && code <= 64) return "Punctuation";
  if (code >= 91 && code <= 96) return "Punctuation";
  if (code >= 123 && code <= 126) return "Punctuation";
  if (code >= 160 && code <= 255) return "Extended Latin";
  return "";
}

export const asciiTable = defineTool({
  meta: {
    id: "encoding/ascii-table",
    name: "ASCII Table",
    description:
      "Free online ASCII table generator — view ASCII character codes with decimal, hex, octal, and binary values instantly in your browser. No data is stored. Supports printable, control, full (0-127), and extended (0-255) ranges in table or compact format.",
    category: "encoding",
    subgroup: "Character Sets",
    tier: ToolTier.CLIENT,
    keywords: ["ascii", "table", "reference", "character", "code", "generator"],
    examples: [
      {
        title: "Printable Characters",
        description:
          "Display the printable ASCII character table (codes 32-126)",
        input: { range: "printable", format: "compact" },
        output:
          "Dec  Hex  Oct  Char\n---  ---  ---  ----\n 32  0x20  040   \n 33  0x21  041  !\n 34  0x22  042  \"\n 35  0x23  043  #\n 36  0x24  044  $\n 37  0x25  045  %\n 38  0x26  046  &\n 39  0x27  047  '\n 40  0x28  050  (\n 41  0x29  051  )\n 42  0x2A  052  *\n 43  0x2B  053  +\n 44  0x2C  054  ,\n 45  0x2D  055  -\n 46  0x2E  056  .\n 47  0x2F  057  /\n 48  0x30  060  0\n 49  0x31  061  1\n 50  0x32  062  2\n 51  0x33  063  3\n 52  0x34  064  4\n 53  0x35  065  5\n 54  0x36  066  6\n 55  0x37  067  7\n 56  0x38  070  8\n 57  0x39  071  9\n 58  0x3A  072  :\n 59  0x3B  073  ;\n 60  0x3C  074  <\n 61  0x3D  075  =\n 62  0x3E  076  >\n 63  0x3F  077  ?\n 64  0x40  100  @\n 65  0x41  101  A\n 66  0x42  102  B\n 67  0x43  103  C\n 68  0x44  104  D\n 69  0x45  105  E\n 70  0x46  106  F\n 71  0x47  107  G\n 72  0x48  110  H\n 73  0x49  111  I\n 74  0x4A  112  J\n 75  0x4B  113  K\n 76  0x4C  114  L\n 77  0x4D  115  M\n 78  0x4E  116  N\n 79  0x4F  117  O\n 80  0x50  120  P\n 81  0x51  121  Q\n 82  0x52  122  R\n 83  0x53  123  S\n 84  0x54  124  T\n 85  0x55  125  U\n 86  0x56  126  V\n 87  0x57  127  W\n 88  0x58  130  X\n 89  0x59  131  Y\n 90  0x5A  132  Z\n 91  0x5B  133  [\n 92  0x5C  134  \\\n 93  0x5D  135  ]\n 94  0x5E  136  ^\n 95  0x5F  137  _\n 96  0x60  140  `\n 97  0x61  141  a\n 98  0x62  142  b\n 99  0x63  143  c\n100  0x64  144  d\n101  0x65  145  e\n102  0x66  146  f\n103  0x67  147  g\n104  0x68  150  h\n105  0x69  151  i\n106  0x6A  152  j\n107  0x6B  153  k\n108  0x6C  154  l\n109  0x6D  155  m\n110  0x6E  156  n\n111  0x6F  157  o\n112  0x70  160  p\n113  0x71  161  q\n114  0x72  162  r\n115  0x73  163  s\n116  0x74  164  t\n117  0x75  165  u\n118  0x76  166  v\n119  0x77  167  w\n120  0x78  170  x\n121  0x79  171  y\n122  0x7A  172  z\n123  0x7B  173  {\n124  0x7C  174  |\n125  0x7D  175  }\n126  0x7E  176  ~",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
