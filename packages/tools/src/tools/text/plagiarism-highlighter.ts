import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  source: z.string().describe("The original text"),
  comparison: z.string().describe("Text to check for plagiarism"),
});

const matchSchema = z.object({
  text: z.string().describe("The matched text"),
  sourceStart: z.number().describe("Start position in source text"),
  sourceEnd: z.number().describe("End position in source text"),
  comparisonStart: z.number().describe("Start position in comparison text"),
  comparisonEnd: z.number().describe("End position in comparison text"),
});

const outputSchema = z.object({
  matches: z.array(matchSchema).describe("Array of matched segments"),
  similarityScore: z.number().describe("Similarity percentage (0-100)"),
  highlightedSource: z
    .string()
    .describe("Source with markers around matched text"),
  highlightedComparison: z
    .string()
    .describe("Comparison with markers around matched text"),
});

const optionsSchema = z.object({
  minMatchLength: z
    .number()
    .default(20)
    .describe("Minimum characters to consider a match"),
  caseSensitive: z
    .boolean()
    .default(false)
    .describe("Case-sensitive comparison"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface Match {
  text: string;
  sourceStart: number;
  sourceEnd: number;
  comparisonStart: number;
  comparisonEnd: number;
}

/**
 * Finds the longest common substring between two strings.
 * Returns the substring and its positions in both strings.
 */
function findLongestCommonSubstring(
  source: string,
  comparison: string,
  minLength: number
): { substring: string; sourceIndex: number; comparisonIndex: number } | null {
  const m = source.length;
  const n = comparison.length;

  if (m === 0 || n === 0) {
    return null;
  }

  // Use a rolling array approach for memory efficiency
  let maxLength = 0;
  let maxEndPosSource = 0;
  let maxEndPosComparison = 0;

  // Create two rows for the DP table
  let previousRow: number[] = new Array<number>(n + 1).fill(0);
  let currentRow: number[] = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (source[i - 1] === comparison[j - 1]) {
        currentRow[j] = (previousRow[j - 1] ?? 0) + 1;
        if ((currentRow[j] ?? 0) > maxLength) {
          maxLength = currentRow[j] ?? 0;
          maxEndPosSource = i;
          maxEndPosComparison = j;
        }
      } else {
        currentRow[j] = 0;
      }
    }
    // Swap rows
    [previousRow, currentRow] = [currentRow, previousRow];
    // Reset current row
    currentRow.fill(0);
  }

  if (maxLength >= minLength) {
    const startSource = maxEndPosSource - maxLength;
    const startComparison = maxEndPosComparison - maxLength;
    return {
      substring: source.substring(startSource, maxEndPosSource),
      sourceIndex: startSource,
      comparisonIndex: startComparison,
    };
  }

  return null;
}

/**
 * Finds all matching phrases between source and comparison texts.
 * Uses an iterative approach to find common substrings.
 */
function findAllMatches(
  originalSource: string,
  originalComparison: string,
  minLength: number,
  caseSensitive: boolean
): Match[] {
  const matches: Match[] = [];

  // Create normalized versions for comparison
  const source = caseSensitive ? originalSource : originalSource.toLowerCase();
  const comparison = caseSensitive
    ? originalComparison
    : originalComparison.toLowerCase();

  // Track which portions have been matched
  const sourceMatched: boolean[] = new Array<boolean>(source.length).fill(
    false
  );
  const comparisonMatched: boolean[] = new Array<boolean>(
    comparison.length
  ).fill(false);

  // Iteratively find matches
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops

  while (iterations < maxIterations) {
    iterations++;

    // Create masked versions of the strings
    // Use different replacement chars so masked regions won't match each other
    let maskedSource = "";
    let maskedComparison = "";

    for (let i = 0; i < source.length; i++) {
      maskedSource += sourceMatched[i] ? "\x01" : source[i];
    }
    for (let i = 0; i < comparison.length; i++) {
      maskedComparison += comparisonMatched[i] ? "\x02" : comparison[i];
    }

    const result = findLongestCommonSubstring(
      maskedSource,
      maskedComparison,
      minLength
    );

    if (!result) {
      break;
    }

    // Verify the match doesn't contain masked characters
    const matchedSubstr = maskedSource.substring(
      result.sourceIndex,
      result.sourceIndex + result.substring.length
    );
    if (matchedSubstr.includes("\x01") || matchedSubstr.includes("\x02")) {
      break;
    }

    // Mark these positions as matched
    for (let i = 0; i < result.substring.length; i++) {
      sourceMatched[result.sourceIndex + i] = true;
      comparisonMatched[result.comparisonIndex + i] = true;
    }

    // Get the original text (preserving case)
    const matchedText = originalSource.substring(
      result.sourceIndex,
      result.sourceIndex + result.substring.length
    );

    matches.push({
      text: matchedText,
      sourceStart: result.sourceIndex,
      sourceEnd: result.sourceIndex + result.substring.length,
      comparisonStart: result.comparisonIndex,
      comparisonEnd: result.comparisonIndex + result.substring.length,
    });
  }

  // Sort matches by source position
  matches.sort((a, b) => a.sourceStart - b.sourceStart);

  return matches;
}

/**
 * Calculates similarity score based on matched content.
 */
function calculateSimilarityScore(
  matches: Match[],
  sourceLength: number,
  comparisonLength: number
): number {
  if (sourceLength === 0 && comparisonLength === 0) {
    return 100;
  }

  if (sourceLength === 0 || comparisonLength === 0) {
    return 0;
  }

  // Calculate total matched characters
  let totalMatchedInSource = 0;
  let totalMatchedInComparison = 0;

  for (const match of matches) {
    totalMatchedInSource += match.sourceEnd - match.sourceStart;
    totalMatchedInComparison += match.comparisonEnd - match.comparisonStart;
  }

  // Calculate similarity as average of coverage in both texts (0-1)
  const sourceCoverage = totalMatchedInSource / sourceLength;
  const comparisonCoverage = totalMatchedInComparison / comparisonLength;
  const similarity = (sourceCoverage + comparisonCoverage) / 2;

  // Convert to percentage (0-100) and round to 2 decimal places
  return Math.round(similarity * 10000) / 100;
}

/**
 * Highlights matched portions in text with markers.
 */
function highlightText(
  text: string,
  positions: Array<{ start: number; end: number }>
): string {
  if (positions.length === 0) {
    return text;
  }

  // Sort positions by start
  const sortedPositions = [...positions].sort((a, b) => a.start - b.start);

  // Build highlighted string
  let result = "";
  let lastEnd = 0;

  for (const pos of sortedPositions) {
    // Add non-matched text before this match
    result += text.substring(lastEnd, pos.start);
    // Add matched text with markers
    result += `[[${text.substring(pos.start, pos.end)}]]`;
    lastEnd = pos.end;
  }

  // Add remaining text after last match
  result += text.substring(lastEnd);

  return result;
}

/**
 * Detects plagiarized content between two texts.
 */
function execute(input: Input, options?: Options): Output {
  const minMatchLength = options?.minMatchLength ?? 20;
  const caseSensitive = options?.caseSensitive ?? false;

  const source = input.source;
  const comparison = input.comparison;

  // Find all matches
  const matches = findAllMatches(
    source,
    comparison,
    minMatchLength,
    caseSensitive
  );

  // Calculate similarity score
  const similarityScore = calculateSimilarityScore(
    matches,
    source.length,
    comparison.length
  );

  // Create highlighted versions
  const sourcePositions = matches.map((m) => ({
    start: m.sourceStart,
    end: m.sourceEnd,
  }));
  const comparisonPositions = matches.map((m) => ({
    start: m.comparisonStart,
    end: m.comparisonEnd,
  }));

  const highlightedSource = highlightText(source, sourcePositions);
  const highlightedComparison = highlightText(comparison, comparisonPositions);

  return {
    matches,
    similarityScore,
    highlightedSource,
    highlightedComparison,
  };
}

/**
 * Plagiarism Highlighter tool.
 * Detects and highlights matching text between two documents.
 */
export const plagiarismHighlighter = defineTool({
  meta: {
    id: "text/plagiarism-highlighter",
    name: "Text Overlap Finder",
    description:
      "Free online text overlap finder — detect and highlight matching passages between two texts instantly in your browser. No data is stored. Finds common substrings with configurable minimum match length and case sensitivity.",
    category: "text",
    subgroup: "Comparison",
    tier: ToolTier.CLIENT,
    keywords: [
      "text",
      "overlap",
      "common",
      "substring",
      "match",
      "highlight",
      "compare",
    ],
    examples: [
      {
        title: "Find overlapping text",
        description: "Detect common passages between two documents",
        input: {
          source: "The quick brown fox jumps over the lazy dog in the park.",
          comparison: "A fast brown fox jumps over the lazy dog at the zoo.",
        },
        output:
          '{"matches":[{"text":" brown fox jumps over the lazy dog ","sourceStart":9,"sourceEnd":44,"comparisonStart":6,"comparisonEnd":41}],"similarityScore":64.9,"highlightedSource":"The quick[[ brown fox jumps over the lazy dog ]]in the park.","highlightedComparison":"A fast[[ brown fox jumps over the lazy dog ]]at the zoo."}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
