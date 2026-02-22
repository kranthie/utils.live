/**
 * Shared minification utilities.
 */

export function getByteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}

export function calcReduction(original: string, minified: string): number {
  const origSize = getByteSize(original);
  const minSize = getByteSize(minified);
  return origSize > 0 ? Math.round(((origSize - minSize) / origSize) * 100) : 0;
}

export function minifyCLikeCode(code: string): string {
  let result = code;
  // Remove single-line comments
  result = result.replace(/\/\/[^\n]*/g, "");
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  // Collapse whitespace
  result = result.replace(/\s+/g, " ");
  // Remove space around operators and braces
  result = result.replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, "$1");
  // Restore needed spaces (after keywords)
  result = result.replace(
    /(return|var|let|const|function|class|if|else|for|while|do|switch|case|break|continue|throw|new|typeof|instanceof|import|export|from|default|void|delete|yield|await|async)\b(?!\s)/g,
    "$1 "
  );
  return result.trim();
}

export function minifyCss(code: string): string {
  let result = code;
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  result = result.replace(/\s*([{}:;,>~+])\s*/g, "$1");
  result = result.replace(/\s+/g, " ");
  result = result.replace(/;}/g, "}");
  return result.trim();
}

export function minifyHtml(code: string): string {
  let result = code;
  result = result.replace(/<!--[\s\S]*?-->/g, "");
  // Preserve pre/script/style content
  const preserved: string[] = [];
  let idx = 0;
  result = result.replace(
    /<(pre|script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (m) => {
      const placeholder = `__P${idx}__`;
      preserved.push(m);
      idx++;
      return placeholder;
    }
  );
  result = result.replace(/\s+/g, " ");
  result = result.replace(/>\s+</g, "><");
  for (let i = 0; i < preserved.length; i++) {
    result = result.replace(`__P${i}__`, preserved[i]!);
  }
  return result.trim();
}

export function minifyXml(code: string): string {
  let result = code;
  result = result.replace(/<!--[\s\S]*?-->/g, "");
  result = result.replace(/>\s+</g, "><");
  result = result.replace(/\s+/g, " ");
  return result.trim();
}

export function minifyJson(code: string): string {
  const parsed = JSON.parse(code) as Record<string, unknown>;
  return JSON.stringify(parsed);
}

export function minifySql(code: string): string {
  let result = code;
  result = result.replace(/--[^\n]*/g, "");
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  result = result.replace(/\s+/g, " ");
  return result.trim();
}

export function minifyGraphql(code: string): string {
  let result = code;
  result = result.replace(/#[^\n]*/g, "");
  result = result.replace(/\s+/g, " ");
  result = result.replace(/\s*([{}():,])\s*/g, "$1");
  return result.trim();
}
