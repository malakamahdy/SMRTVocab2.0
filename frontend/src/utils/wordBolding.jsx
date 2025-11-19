import React from 'react';

/**
 * Clean markdown and HTML formatting from text.
 * Converts markdown bold to HTML bold and removes other markdown/HTML artifacts.
 * 
 * @param {string} text - The text to process
 * @returns {string} - Cleaned text with markdown bold converted to HTML
 */
function convertMarkdownBold(text) {
  if (!text) return text;
  
  // Convert **text** to <strong>text</strong>
  // This regex matches **text** where text contains at least one non-asterisk character
  text = text.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  
  // Remove any remaining standalone double asterisks
  text = text.replace(/\*\*/g, '');
  
  // Remove any remaining single asterisks (not part of **)
  text = text.replace(/\*(?!\*)/g, '');
  
  // Remove other common markdown artifacts
  // Remove markdown headers (# ## ###)
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove markdown links but keep the text [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown emphasis _text_ or *text* (but not already converted bold)
  text = text.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1');
  text = text.replace(/_([^_\n]+?)_/g, '$1');
  
  // Decode HTML entities first (needed before parsing tags)
  // Decode numeric entities
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  text = text.replace(/&#x([a-f\d]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Decode named entities
  const entities = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' '
  };
  Object.entries(entities).forEach(([entity, char]) => {
    text = text.replace(new RegExp(entity, 'g'), char);
  });
  
  // Remove any literal HTML tags that might have been output as text (but preserve <strong>)
  // This handles cases where Gemini outputs literal HTML tag text that isn't <strong>
  text = text.replace(/<(?!(?:\/strong|strong\b))[^>]+>/gi, '');
  
  // Clean up any extra whitespace from removed markdown
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text;
}

/**
 * Utility function to bold words in text that match the current words being learned.
 * Case-insensitive, whole-word matching only.
 * 
 * @param {string} text - The text to process
 * @param {Array} currentWords - Array of word objects with 'foreign' property
 * @returns {string} - Text with matching words wrapped in <strong> tags (as HTML string)
 */
export function boldCurrentWords(text, currentWords) {
  if (!text) {
    return text;
  }
  
  // First, convert any markdown bold to HTML bold
  text = convertMarkdownBold(text);
  
  if (!currentWords || currentWords.length === 0) {
    return text;
  }
  
  // Separate single-character words from multi-character words
  // Single characters need stricter matching to avoid matching inside other words
  const singleCharWords = [];
  const multiCharWords = [];
  const wordMap = new Map();
  
  currentWords.forEach(word => {
    const lower = word.foreign.toLowerCase().trim();
    if (!wordMap.has(lower)) {
      wordMap.set(lower, word.foreign);
      if (lower.length === 1) {
        singleCharWords.push(lower);
      } else {
        multiCharWords.push(lower);
      }
    }
  });
  
  // Process multi-character words first (using word boundaries)
  if (multiCharWords.length > 0) {
    const escapedMultiChar = multiCharWords.map(word => {
      return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    const multiCharPattern = `\\b(${escapedMultiChar.join('|')})\\b`;
    const multiCharRegex = new RegExp(multiCharPattern, 'gi');
    
    text = text.replace(multiCharRegex, (match) => {
      const lowerMatch = match.toLowerCase();
      const originalWord = wordMap.get(lowerMatch) || match;
      return `<strong>${originalWord}</strong>`;
    });
  }
  
  // Process single-character words separately with stricter matching
  // Must be a complete standalone word, not part of another word
  if (singleCharWords.length > 0) {
    const escapedSingleChar = singleCharWords.map(word => {
      return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    
    // Use word boundary approach but with explicit non-word character checks
    // Match single char only when surrounded by non-word characters (including HTML tags)
    // Pattern: non-word or start-of-string, then char, then non-word or end-of-string
    const singleCharPattern = `(^|[^\\w<>])(${escapedSingleChar.join('|')})(?=[^\\w<>]|$)`;
    const singleCharRegex = new RegExp(singleCharPattern, 'gi');
    
    // Collect all matches first
    const matches = [];
    let match;
    const searchText = text;
    
    while ((match = singleCharRegex.exec(searchText)) !== null) {
      const char = match[2]; // The actual character is in group 2
      const prefix = match[1]; // Prefix (non-word char or empty)
      const matchIndex = match.index;
      const beforeMatch = searchText.substring(0, matchIndex);
      
      // Skip if we're inside an HTML tag (between < and >)
      const lastOpenTag = beforeMatch.lastIndexOf('<');
      const lastCloseTag = beforeMatch.lastIndexOf('>');
      if (lastOpenTag > lastCloseTag) {
        continue;
      }
      
      // Skip if already inside a <strong> tag
      const openStrongTags = (beforeMatch.match(/<strong>/g) || []).length;
      const closeStrongTags = (beforeMatch.match(/<\/strong>/g) || []).length;
      if (openStrongTags > closeStrongTags) {
        continue;
      }
      
      matches.push({
        index: matchIndex,
        prefix: prefix,
        char: char,
        fullMatch: match[0]
      });
    }
    
    // Replace matches from end to start to preserve indices
    matches.reverse().forEach(({ index, prefix, char, fullMatch }) => {
      const lowerChar = char.toLowerCase();
      const originalChar = wordMap.get(lowerChar) || char;
      const before = text.substring(0, index);
      const after = text.substring(index + fullMatch.length);
      // Keep the prefix (like space or punctuation) and just bold the char
      text = before + prefix + `<strong>${originalChar}</strong>` + after;
    });
  }
  
  return text;
}

/**
 * Decode HTML entities in a string.
 * 
 * @param {string} text - Text that may contain HTML entities
 * @returns {string} - Text with HTML entities decoded
 */
function decodeHtmlEntities(text) {
  if (!text) return text;
  
  const entities = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' '
  };
  
  // Decode numeric entities too (like &#60; for <)
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  text = text.replace(/&#x([a-f\d]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Decode named entities
  Object.entries(entities).forEach(([entity, char]) => {
    text = text.replace(new RegExp(entity, 'g'), char);
  });
  
  return text;
}

/**
 * Convert a string with HTML tags to React elements.
 * Used for rendering text with bolded words.
 * 
 * @param {string} htmlString - String with HTML tags (like <strong>)
 * @returns {Array} - Array of React elements and strings
 */
export function parseBoldedText(htmlString) {
  if (!htmlString) return [];
  
  // First decode any HTML entities (like &lt;strong&gt; to <strong>)
  htmlString = decodeHtmlEntities(htmlString);
  
  const parts = [];
  const regex = /<strong>(.*?)<\/strong>/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  
  while ((match = regex.exec(htmlString)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = htmlString.substring(lastIndex, match.index);
      if (textBefore) {
        // Decode any HTML entities in the text before
        parts.push(decodeHtmlEntities(textBefore));
      }
    }
    
    // Add the bolded word (also decode entities in the content)
    parts.push(<strong key={`bold-${key++}`}>{decodeHtmlEntities(match[1])}</strong>);
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < htmlString.length) {
    const remainingText = htmlString.substring(lastIndex);
    if (remainingText) {
      parts.push(decodeHtmlEntities(remainingText));
    }
  }
  
  return parts.length > 0 ? parts : [htmlString];
}

