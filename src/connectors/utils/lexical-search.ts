/**
 * Lexical search utility for searching through structured data
 * Uses BM25 algorithm for proper relevance scoring
 */

import BM25 from 'okapibm25';

export interface SearchableItem {
  [key: string]: unknown;
}

export interface SearchResult<T extends SearchableItem> {
  item: T;
  score: number;
  matches: string[];
}

export interface SearchOptions {
  /**
   * Fields to search in. If not provided, will search all string fields
   */
  fields?: string[];

  /**
   * Minimum score threshold for results
   */
  threshold?: number;

  /**
   * Maximum number of results to return
   */
  maxResults?: number;

  /**
   * Case sensitive search
   */
  caseSensitive?: boolean;

  /**
   * BM25 k1 parameter (term frequency saturation point)
   */
  k1?: number;

  /**
   * BM25 b parameter (field length normalization)
   */
  b?: number;
}

/**
 * Extracts searchable text from an object
 */
function extractSearchableText(
  item: SearchableItem,
  fields?: string[]
): Record<string, string> {
  const searchableFields: Record<string, string> = {};

  if (fields && fields.length > 0) {
    // Search only specified fields
    for (const field of fields) {
      const value = getNestedValue(item, field);
      if (typeof value === 'string') {
        searchableFields[field] = value;
      }
    }
  } else {
    // Search all string fields recursively
    extractStringFields(item, searchableFields);
  }

  return searchableFields;
}

/**
 * Recursively extracts string fields from an object
 */
function extractStringFields(
  obj: unknown,
  result: Record<string, string>,
  prefix = ''
): void {
  if (typeof obj === 'string') {
    result[prefix] = obj;
    return;
  }

  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        extractStringFields(item, result, `${prefix}[${index}]`);
      });
    } else {
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        extractStringFields(value, result, fieldPath);
      }
    }
  }
}

/**
 * Gets a nested value from an object using dot notation
 */
function getNestedValue(obj: SearchableItem, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Tokenizes text into searchable terms
 */
function tokenizeText(text: string, caseSensitive = false): string[] {
  const normalized = caseSensitive ? text : text.toLowerCase();

  // Split on word boundaries and filter out empty strings and single characters
  return normalized
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 1);
}

/**
 * Finds matching terms between query and text
 */
function findMatchingTerms(queryTerms: string[], textTerms: string[]): string[] {
  const matches: string[] = [];

  for (const queryTerm of queryTerms) {
    if (textTerms.includes(queryTerm)) {
      matches.push(queryTerm);
    }
  }

  return matches;
}

/**
 * Performs lexical search on an array of items using BM25 algorithm
 */
export function lexicalSearch<T extends SearchableItem>(
  items: T[],
  query: string,
  options: SearchOptions = {}
): SearchResult<T>[] {
  const {
    threshold = 0,
    maxResults = 50,
    caseSensitive = false,
    k1 = 1.2,
    b = 0.75,
  } = options;

  if (!query || query.trim() === '') {
    return items.map((item) => ({ item, score: 0, matches: [] }));
  }

  // Tokenize the search query
  const queryTerms = tokenizeText(query, caseSensitive);

  if (queryTerms.length === 0) {
    return items.map((item) => ({ item, score: 0, matches: [] }));
  }

  // Extract searchable text from all items and create documents
  const documents: string[] = [];
  const itemTokens: string[][] = [];

  for (const item of items) {
    const searchableFields = extractSearchableText(item, options.fields);

    // Combine all field values into a single document
    const combinedText = Object.entries(searchableFields)
      .map(([fieldName, fieldValue]) => {
        // Weight important fields by repeating them
        const weight = getFieldWeight(fieldName);
        const repetitions = Math.max(1, Math.floor(weight));
        return Array(repetitions).fill(fieldValue).join(' ');
      })
      .join(' ');

    const docTokens = tokenizeText(combinedText, caseSensitive);
    documents.push(combinedText);
    itemTokens.push(docTokens);
  }

  // Get BM25 scores for the query using the function API
  const scores = BM25(documents, queryTerms, { k1, b }) as number[];

  // Create results with scores and matches
  const results: SearchResult<T>[] = [];

  for (let i = 0; i < items.length; i++) {
    const score = scores[i] || 0;

    if (score >= threshold) {
      // Find matching terms
      const docTokens = itemTokens[i];
      if (docTokens) {
        const matches = findMatchingTerms(queryTerms, docTokens);

        const item = items[i];
        if (item) {
          results.push({
            item,
            score,
            matches,
          });
        }
      }
    }
  }

  // Sort by score descending and limit results
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Gets field weight for scoring (can be customized per use case)
 */
function getFieldWeight(fieldName: string): number {
  // Common field weights - can be customized
  if (fieldName.includes('title') || fieldName.includes('name')) {
    return 1.5;
  }
  if (fieldName.includes('description') || fieldName.includes('summary')) {
    return 1.2;
  }
  if (fieldName.includes('key') || fieldName.includes('id')) {
    return 1.8;
  }
  if (fieldName.includes('label') || fieldName.includes('tag')) {
    return 1.3;
  }

  return 1.0; // Default weight
}

/**
 * Simple search function that returns just the filtered items
 */
export function simpleSearch<T extends SearchableItem>(
  items: T[],
  query: string,
  options: SearchOptions = {}
): T[] {
  return lexicalSearch(items, query, options).map((result) => result.item);
}

/**
 * Search function that returns items with a minimum score threshold
 */
export function searchWithThreshold<T extends SearchableItem>(
  items: T[],
  query: string,
  minScore: number,
  options: SearchOptions = {}
): SearchResult<T>[] {
  return lexicalSearch(items, query, { ...options, threshold: minScore });
}
