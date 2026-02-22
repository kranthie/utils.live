import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("cURL command to convert"),
});

const optionsSchema = z.object({
  target: z
    .enum([
      "fetch",
      "axios",
      "node-fetch",
      "got",
      "request",
      "http",
      "python-requests",
      "go",
      "rust",
      "php-curl",
    ])
    .default("fetch")
    .describe("Target language/library"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted code"),
});

interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: string;
  auth?: { user: string; pass: string };
  compressed?: boolean;
  insecure?: boolean;
  followRedirects?: boolean;
}

function parseCurl(input: string): ParsedCurl {
  const trimmed = input.trim().replace(/\\\n\s*/g, " ");
  if (!trimmed.toLowerCase().startsWith("curl")) {
    throw new Error("Input must be a valid cURL command starting with 'curl'");
  }

  const result: ParsedCurl = {
    method: "GET",
    url: "",
    headers: {},
  };

  // Tokenize the command respecting quotes
  const tokens: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escape = false;

  for (let i = 4; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escape) {
      current += ch;
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (ch === " " && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current.length > 0) tokens.push(current);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "-X" || token === "--request") {
      result.method = tokens[++i]?.toUpperCase() ?? "GET";
    } else if (token === "-H" || token === "--header") {
      const header = tokens[++i] ?? "";
      const colonIndex = header.indexOf(":");
      if (colonIndex > 0) {
        const key = header.substring(0, colonIndex).trim();
        const value = header.substring(colonIndex + 1).trim();
        result.headers[key] = value;
      }
    } else if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary"
    ) {
      result.data = tokens[++i] ?? "";
      if (result.method === "GET") result.method = "POST";
    } else if (token === "-u" || token === "--user") {
      const auth = tokens[++i] ?? "";
      const parts = auth.split(":");
      result.auth = { user: parts[0] ?? "", pass: parts.slice(1).join(":") };
    } else if (token === "--compressed") {
      result.compressed = true;
    } else if (token === "-k" || token === "--insecure") {
      result.insecure = true;
    } else if (token === "-L" || token === "--location") {
      result.followRedirects = true;
    } else if (!token!.startsWith("-")) {
      result.url = token!;
    }
  }

  if (!result.url) {
    throw new Error("No URL found in cURL command");
  }

  return result;
}

function toFetch(c: ParsedCurl): string {
  const opts: string[] = [];
  if (c.method !== "GET") opts.push(`  method: "${c.method}",`);
  if (Object.keys(c.headers).length > 0) {
    opts.push(
      `  headers: ${JSON.stringify(c.headers, null, 4).replace(/\n/g, "\n  ")},`
    );
  }
  if (c.data) opts.push(`  body: ${JSON.stringify(c.data)},`);
  if (c.followRedirects === false) opts.push(`  redirect: "manual",`);

  if (opts.length === 0) {
    return `const response = await fetch("${c.url}");\nconst data = await response.json();`;
  }
  return `const response = await fetch("${c.url}", {\n${opts.join("\n")}\n});\nconst data = await response.json();`;
}

function toAxios(c: ParsedCurl): string {
  const opts: string[] = [
    `  method: "${c.method.toLowerCase()}",`,
    `  url: "${c.url}",`,
  ];
  if (Object.keys(c.headers).length > 0) {
    opts.push(
      `  headers: ${JSON.stringify(c.headers, null, 4).replace(/\n/g, "\n  ")},`
    );
  }
  if (c.data) {
    try {
      JSON.parse(c.data);
      opts.push(`  data: ${c.data},`);
    } catch {
      opts.push(`  data: ${JSON.stringify(c.data)},`);
    }
  }
  if (c.auth) {
    opts.push(
      `  auth: { username: "${c.auth.user}", password: "${c.auth.pass}" },`
    );
  }
  return `const { data } = await axios({\n${opts.join("\n")}\n});`;
}

function toPythonRequests(c: ParsedCurl): string {
  const lines = ["import requests", ""];
  const args: string[] = [];
  if (Object.keys(c.headers).length > 0) {
    args.push(`    headers=${JSON.stringify(c.headers).replace(/"/g, "'")}`);
  }
  if (c.data) {
    try {
      JSON.parse(c.data);
      args.push(`    json=${c.data}`);
    } catch {
      args.push(`    data='${c.data}'`);
    }
  }
  if (c.auth) {
    args.push(`    auth=('${c.auth.user}', '${c.auth.pass}')`);
  }
  if (c.insecure) args.push(`    verify=False`);

  const method = c.method.toLowerCase();
  if (args.length > 0) {
    lines.push(`response = requests.${method}(`);
    lines.push(`    '${c.url}',`);
    lines.push(args.join(",\n"));
    lines.push(`)`);
  } else {
    lines.push(`response = requests.${method}('${c.url}')`);
  }
  lines.push(`data = response.json()`);
  return lines.join("\n");
}

function toGo(c: ParsedCurl): string {
  const lines: string[] = [];
  lines.push(`package main`);
  lines.push(``);
  lines.push(`import (`);
  lines.push(`\t"fmt"`);
  lines.push(`\t"io"`);
  lines.push(`\t"net/http"`);
  if (c.data) lines.push(`\t"strings"`);
  lines.push(`)`);
  lines.push(``);
  lines.push(`func main() {`);
  if (c.data) {
    lines.push(`\tbody := strings.NewReader(${JSON.stringify(c.data)})`);
    lines.push(
      `\treq, err := http.NewRequest("${c.method}", "${c.url}", body)`
    );
  } else {
    lines.push(`\treq, err := http.NewRequest("${c.method}", "${c.url}", nil)`);
  }
  lines.push(`\tif err != nil { panic(err) }`);
  for (const [k, v] of Object.entries(c.headers)) {
    lines.push(`\treq.Header.Set("${k}", "${v}")`);
  }
  lines.push(`\tresp, err := http.DefaultClient.Do(req)`);
  lines.push(`\tif err != nil { panic(err) }`);
  lines.push(`\tdefer resp.Body.Close()`);
  lines.push(`\tdata, _ := io.ReadAll(resp.Body)`);
  lines.push(`\tfmt.Println(string(data))`);
  lines.push(`}`);
  return lines.join("\n");
}

function toGeneric(c: ParsedCurl, target: string): string {
  switch (target) {
    case "node-fetch":
      return toFetch(c).replace(
        "const response",
        "const fetch = require('node-fetch');\n\nconst response"
      );
    case "got": {
      const opts: string[] = [`  method: "${c.method}",`];
      if (Object.keys(c.headers).length > 0)
        opts.push(
          `  headers: ${JSON.stringify(c.headers, null, 4).replace(/\n/g, "\n  ")},`
        );
      if (c.data) opts.push(`  body: ${JSON.stringify(c.data)},`);
      return `import got from 'got';\n\nconst response = await got("${c.url}", {\n${opts.join("\n")}\n});\nconst data = JSON.parse(response.body);`;
    }
    case "request": {
      const opts: string[] = [`  url: "${c.url}",`, `  method: "${c.method}",`];
      if (Object.keys(c.headers).length > 0)
        opts.push(
          `  headers: ${JSON.stringify(c.headers, null, 4).replace(/\n/g, "\n  ")},`
        );
      if (c.data) opts.push(`  body: ${JSON.stringify(c.data)},`);
      return `const request = require('request');\n\nrequest({\n${opts.join("\n")}\n}, (error, response, body) => {\n  console.log(body);\n});`;
    }
    case "http": {
      const lines: string[] = [];
      const urlObj = new URL(c.url);
      const mod = urlObj.protocol === "https:" ? "https" : "http";
      lines.push(`const ${mod} = require('${mod}');`);
      lines.push(``);
      lines.push(`const options = {`);
      lines.push(`  hostname: '${urlObj.hostname}',`);
      if (urlObj.port) lines.push(`  port: ${urlObj.port},`);
      lines.push(`  path: '${urlObj.pathname}${urlObj.search}',`);
      lines.push(`  method: '${c.method}',`);
      if (Object.keys(c.headers).length > 0) {
        lines.push(
          `  headers: ${JSON.stringify(c.headers, null, 4).replace(/\n/g, "\n  ")},`
        );
      }
      lines.push(`};`);
      lines.push(``);
      lines.push(`const req = ${mod}.request(options, (res) => {`);
      lines.push(`  let data = '';`);
      lines.push(`  res.on('data', (chunk) => data += chunk);`);
      lines.push(`  res.on('end', () => console.log(data));`);
      lines.push(`});`);
      if (c.data) lines.push(`req.write(${JSON.stringify(c.data)});`);
      lines.push(`req.end();`);
      return lines.join("\n");
    }
    case "rust": {
      const lines: string[] = [];
      lines.push(`use reqwest;`);
      lines.push(``);
      lines.push(`#[tokio::main]`);
      lines.push(`async fn main() -> Result<(), Box<dyn std::error::Error>> {`);
      lines.push(`    let client = reqwest::Client::new();`);
      const method = c.method.toLowerCase();
      if (c.data) {
        lines.push(`    let response = client.${method}("${c.url}")`);
        for (const [k, v] of Object.entries(c.headers)) {
          lines.push(`        .header("${k}", "${v}")`);
        }
        lines.push(`        .body(${JSON.stringify(c.data)})`);
        lines.push(`        .send().await?;`);
      } else {
        lines.push(`    let response = client.${method}("${c.url}")`);
        for (const [k, v] of Object.entries(c.headers)) {
          lines.push(`        .header("${k}", "${v}")`);
        }
        lines.push(`        .send().await?;`);
      }
      lines.push(`    let body = response.text().await?;`);
      lines.push(`    println!("{}", body);`);
      lines.push(`    Ok(())`);
      lines.push(`}`);
      return lines.join("\n");
    }
    case "php-curl": {
      const lines: string[] = [];
      lines.push(`<?php`);
      lines.push(`$ch = curl_init();`);
      lines.push(`curl_setopt($ch, CURLOPT_URL, "${c.url}");`);
      lines.push(`curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`);
      if (c.method !== "GET") {
        lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${c.method}");`);
      }
      if (Object.keys(c.headers).length > 0) {
        const h = Object.entries(c.headers)
          .map(([k, v]) => `"${k}: ${v}"`)
          .join(", ");
        lines.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, [${h}]);`);
      }
      if (c.data) {
        lines.push(
          `curl_setopt($ch, CURLOPT_POSTFIELDS, ${JSON.stringify(c.data)});`
        );
      }
      if (c.insecure) {
        lines.push(`curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);`);
      }
      lines.push(`$response = curl_exec($ch);`);
      lines.push(`curl_close($ch);`);
      lines.push(`echo $response;`);
      return lines.join("\n");
    }
    default:
      return toFetch(c);
  }
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const target = options?.target ?? "fetch";
  const parsed = parseCurl(input.input);

  let output: string;
  switch (target) {
    case "fetch":
      output = toFetch(parsed);
      break;
    case "axios":
      output = toAxios(parsed);
      break;
    case "python-requests":
      output = toPythonRequests(parsed);
      break;
    case "go":
      output = toGo(parsed);
      break;
    default:
      output = toGeneric(parsed, target);
  }

  return { output };
}

export const curlConverter = defineTool({
  meta: {
    id: "api/curl-converter",
    name: "cURL Converter",
    description:
      "Free online cURL converter — transform cURL commands into fetch, axios, Python requests, Go, Rust, and PHP code instantly in your browser. No data is stored. Parses headers, authentication, request body, and all common cURL flags.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "curl",
      "convert",
      "fetch",
      "axios",
      "http",
      "request",
      "api",
      "python",
      "go",
      "rust",
      "php",
    ],
    ui: { inputLanguage: "shell", outputLanguage: "javascript" },
    examples: [
      {
        title: "POST Request with JSON Body",
        description:
          "Convert a cURL POST request with JSON headers and body to JavaScript fetch",
        input:
          "curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -H 'Authorization: Bearer token123' -d '{\"name\":\"Alice\",\"email\":\"alice@example.com\"}'",
        output:
          'const response = await fetch("https://api.example.com/users", {\n  method: "POST",\n  headers: {\n      "Content-Type": "application/json",\n      "Authorization": "Bearer token123"\n  },\n  body: "{\\"name\\":\\"Alice\\",\\"email\\":\\"alice@example.com\\"}",\n});\nconst data = await response.json();',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
