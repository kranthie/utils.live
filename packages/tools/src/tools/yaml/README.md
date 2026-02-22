# YAML Tools

Tools for working with YAML data, including formatting, validation, transformation, and conversion to other formats. Supports multi-document YAML files and style checking.

## Available Tools

| Tool            | Description                                             |
| --------------- | ------------------------------------------------------- |
| `yamlFormatter` | Format and prettify YAML with configurable indentation  |
| `yamlValidator` | Validate YAML syntax and get detailed error information |
| `yamlToJson`    | Convert YAML to JSON format                             |
| `yamlToXml`     | Convert YAML to XML format                              |
| `yamlMinify`    | Minify YAML by reducing whitespace                      |
| `yamlDiff`      | Compare two YAML documents and show differences         |
| `yamlMerge`     | Merge two YAML documents                                |
| `yamlPathQuery` | Query YAML using path notation                          |
| `yamlSortKeys`  | Sort keys alphabetically in YAML                        |
| `jsonToYamlAlt` | Convert JSON to YAML format (alternative)               |
| `yamlLint`      | Check YAML for syntax and style issues                  |
| `yamlSplitter`  | Split multi-document YAML into individual documents     |

## Usage

```typescript
import {
  yamlFormatter,
  yamlValidator,
  yamlToJson,
  yamlLint,
} from "@utils-live/tools";
import { executeTool } from "@utils-live/tools";

// Format YAML with indentation
const formatted = executeTool(
  yamlFormatter,
  {
    input: "name: John\nage: 30",
  },
  { indent: 2, sortKeys: true }
);
console.log(formatted.output);

// Convert YAML to JSON
const json = executeTool(
  yamlToJson,
  {
    input: `
name: John Doe
address:
  city: New York
  country: USA
`,
  },
  { indent: 2 }
);
console.log(json.output);
// Output: {"name":"John Doe","address":{"city":"New York","country":"USA"}}

// Lint YAML for issues
const lint = executeTool(yamlLint, {
  input: `
name: John
  age: 30
`,
});
console.log(lint.valid); // true/false
console.log(lint.issues); // Array of style issues
console.log(lint.documentCount); // Number of YAML documents

// Split multi-document YAML
const split = executeTool(yamlSplitter, {
  input: `
---
name: Document 1
---
name: Document 2
`,
});
console.log(split.count); // 2
console.log(split.documents); // Array of individual documents
```

## Common Options

### Formatting Options

- `indent` (number, 1-8): Number of spaces for indentation (default: 2)
- `lineWidth` (number, 40-1000): Maximum line width (default: 80)
- `sortKeys` (boolean): Sort object keys alphabetically (default: false)
- `flowLevel` (number, -1 to 10): Flow style level (-1 for block style)

### Conversion Options

- `indent` (number): Indentation spaces for JSON output (default: 2)
- `outputFormat` (string): Output format for splitter - "yaml" or "json"

### Lint Rules

The linter checks for common issues:

- Tab characters (YAML should use spaces)
- Trailing whitespace
- Inconsistent indentation
- Duplicate keys at root level
- Empty documents
- Lines exceeding 120 characters

## Multi-Document Support

YAML files can contain multiple documents separated by `---`. The `yamlSplitter` tool handles these files:

```yaml
---
# Document 1
name: config-a
value: 100
---
# Document 2
name: config-b
value: 200
```

## Related Categories

- [JSON Tools](../json/README.md) - Convert between YAML and JSON
- [XML Tools](../xml/README.md) - Convert between YAML and XML
- [TOML Tools](../toml/README.md) - Another configuration format
- [Data Tools](../data/README.md) - Additional format conversions
