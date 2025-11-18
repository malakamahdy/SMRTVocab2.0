import React from 'react';

/**
 * Utility function to bold words in text that match the current words being learned.
 * Case-insensitive, whole-word matching only.
 * 
 * @param {string} text - The text to process
 * @param {Array} currentWords - Array of word objects with 'foreign' property
 * @returns {string} - Text with matching words wrapped in <strong> tags (as HTML string)
 */
export function boldCurrentWords(text, currentWords) {
  if (!text || !currentWords || currentWords.length === 0) {
    return text;
  }
  
  // Create a map of lowercase words to their original casing for exact matching
  const wordMap = new Map();
  currentWords.forEach(word => {
    const lower = word.foreign.toLowerCase();
    if (!wordMap.has(lower)) {
      wordMap.set(lower, word.foreign);
    }
  });
  
  // Escape special regex characters in words
  const escapedWords = Array.from(wordMap.keys()).map(word => {
    return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  
  // Create regex pattern for whole-word matching (case-insensitive)
  // Use word boundaries that work with Unicode characters
  const wordPattern = `\\b(${escapedWords.join('|')})\\b`;
  const regex = new RegExp(wordPattern, 'gi');
  
  return text.replace(regex, (match) => {
    const lowerMatch = match.toLowerCase();
    const originalWord = wordMap.get(lowerMatch) || match;
    return `<strong>${originalWord}</strong>`;
  });
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
        parts.push(textBefore);
      }
    }
    
    // Add the bolded word
    parts.push(<strong key={`bold-${key++}`}>{match[1]}</strong>);
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < htmlString.length) {
    const remainingText = htmlString.substring(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }
  
  return parts.length > 0 ? parts : [htmlString];
}

