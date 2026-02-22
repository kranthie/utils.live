/**
 * Text & String Manipulation Tools
 *
 * Tools for transforming, analyzing, comparing, generating, and extracting text.
 */

// Text Transformation Tools
export { caseConverter } from "./case-converter";
export { slugify } from "./slugify";
export { textReverser } from "./text-reverser";
export { lineSorter } from "./line-sorter";
export { lineDeduplicator } from "./line-deduplicator";
export { lineShuffler } from "./line-shuffler";
export { lineNumberer } from "./line-numberer";
export { emptyLineRemover } from "./empty-line-remover";
export { whitespaceCleaner } from "./whitespace-cleaner";
export { textTrimmer } from "./text-trimmer";
export { findReplace } from "./find-replace";
export { textWrapper } from "./text-wrapper";
export { prefixSuffixAdder } from "./prefix-suffix-adder";
export { columnAligner } from "./column-aligner";
export { textTruncator } from "./text-truncator";
export { palindromeChecker } from "./palindrome-checker";
export { rot13Encoder } from "./rot13-encoder";

// Text Analysis Tools
export { readingTime } from "./reading-time";
export { wordFrequency } from "./word-frequency";
export { textStatistics } from "./text-statistics";
export { readabilityScore } from "./readability-score";
export { letterFrequency } from "./letter-frequency";
export { ngramGenerator } from "./ngram-generator";

// Text Comparison Tools
export { textDiff } from "./text-diff";
export { similarityScore } from "./similarity-score";
export { plagiarismHighlighter } from "./plagiarism-highlighter";

// Text Generation Tools
export { loremIpsum } from "./lorem-ipsum";

// Text Extraction Tools
export { emailExtractor } from "./email-extractor";
export { urlExtractor } from "./url-extractor";
export { phoneExtractor } from "./phone-extractor";
export { ipExtractor } from "./ip-extractor";
export { hashtagExtractor } from "./hashtag-extractor";
export { mentionExtractor } from "./mention-extractor";
export { numberExtractor } from "./number-extractor";
export { dateExtractor } from "./date-extractor";

// Additional Text Tools
export { keywordExtractor } from "./keyword-extractor";
export { languageDetector } from "./language-detector";
export { anagramGenerator } from "./anagram-generator";
export { semanticDiff } from "./semantic-diff";
export { fakeName, fakeAddress, fakeCompany } from "./fake-data";

// Phonetic Algorithms
export { soundexGenerator } from "./soundex-generator";
export { metaphoneGenerator } from "./metaphone-generator";
