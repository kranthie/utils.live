import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  holder: z.string().default("Company Name").describe("Copyright holder name"),
  year: z
    .string()
    .default("2025")
    .describe("Copyright year or range (e.g., 2020-2025)"),
  format: z
    .enum([
      "standard",
      "mit",
      "apache",
      "creative-commons",
      "all-rights",
      "html",
      "code-comment",
    ])
    .default("standard")
    .describe("Copyright notice format"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated copyright notice"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const formats: Record<string, string> = {
    standard: `Copyright \u00A9 ${input.year} ${input.holder}. All rights reserved.`,
    mit: `MIT License\n\nCopyright (c) ${input.year} ${input.holder}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`,
    apache: `Copyright ${input.year} ${input.holder}\n\nLicensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0\n\nUnless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.`,
    "creative-commons": `\u00A9 ${input.year} ${input.holder}\n\nThis work is licensed under the Creative Commons Attribution 4.0 International License.\nTo view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/`,
    "all-rights": `\u00A9 ${input.year} ${input.holder}. All rights reserved.\n\nNo part of this work may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the copyright holder.`,
    html: `<p>&copy; ${input.year} ${input.holder}. All rights reserved.</p>`,
    "code-comment": `/**\n * Copyright (c) ${input.year} ${input.holder}\n * All rights reserved.\n */`,
  };
  return { output: formats[input.format]! };
}

export const copyrightNoticeGenerator = defineTool({
  meta: {
    id: "legal/copyright-notice-generator",
    name: "Copyright Notice Generator",
    description:
      "Free online copyright notice generator — create copyright headers for your project instantly in your browser. No data is stored. Supports standard, MIT, Apache 2.0, Creative Commons, all-rights-reserved, HTML, and code comment formats.",
    category: "legal",
    tier: ToolTier.CLIENT,
    keywords: [
      "copyright",
      "notice",
      "license",
      "legal",
      "mit",
      "apache",
      "creative-commons",
      "header",
      "boilerplate",
      "open-source",
    ],
    examples: [
      {
        title: "MIT license header for open-source project",
        description:
          "Generate a full MIT license notice with custom holder and year range",
        input: {
          holder: "Acme Labs",
          year: "2023-2025",
          format: "mit",
        },
        output:
          "MIT License\n\nCopyright (c) 2023-2025 Acme Labs\n\nPermission is hereby granted, free of charge, to any person obtaining a copy",
      },
      {
        title: "Code comment copyright block",
        description:
          "Generate a copyright notice formatted as a multi-line code comment",
        input: {
          holder: "Acme Labs",
          year: "2025",
          format: "code-comment",
        },
        output:
          "/**\n * Copyright (c) 2025 Acme Labs\n * All rights reserved.\n */",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
