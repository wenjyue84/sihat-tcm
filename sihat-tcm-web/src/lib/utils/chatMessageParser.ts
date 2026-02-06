/**
 * Chat message parsing utilities
 * Used for extracting structured data from AI chat responses
 */

/**
 * Result of extracting options from a message
 */
export interface ExtractOptionsResult {
  cleanContent: string;
  options: string[];
}

/**
 * Extract suggested options from message content
 * AI responses may include <OPTIONS>opt1, opt2, opt3</OPTIONS> tags
 *
 * @param content - Raw message content
 * @returns Object with cleaned content and extracted options array
 *
 * @example
 * const result = extractOptions("Hello! <OPTIONS>Yes, No, Maybe</OPTIONS>");
 * // result.cleanContent = "Hello!"
 * // result.options = ["Yes", "No", "Maybe"]
 */
export function extractOptions(content: string): ExtractOptionsResult {
  if (!content) return { cleanContent: "", options: [] };

  // First, normalize the content - handle various escape formats
  let normalizedContent = content
    // Handle backslash-escaped angle brackets: \< and \>
    .replace(/\\</g, "<")
    .replace(/\\>/g, ">")
    // Handle HTML entities
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    // Handle unicode escapes that might appear in JSON
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">");

  // Try multiple regex patterns to handle various tag formats
  const patterns = [
    // Standard patterns (case-insensitive)
    /<options>([\s\S]*?)<\/options>/i,
    /<OPTIONS>([\s\S]*?)<\/OPTIONS>/,
    // With spaces
    /<\s*options\s*>([\s\S]*?)<\s*\/\s*options\s*>/i,
    // Malformed tags with quotes
    /['"]?<options['"]?>([\s\S]*?)<\/options>/i,
  ];

  let match: RegExpMatchArray | null = null;
  for (const pattern of patterns) {
    match = normalizedContent.match(pattern);
    if (match) break;
  }

  if (match) {
    const optionsStr = match[1];
    // Clean content: remove all variants of the options tag
    let cleanContent = normalizedContent
      .replace(/<options>[\s\S]*?<\/options>/gi, "")
      .replace(/<OPTIONS>[\s\S]*?<\/OPTIONS>/g, "")
      .replace(/<\s*options\s*>[\s\S]*?<\s*\/\s*options\s*>/gi, "")
      .replace(/['"]?<options['"]?>[\s\S]*?<\/options>/gi, "")
      .trim();
    const options = optionsStr
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o);
    return { cleanContent, options };
  }

  return { cleanContent: content, options: [] };
}
