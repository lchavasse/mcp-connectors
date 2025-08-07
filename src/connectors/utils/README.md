# Connector Utilities

This directory contains utility functions for MCP connectors.

## Lexical Search

The lexical search utility provides BM25-based search functionality for structured data objects.

### Overview

The search utility uses the industry-standard **Okapi BM25** algorithm to provide relevant search results across structured data. It automatically extracts searchable text from objects and scores results based on term frequency, document length, and field importance.

### Quick Start

```typescript
import { simpleSearch } from './utils/lexical-search';

const items = [
  { title: 'Document 1', content: 'This is about search algorithms' },
  { title: 'Document 2', content: 'This covers machine learning' },
  { title: 'Document 3', content: 'Advanced search techniques' },
];

const results = simpleSearch(items, 'search algorithms');
// Returns filtered items ranked by relevance
```

### API Reference

#### `simpleSearch<T>(items: T[], query: string, options?: SearchOptions): T[]`

Performs a search and returns the filtered items.

**Parameters:**
- `items`: Array of objects to search
- `query`: Search query string
- `options`: Optional search configuration

**Returns:** Array of items matching the search query, sorted by relevance.

#### `lexicalSearch<T>(items: T[], query: string, options?: SearchOptions): SearchResult<T>[]`

Performs a search and returns detailed results with scores.

**Parameters:**
- `items`: Array of objects to search
- `query`: Search query string  
- `options`: Optional search configuration

**Returns:** Array of `SearchResult` objects containing:
- `item`: The original item
- `score`: BM25 relevance score
- `matches`: Array of matching query terms

#### `searchWithThreshold<T>(items: T[], query: string, minScore: number, options?: SearchOptions): SearchResult<T>[]`

Performs a search with a minimum score threshold.

### Search Options

```typescript
interface SearchOptions {
  fields?: string[];        // Fields to search (default: all string fields)
  threshold?: number;       // Minimum score threshold (default: 0)
  maxResults?: number;      // Maximum results to return (default: 50)
  caseSensitive?: boolean;  // Case sensitive search (default: false)
  k1?: number;             // BM25 k1 parameter (default: 1.2)
  b?: number;              // BM25 b parameter (default: 0.75)
}
```

### Examples

#### Basic Search

```typescript
const items = [
  { name: 'John Doe', email: 'john@example.com', role: 'developer' },
  { name: 'Jane Smith', email: 'jane@example.com', role: 'designer' },
  { name: 'Bob Johnson', email: 'bob@example.com', role: 'developer' },
];

const results = simpleSearch(items, 'developer');
// Returns John Doe and Bob Johnson
```

#### Field-Specific Search

```typescript
const options = {
  fields: ['name', 'email'],  // Only search in name and email fields
  maxResults: 10,
  threshold: 0.1,
};

const results = simpleSearch(items, 'john', options);
```

#### Detailed Results with Scores

```typescript
const results = lexicalSearch(items, 'developer john');

results.forEach(result => {
  console.log(`Item: ${result.item.name}`);
  console.log(`Score: ${result.score}`);
  console.log(`Matches: ${result.matches.join(', ')}`);
});
```

#### Nested Object Search

```typescript
const items = [
  {
    id: '1',
    title: 'Project Alpha',
    details: {
      description: 'Machine learning project',
      tags: ['AI', 'ML', 'Python']
    }
  },
  {
    id: '2', 
    title: 'Project Beta',
    details: {
      description: 'Web development project',
      tags: ['React', 'TypeScript', 'Node.js']
    }
  }
];

// Searches all string fields recursively
const results = simpleSearch(items, 'machine learning');
```

### BM25 Parameters

The search utility uses the BM25 algorithm with configurable parameters:

- **k1** (default: 1.2): Controls term frequency saturation. Higher values give more weight to term frequency.
- **b** (default: 0.75): Controls field length normalization. Higher values penalize longer documents more.

```typescript
const options = {
  k1: 1.5,  // More weight on term frequency
  b: 0.5,   // Less penalty for long documents
};
```

### Field Weighting

The search utility automatically weights different fields based on their importance:

- **ID/Key fields**: 1.8x weight
- **Title/Name fields**: 1.5x weight
- **Label/Tag fields**: 1.3x weight
- **Description fields**: 1.2x weight
- **Other fields**: 1.0x weight

### Usage in Connectors

Here's how to use the search utility in MCP connectors:

```typescript
import { simpleSearch } from './utils/lexical-search';

export const MyConnectorConfig = mcpConnectorConfig({
  // ... other config
  tools: (tool) => ({
    SEARCH_ITEMS: tool({
      name: 'search_items',
      description: 'Search for items',
      schema: z.object({
        query: z.string().describe('Search query'),
      }),
      handler: async (args, context) => {
        try {
          const items = await fetchItems(); // Your data source
          
          const results = simpleSearch(
            items as Record<string, unknown>[],
            args.query,
            {
              caseSensitive: false,
              maxResults: 20,
              threshold: 0.1,
            }
          );
          
          return JSON.stringify(results, null, 2);
        } catch (error) {
          return `Search failed: ${error.message}`;
        }
      },
    }),
  }),
});
```

### Performance Tips

1. **Use field restrictions** when possible to improve performance:
   ```typescript
   const options = { fields: ['title', 'description'] };
   ```

2. **Set appropriate thresholds** to filter out irrelevant results:
   ```typescript
   const options = { threshold: 0.1 };
   ```

3. **Limit result count** for better performance:
   ```typescript
   const options = { maxResults: 20 };
   ```

### Error Handling

The search utility handles various edge cases:

- Empty queries return all items with score 0
- Invalid fields are ignored
- Non-string values are automatically filtered out
- Malformed objects are handled gracefully

```typescript
try {
  const results = simpleSearch(items, query, options);
  // Process results
} catch (error) {
  console.error('Search failed:', error.message);
}
```

## Contributing

When adding new utility functions:

1. Follow the existing code style and patterns
2. Add comprehensive JSDoc comments
3. Include examples in this README
4. Add unit tests for new functionality
5. Update the API documentation