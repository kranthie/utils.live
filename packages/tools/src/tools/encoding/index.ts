// Base64
export { base64Encode } from "./base64-encode";
export { base64Decode } from "./base64-decode";

// Base Encoding
export { base64urlEncode } from "./base64url-encode";
export { base64urlDecode } from "./base64url-decode";
export { base32EncodeDecode } from "./base32-encode-decode";
export { base58EncodeDecode } from "./base58-encode-decode";
export { base62EncodeDecode } from "./base62-encode-decode";
export { hexEncode } from "./hex-encode";
export { hexDecode } from "./hex-decode";
export { binaryToText } from "./binary-to-text";
export { textToBinary } from "./text-to-binary";
export { octalConverter } from "./octal-converter";

// URL Encoding
export { urlEncode } from "./url-encode";
export { urlDecode } from "./url-decode";
export { urlEncodeFull } from "./url-encode-full";
export { urlParser } from "./url-parser";
export { urlBuilder } from "./url-builder";
export { queryStringParser } from "./query-string-parser";
export { queryStringBuilder } from "./query-string-builder";
export { dataUrlBuilder } from "./data-url-builder";

// Text Encoding
export { unicodeEscape } from "./unicode-escape";
export { unicodeUnescape } from "./unicode-unescape";
export { htmlEntityEncode } from "./html-entity-encode";
export { htmlEntityDecode } from "./html-entity-decode";
export { jsEscape } from "./js-escape";
export { jsUnescape } from "./js-unescape";
// Re-exported with alias to avoid conflicts with ../json barrel
export { jsonEscape as encodingJsonEscape } from "./json-escape";
export { jsonUnescape as encodingJsonUnescape } from "./json-unescape";
export { punycodeEncode } from "./punycode-encode";
export { punycodeDecode } from "./punycode-decode";

// Character Sets
export { utf8ToUtf16 } from "./utf8-to-utf16";
export { utf16ToUtf8 } from "./utf16-to-utf8";
export { latin1Converter } from "./latin1-converter";
export { asciiTable } from "./ascii-table";
export { unicodeLookup } from "./unicode-lookup";
export { characterInspector } from "./character-inspector";
export { charsetDetector } from "./charset-detector";
export { bomRemover } from "./bom-remover";

// Number Encodings
export { anyBaseConverter } from "./any-base-converter";

// Character Encoding Schemes
export { morseCode } from "./morse-code";
export { natoAlphabet } from "./nato-alphabet";
