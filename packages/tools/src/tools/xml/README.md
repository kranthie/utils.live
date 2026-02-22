# XML Tools

Tools for working with XML data, including formatting, validation, transformation, querying with XPath, and conversion to other formats.

## Available Tools

| Tool              | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `xmlFormatter`    | Format and prettify XML with configurable indentation      |
| `xmlValidator`    | Validate XML syntax and structure                          |
| `xmlToJson`       | Convert XML to JSON format                                 |
| `xmlToYaml`       | Convert XML to YAML format                                 |
| `xmlMinify`       | Minify XML by removing whitespace                          |
| `xmlXpath`        | Query XML using XPath-like expressions                     |
| `xmlDiff`         | Compare two XML documents and show differences             |
| `jsonToXmlAlt`    | Convert JSON to XML format (alternative)                   |
| `xmlEscape`       | Escape special characters for XML                          |
| `xmlToCsv`        | Convert XML to CSV format                                  |
| `xmlXslt`         | Apply XSLT stylesheet to XML (limited client-side support) |
| `xmlWellformednessChecker` | Check XML well-formedness and analyze DTD declarations |

## Usage

```typescript
import {
  xmlFormatter,
  xmlValidator,
  xmlXpath,
  xmlToJson,
} from "@utils-live/tools";
import { executeTool } from "@utils-live/tools";

// Format XML with indentation
const formatted = executeTool(
  xmlFormatter,
  {
    input: '<root><item id="1">Value</item></root>',
  },
  { indent: "  " }
);
console.log(formatted.output);
// Output:
// <root>
//   <item id="1">Value</item>
// </root>

// Convert XML to JSON
const json = executeTool(xmlToJson, {
  input: `
<?xml version="1.0"?>
<user>
  <name>John</name>
  <email>john@example.com</email>
</user>
`,
});
console.log(json.output);
// Output: {"user":{"name":"John","email":"john@example.com"}}

// Query XML with XPath
const xpath = executeTool(xmlXpath, {
  input: `
<root>
  <users>
    <user id="1"><name>John</name></user>
    <user id="2"><name>Jane</name></user>
  </users>
</root>
`,
  query: "//user[@id='1']",
});
console.log(xpath.results); // Array of matching nodes
console.log(xpath.count); // Number of matches
```

## Common Options

### Formatting Options

- `indent` (string): Indentation string (default: " ")
- `preserveOrder` (boolean): Preserve element order (default: false)
- `ignoreAttributes` (boolean): Ignore XML attributes (default: false)

### Conversion Options

- `rootName` (string): Name of the root element for JSON-to-XML (default: "root")
- `arrayNodeName` (string): Name for array items (default: "item")
- `declaration` (boolean): Include XML declaration (default: true)

### XPath Query Syntax

The XPath query tool supports simplified XPath expressions:

| Pattern                  | Description                     |
| ------------------------ | ------------------------------- |
| `/root/element`          | Direct path to element          |
| `//element`              | Recursive search for element    |
| `element[@attr]`         | Element with specific attribute |
| `element[@attr='value']` | Element with attribute value    |

## XSLT Support

The `xmlXslt` tool provides limited client-side XSLT support. For full XSLT 1.0/2.0/3.0 transformations, server-side processing is recommended.

```typescript
const xslt = executeTool(xmlXslt, {
  input: "<data>...</data>",
  stylesheet: '<?xml version="1.0"?><xsl:stylesheet>...</xsl:stylesheet>',
});
```

## Related Categories

- [JSON Tools](../json/README.md) - Convert between XML and JSON
- [YAML Tools](../yaml/README.md) - Convert between XML and YAML
- [CSV Tools](../csv/README.md) - Convert between XML and CSV
- [Data Tools](../data/README.md) - Additional format conversions
