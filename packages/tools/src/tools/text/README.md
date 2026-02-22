# Text Tools

A comprehensive collection of tools for text manipulation, analysis, comparison, generation, and extraction. These tools handle plain text processing tasks commonly needed in development workflows.

## Available Tools

### Text Transformation

| Tool                | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `caseConverter`     | Convert text between camelCase, PascalCase, snake_case, kebab-case, and more |
| `slugify`           | Convert text to URL-friendly slugs                                           |
| `textReverser`      | Reverse text (characters or words)                                           |
| `lineSorter`        | Sort lines alphabetically or numerically                                     |
| `lineDeduplicator`  | Remove duplicate lines from text                                             |
| `lineShuffler`      | Randomly shuffle lines                                                       |
| `lineNumberer`      | Add line numbers to text                                                     |
| `emptyLineRemover`  | Remove empty/blank lines                                                     |
| `whitespaceCleaner` | Clean up whitespace (trim, normalize spaces)                                 |
| `textTrimmer`       | Trim leading/trailing whitespace                                             |
| `findReplace`       | Find and replace text with regex support                                     |
| `textWrapper`       | Wrap text at specified width                                                 |
| `prefixSuffixAdder` | Add prefix/suffix to each line                                               |
| `columnAligner`     | Align text into columns                                                      |
| `textTruncator`     | Truncate text to specified length                                            |
| `palindromeChecker` | Check if text is a palindrome                                                |
| `rot13Encoder`      | Encode/decode text using ROT13                                               |

### Text Analysis

| Tool               | Description                                         |
| ------------------ | --------------------------------------------------- |
| `wordCounter`      | Count words, characters, sentences, and paragraphs  |
| `characterCounter` | Detailed character counting and analysis            |
| `readingTime`      | Estimate reading time for text                      |
| `wordFrequency`    | Analyze word frequency                              |
| `textStatistics`   | Comprehensive text statistics                       |
| `readabilityScore` | Calculate readability scores (Flesch-Kincaid, etc.) |
| `sentenceCounter`  | Count sentences in text                             |
| `paragraphCounter` | Count paragraphs in text                            |
| `letterFrequency`  | Analyze letter frequency distribution               |
| `ngramGenerator`   | Generate n-grams from text                          |

### Text Comparison

| Tool              | Description                            |
| ----------------- | -------------------------------------- |
| `textDiff`        | Compare two texts and show differences |
| `unifiedDiff`     | Generate unified diff format           |
| `characterDiff`   | Character-level diff comparison        |
| `similarityScore` | Calculate text similarity percentage   |

### Text Generation

| Tool               | Description                                |
| ------------------ | ------------------------------------------ |
| `loremIpsum`       | Generate Lorem Ipsum placeholder text      |
| `randomWords`      | Generate random words                      |
| `randomSentences`  | Generate random sentences                  |
| `randomParagraphs` | Generate random paragraphs                 |
| `dummyText`        | Generate various types of placeholder text |
| `fakeName`         | Generate fake names                        |
| `fakeAddress`      | Generate fake addresses                    |
| `fakeCompany`      | Generate fake company names                |

### Text Extraction

| Tool               | Description                       |
| ------------------ | --------------------------------- |
| `emailExtractor`   | Extract email addresses from text |
| `urlExtractor`     | Extract URLs from text            |
| `phoneExtractor`   | Extract phone numbers from text   |
| `ipExtractor`      | Extract IP addresses from text    |
| `hashtagExtractor` | Extract hashtags from text        |
| `mentionExtractor` | Extract @mentions from text       |
| `numberExtractor`  | Extract numbers from text         |
| `dateExtractor`    | Extract dates from text           |
| `keywordExtractor` | Extract keywords from text        |

### Additional Tools

| Tool               | Description                    |
| ------------------ | ------------------------------ |
| `languageDetector` | Detect the language of text    |
| `anagramGenerator` | Generate anagrams of text      |
| `semanticDiff`     | Semantic-aware text comparison |

## Usage

```typescript
import {
  caseConverter,
  wordCounter,
  textDiff,
  loremIpsum,
  emailExtractor,
} from "@utils-live/tools";
import { executeTool } from "@utils-live/tools";

// Convert case
const cases = executeTool(caseConverter, {
  input: "hello world example",
});
console.log(cases.camelCase); // "helloWorldExample"
console.log(cases.pascalCase); // "HelloWorldExample"
console.log(cases.snakeCase); // "hello_world_example"
console.log(cases.kebabCase); // "hello-world-example"
console.log(cases.titleCase); // "Hello World Example"
console.log(cases.constantCase); // "HELLO_WORLD_EXAMPLE"

// Count words and characters
const counts = executeTool(wordCounter, {
  input: "The quick brown fox jumps over the lazy dog.",
});
console.log(counts.words); // 9
console.log(counts.characters); // 44
console.log(counts.sentences); // 1
console.log(counts.avgWordLength); // 4.11

// Compare texts
const diff = executeTool(textDiff, {
  original: "Hello World",
  modified: "Hello Universe",
});
console.log(diff.changes); // Array of differences

// Generate placeholder text
const lorem = executeTool(
  loremIpsum,
  {},
  {
    paragraphs: 2,
    wordsPerSentence: 10,
  }
);
console.log(lorem.output);

// Extract emails
const emails = executeTool(emailExtractor, {
  input: "Contact us at support@example.com or sales@example.com for help.",
});
console.log(emails.emails); // ["support@example.com", "sales@example.com"]
console.log(emails.count); // 2
```

## Case Conversion Reference

The `caseConverter` tool outputs all common case formats:

| Format        | Example       |
| ------------- | ------------- |
| camelCase     | `helloWorld`  |
| PascalCase    | `HelloWorld`  |
| snake_case    | `hello_world` |
| kebab-case    | `hello-world` |
| UPPER CASE    | `HELLO WORLD` |
| lower case    | `hello world` |
| Title Case    | `Hello World` |
| Sentence case | `Hello world` |
| CONSTANT_CASE | `HELLO_WORLD` |
| dot.case      | `hello.world` |
| path/case     | `hello/world` |

## Common Options

### Line Processing Options

- `caseSensitive` (boolean): Case-sensitive sorting/comparison
- `reverse` (boolean): Reverse sort order
- `numeric` (boolean): Sort numerically instead of alphabetically

### Text Generation Options

- `paragraphs` (number): Number of paragraphs to generate
- `sentences` (number): Number of sentences per paragraph
- `words` (number): Number of words per sentence

### Extraction Options

- `unique` (boolean): Return only unique matches
- `sort` (boolean): Sort extracted values

## Related Categories

- [Markdown Tools](../markdown/README.md) - Markdown-specific text processing
- [JSON Tools](../json/README.md) - JSON string handling
- [CSV Tools](../csv/README.md) - Text-based tabular data
