# Markdown Tools

A comprehensive collection of tools for working with Markdown content, including conversion to/from other formats, documentation generators, table formatting, and integration with various platforms.

## Available Tools

### Markdown Core

| Tool                     | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `markdownToHtml`         | Convert Markdown to HTML with GitHub Flavored Markdown support |
| `htmlToMarkdown`         | Convert HTML to Markdown                                       |
| `markdownFormatter`      | Format and normalize Markdown content                          |
| `markdownTocGenerator`   | Generate a table of contents from headings                     |
| `markdownLinkExtractor`  | Extract all links from Markdown                                |
| `markdownImageExtractor` | Extract all images from Markdown                               |
| `markdownTableGenerator` | Generate Markdown tables from data                             |
| `markdownTableFormatter` | Format and align Markdown tables                               |
| `markdownToPlainText`    | Convert Markdown to plain text                                 |
| `markdownEscaper`        | Escape special Markdown characters                             |
| `frontmatterEditor`      | Edit YAML frontmatter in Markdown files                        |

### Documentation Format Converters

| Tool                   | Description                                |
| ---------------------- | ------------------------------------------ |
| `markdownToSlack`      | Convert Markdown to Slack message format   |
| `slackToMarkdown`      | Convert Slack format to Markdown           |
| `markdownToJira`       | Convert Markdown to Jira wiki markup       |
| `jiraToMarkdown`       | Convert Jira wiki markup to Markdown       |
| `markdownToDiscord`    | Convert Markdown to Discord format         |
| `markdownToBbcode`     | Convert Markdown to BBCode                 |
| `markdownToConfluence` | Convert Markdown to Confluence wiki markup |
| `rstToMd`              | Convert reStructuredText to Markdown       |
| `asciidocToMd`         | Convert AsciiDoc to Markdown               |
| `textileToMd`          | Convert Textile to Markdown                |

### Project Documentation Generators

| Tool                 | Description                                    |
| -------------------- | ---------------------------------------------- |
| `readmeGenerator`    | Generate README files for projects             |
| `licensePicker`      | Generate license text (MIT, Apache, GPL, etc.) |
| `changelogGenerator` | Generate CHANGELOG entries                     |
| `contributingGuide`  | Generate CONTRIBUTING.md templates             |
| `issueTemplate`      | Generate GitHub issue templates                |
| `prTemplate`         | Generate pull request templates                |
| `codeOfConduct`      | Generate CODE_OF_CONDUCT.md                    |
| `badgeGenerator`     | Generate shields.io badges                     |

### Additional Tools

| Tool                  | Description                        |
| --------------------- | ---------------------------------- |
| `markdownPreview`     | Preview rendered Markdown          |
| `markdownLinter`      | Lint Markdown for style issues     |
| `markdownLinkChecker` | Check for broken links in Markdown |

## Usage

```typescript
import {
  markdownToHtml,
  markdownTocGenerator,
  markdownTableGenerator,
  markdownToSlack,
  readmeGenerator,
  badgeGenerator,
} from "@utils-live/tools";
import { executeTool } from "@utils-live/tools";

// Convert Markdown to HTML
const html = executeTool(
  markdownToHtml,
  {
    input: `# Hello World

This is **bold** and *italic* text.

- Item 1
- Item 2
`,
  },
  { gfm: true, breaks: false }
);
console.log(html.html);

// Generate table of contents
const toc = executeTool(
  markdownTocGenerator,
  {
    input: `
# Introduction
## Getting Started
### Installation
### Configuration
## Advanced Usage
### API Reference
# Conclusion
`,
  },
  { maxDepth: 3 }
);
console.log(toc.toc);
// Output:
// - [Introduction](#introduction)
//   - [Getting Started](#getting-started)
//     - [Installation](#installation)
//     - [Configuration](#configuration)
//   - [Advanced Usage](#advanced-usage)
//     - [API Reference](#api-reference)
// - [Conclusion](#conclusion)

// Generate Markdown table
const table = executeTool(markdownTableGenerator, {
  headers: ["Name", "Age", "City"],
  rows: [
    ["John", "30", "New York"],
    ["Jane", "25", "Los Angeles"],
  ],
});
console.log(table.output);
// Output:
// | Name | Age | City        |
// |------|-----|-------------|
// | John | 30  | New York    |
// | Jane | 25  | Los Angeles |

// Convert to Slack format
const slack = executeTool(markdownToSlack, {
  input: "**Bold** and *italic* with a [link](https://example.com)",
});
console.log(slack.output); // "*Bold* and _italic_ with a <https://example.com|link>"

// Generate badge
const badge = executeTool(badgeGenerator, {
  label: "npm",
  message: "v1.0.0",
  color: "blue",
});
console.log(badge.markdown); // "![npm](https://img.shields.io/badge/npm-v1.0.0-blue)"
```

## Common Options

### HTML Conversion Options

- `gfm` (boolean): Enable GitHub Flavored Markdown (default: true)
- `breaks` (boolean): Convert line breaks to `<br>` (default: false)
- `sanitize` (boolean): Sanitize HTML output (default: false)

### TOC Generation Options

- `maxDepth` (number, 1-6): Maximum heading depth (default: 6)
- `ordered` (boolean): Use numbered list (default: false)
- `linkPrefix` (string): Prefix for anchor links

### Table Options

- `alignment` (array): Column alignment ("left", "center", "right")
- `compact` (boolean): Remove extra whitespace in table

## Platform Format Comparison

Different platforms use different Markdown flavors:

| Feature | Standard      | GitHub        | Slack         | Discord       | Jira          |
| ------- | ------------- | ------------- | ------------- | ------------- | ------------- |
| Bold    | `**text**`    | `**text**`    | `*text*`      | `**text**`    | `*text*`      |
| Italic  | `*text*`      | `*text*`      | `_text_`      | `*text*`      | `_text_`      |
| Code    | `` `code` ``  | `` `code` ``  | `` `code` ``  | `` `code` ``  | `{{code}}`    |
| Links   | `[text](url)` | `[text](url)` | `<url\|text>` | `[text](url)` | `[text\|url]` |

## README Generator

Generate professional README files:

```typescript
const readme = executeTool(readmeGenerator, {
  projectName: "My Awesome Project",
  description: "A tool that does amazing things",
  features: ["Fast", "Reliable", "Easy to use"],
  installation: "npm install my-project",
  usage: "const project = require('my-project')",
});
```

## Badge Generator

Create shields.io badges:

```typescript
// Simple badge
const simple = executeTool(badgeGenerator, {
  label: "version",
  message: "1.0.0",
  color: "green",
});

// Dynamic badge
const dynamic = executeTool(badgeGenerator, {
  type: "npm",
  package: "lodash",
});
```

## Related Categories

- [Text Tools](../text/README.md) - General text manipulation
- [JSON Tools](../json/README.md) - Work with JSON in Markdown frontmatter
- [CSV Tools](../csv/README.md) - Convert CSV to Markdown tables
