/**
 * Tool Search Library
 *
 * Provides fuzzy search functionality for tools with scoring.
 */

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  icon: string;
}

interface SearchResult {
  tool: Tool;
  matchType: "name" | "description" | "keyword";
  matchScore: number;
}

interface SearchOptions {
  /**
   * Maximum number of results to return
   * @default 20
   */
  limit?: number;
  /**
   * Minimum score threshold (0-1)
   * @default 0.1
   */
  minScore?: number;
  /**
   * Category filter
   */
  category?: string;
}

/**
 * Calculate the Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}

/**
 * Calculate similarity score between query and target string (0-1)
 */
function calculateSimilarity(query: string, target: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerTarget = target.toLowerCase();

  // Exact match
  if (lowerTarget === lowerQuery) return 1;

  // Starts with query - high score
  if (lowerTarget.startsWith(lowerQuery)) {
    return 0.9 + (0.1 * lowerQuery.length) / lowerTarget.length;
  }

  // Contains query - medium-high score
  if (lowerTarget.includes(lowerQuery)) {
    const position = lowerTarget.indexOf(lowerQuery);
    const positionBonus = 1 - position / lowerTarget.length;
    return 0.6 + 0.3 * positionBonus;
  }

  // Word boundary match
  const words = lowerTarget.split(/[\s-_]+/);
  for (const word of words) {
    if (word.startsWith(lowerQuery)) {
      return 0.7;
    }
  }

  // Fuzzy match using Levenshtein distance
  const maxLength = Math.max(lowerQuery.length, lowerTarget.length);
  if (maxLength === 0) return 0;

  const distance = levenshteinDistance(lowerQuery, lowerTarget);
  const similarity = 1 - distance / maxLength;

  // Only return fuzzy matches above a threshold
  return similarity > 0.5 ? similarity * 0.5 : 0;
}

/**
 * Search tools by query string
 */
export function searchTools(
  tools: Tool[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { limit = 20, minScore = 0.1, category } = options;

  if (!query.trim()) {
    // Return recent/popular tools when no query
    const filtered = category
      ? tools.filter((t) => t.category === category)
      : tools;
    return filtered.slice(0, limit).map((tool) => ({
      tool,
      matchType: "name" as const,
      matchScore: 1,
    }));
  }

  const results: SearchResult[] = [];

  for (const tool of tools) {
    // Skip if category filter doesn't match
    if (category && tool.category !== category) continue;

    // Calculate scores for different fields
    const nameScore = calculateSimilarity(query, tool.name);
    const descScore = calculateSimilarity(query, tool.description) * 0.7;
    const keywordScores = tool.keywords.map(
      (k) => calculateSimilarity(query, k) * 0.8
    );
    const maxKeywordScore = Math.max(0, ...keywordScores);

    // Determine best match
    const scores = [
      { type: "name" as const, score: nameScore },
      { type: "description" as const, score: descScore },
      { type: "keyword" as const, score: maxKeywordScore },
    ];

    const bestMatch = scores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    if (bestMatch.score >= minScore) {
      results.push({
        tool,
        matchType: bestMatch.type,
        matchScore: bestMatch.score,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.matchScore - a.matchScore);

  return results.slice(0, limit);
}

/**
 * Group search results by category
 */
export function groupResultsByCategory(
  results: SearchResult[]
): Map<string, SearchResult[]> {
  const groups = new Map<string, SearchResult[]>();

  for (const result of results) {
    const category = result.tool.category;
    const group = groups.get(category) ?? [];
    group.push(result);
    groups.set(category, group);
  }

  return groups;
}

/**
 * Get search suggestions based on partial query
 */
export function getSearchSuggestions(
  tools: Tool[],
  query: string,
  limit: number = 5
): string[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const suggestions = new Set<string>();

  // Collect matching tool names
  for (const tool of tools) {
    if (tool.name.toLowerCase().startsWith(lowerQuery)) {
      suggestions.add(tool.name);
    }
    for (const keyword of tool.keywords) {
      if (keyword.toLowerCase().startsWith(lowerQuery)) {
        suggestions.add(keyword);
      }
    }
    if (suggestions.size >= limit) break;
  }

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Highlight matching text in a string
 */
export function highlightMatch(text: string, query: string): string {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    text.slice(0, index) +
    "<mark>" +
    text.slice(index, index + query.length) +
    "</mark>" +
    text.slice(index + query.length)
  );
}
