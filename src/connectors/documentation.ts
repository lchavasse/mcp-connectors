import { z } from 'zod';
import type { ConnectorContext } from '../config-types';
import { mcpConnectorConfig } from '../config-types';
import { simpleSearch } from './utils/lexical-search';

enum DocumentationCategory {
  AI = 'ai',
  DATABASE = 'database',
  FRAMEWORK = 'framework',
  EMAIL = 'email',
  AUTOMATION = 'automation',
  DEVELOPMENT = 'development',
  DOCUMENTATION = 'documentation',
  INFRASTRUCTURE = 'infrastructure',
  DATA = 'data',
  QUANTUM = 'quantum',
  REVENUE = 'revenue',
  VALIDATION = 'validation',
  MEETING = 'meeting',
  NOTIFICATION = 'notification',
  UNIFIED_API = 'unified-api',
  OTHER = 'other',
}

interface DocumentationProvider {
  key: string;
  name: string;
  description: string;
  llmsFullUrl: string;
  category: DocumentationCategory;
}

// Collection of providers mapped to their llms-full.txt endpoints
const DOCUMENTATION_PROVIDERS: DocumentationProvider[] = [
  {
    key: 'stackone',
    name: 'StackOne',
    description: 'Unified API for HR, ATS, CRM, and productivity tools',
    llmsFullUrl: 'https://docs.stackone.com/llms-full.txt',
    category: DocumentationCategory.UNIFIED_API,
  },
  {
    key: 'hono',
    name: 'Hono',
    description:
      'Hono is a fast, lightweight, web framework built on Web Standards. Support for any JavaScript runtime.',
    llmsFullUrl: 'https://hono.dev/llms-full.txt',
    category: DocumentationCategory.FRAMEWORK,
  },
  {
    key: 'ai-sdk',
    name: 'AI SDK',
    description: 'AI SDK for building AI-powered applications',
    llmsFullUrl: 'https://ai-sdk.dev/llms.txt',
    category: DocumentationCategory.AI,
  },
  {
    key: 'anthropic',
    name: 'Anthropic',
    description: 'AI safety company with Claude AI models',
    llmsFullUrl: 'https://docs.anthropic.com/llms-full.txt',
    category: DocumentationCategory.AI,
  },
  {
    key: 'resend',
    name: 'Resend',
    description: 'Email API for developers',
    llmsFullUrl: 'https://resend.com/docs/llms-full.txt',
    category: DocumentationCategory.EMAIL,
  },
  {
    key: 'prisma',
    name: 'Prisma',
    description: 'Modern database toolkit and ORM',
    llmsFullUrl: 'https://www.prisma.io/docs/llms-full.txt',
    category: DocumentationCategory.DATABASE,
  },
  {
    key: 'mintlify',
    name: 'Mintlify',
    description: 'Documentation platform for modern teams',
    llmsFullUrl: 'https://mintlify.com/docs/llms-full.txt',
    category: DocumentationCategory.DOCUMENTATION,
  },
  {
    key: 'perplexity',
    name: 'Perplexity',
    description: 'AI-powered search and answer engine',
    llmsFullUrl: 'https://docs.perplexity.ai/llms-full.txt',
    category: DocumentationCategory.AI,
  },
  {
    key: 'pinecone',
    name: 'Pinecone',
    description: 'Vector database for AI applications',
    llmsFullUrl: 'https://docs.pinecone.io/llms-full.txt',
    category: DocumentationCategory.DATABASE,
  },
  {
    key: 'mindsdb',
    name: 'MindsDB',
    description: 'Open-source AI layer for existing databases',
    llmsFullUrl: 'https://docs.mindsdb.com/llms-full.txt',
    category: DocumentationCategory.AI,
  },
  {
    key: 'cursor',
    name: 'Cursor',
    description: 'AI-powered code editor',
    llmsFullUrl: 'https://docs.cursor.com/llms-full.txt',
    category: DocumentationCategory.DEVELOPMENT,
  },
  {
    key: 'zapier',
    name: 'Zapier',
    description: 'Automation platform for connecting apps',
    llmsFullUrl: 'https://docs.zapier.com/llms-full.txt',
    category: DocumentationCategory.AUTOMATION,
  },
  {
    key: 'datafold',
    name: 'Datafold',
    description: 'Data reliability platform',
    llmsFullUrl: 'https://docs.datafold.com/llms-full.txt',
    category: DocumentationCategory.DATA,
  },
  {
    key: 'ionq',
    name: 'IonQ',
    description: 'Quantum computing platform',
    llmsFullUrl: 'https://docs.ionq.com/llms-full.txt',
    category: DocumentationCategory.QUANTUM,
  },
  {
    key: 'hyperline',
    name: 'Hyperline',
    description: 'Revenue optimization platform',
    llmsFullUrl: 'https://docs.hyperline.co/llms-full.txt',
    category: DocumentationCategory.REVENUE,
  },
  {
    key: 'meteor',
    name: 'Meteor',
    description: 'Full-stack JavaScript platform',
    llmsFullUrl: 'https://docs.meteor.com/llms-full.txt',
    category: DocumentationCategory.FRAMEWORK,
  },
  {
    key: 'pydantic',
    name: 'Pydantic',
    description: 'Data validation library for Python',
    llmsFullUrl: 'https://docs.pydantic.dev/latest/llms-full.txt',
    category: DocumentationCategory.VALIDATION,
  },
  {
    key: 'baseten',
    name: 'Baseten',
    description: 'ML infrastructure platform',
    llmsFullUrl: 'https://docs.baseten.co/llms-full.txt',
    category: DocumentationCategory.INFRASTRUCTURE,
  },
  {
    key: 'unstructured',
    name: 'Unstructured',
    description: 'Platform for processing unstructured data',
    llmsFullUrl: 'https://docs.unstructured.io/llms-full.txt',
    category: DocumentationCategory.DATA,
  },
  {
    key: 'zenml',
    name: 'ZenML',
    description: 'MLOps framework for production ML pipelines',
    llmsFullUrl: 'https://docs.zenml.io/bleeding-edge/reference/llms-txt',
    category: DocumentationCategory.INFRASTRUCTURE,
  },
  {
    key: 'convex',
    name: 'Convex',
    description: 'Backend-as-a-service platform',
    llmsFullUrl: 'https://docs.convex.dev/llms.txt',
    category: DocumentationCategory.FRAMEWORK,
  },
  {
    key: 'expo',
    name: 'Expo',
    description: 'Platform for building React Native apps',
    llmsFullUrl: 'https://docs.expo.dev/llms-full.txt',
    category: DocumentationCategory.FRAMEWORK,
  },
  {
    key: 'astro',
    name: 'Astro',
    description: 'Modern static site generator',
    llmsFullUrl: 'https://docs.astro.build/llms-full.txt',
    category: DocumentationCategory.FRAMEWORK,
  },
  {
    key: 'modal',
    name: 'Modal',
    description:
      'Platform for running Python code in the cloud with minimal configuration',
    llmsFullUrl: 'https://modal.com/llms-full.txt',
    category: DocumentationCategory.INFRASTRUCTURE,
  },
  {
    key: 'fireflies',
    name: 'Fireflies',
    description: 'AI meeting assistant',
    llmsFullUrl: 'https://docs.fireflies.ai/llms-full.txt',
    category: DocumentationCategory.MEETING,
  },
  {
    key: 'knock',
    name: 'Knock',
    description: 'Notification infrastructure',
    llmsFullUrl: 'https://docs.knock.app/llms-full.txt',
    category: DocumentationCategory.NOTIFICATION,
  },
  {
    key: 'fireworks-ai',
    name: 'Fireworks AI',
    description: 'AI inference platform',
    llmsFullUrl: 'https://docs.fireworks.ai/llms-full.txt',
    category: DocumentationCategory.AI,
  },
  {
    key: 'replit',
    name: 'Replit',
    description: 'Online IDE and collaborative coding platform',
    llmsFullUrl: 'https://docs.replit.com/llms-full.txt',
    category: DocumentationCategory.DEVELOPMENT,
  },
  {
    key: 'humanloop',
    name: 'HumanLoop',
    description: 'AI model evaluation and monitoring',
    llmsFullUrl: 'https://humanloop.com/docs/llms-full.txt',
    category: DocumentationCategory.AI,
  },
];

const fuzzySearchProviders = (query?: string): DocumentationProvider[] => {
  if (!query || query.trim() === '') {
    return DOCUMENTATION_PROVIDERS; // Return all providers if no search query
  }

  return simpleSearch(
    DOCUMENTATION_PROVIDERS as unknown as Record<string, unknown>[],
    query,
    {
      fields: ['key', 'name', 'description'],
      caseSensitive: false,
      maxResults: 50,
      threshold: 0.1,
    }
  ) as unknown as DocumentationProvider[];
};

const searchDocumentation = async (
  providerKey: string,
  query: string,
  maxResults = 5,
  context?: ConnectorContext
): Promise<string> => {
  const provider = DOCUMENTATION_PROVIDERS.find((p) => p.key === providerKey);

  if (!provider) {
    return `Provider "${providerKey}" not found. Use get_provider_key to find available providers.`;
  }

  try {
    // Try to get cached documentation first
    let text: string | null = null;
    const cache = context?.cache;
    const cacheKey = `docs:${providerKey}:v2`;

    if (cache) {
      try {
        text = await cache.get(cacheKey);
      } catch (error) {
        console.warn(`KV cache read error for ${providerKey}:`, error);
      }
    }

    // If not cached, fetch from external URL
    if (!text) {
      const res = await fetch(provider.llmsFullUrl);

      if (!res.ok) {
        return `Error fetching documentation for ${provider.name}: ${res.status} ${res.statusText}`;
      }

      text = await res.text();

      // Cache the fetched documentation (24 hour TTL)
      if (cache && text && text.length > 100) {
        try {
          await cache.put(cacheKey, text, { expirationTtl: 86400 });
        } catch (error) {
          console.warn(`KV cache write error for ${providerKey}:`, error);
        }
      }
    }

    const searchTerms = tokenize(query);

    if (searchTerms.length === 0) {
      return 'No valid search terms provided. Please provide a query to search for.';
    }

    const chunks = splitIntoChunks(text);

    const scoredChunks = chunks.map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, searchTerms, chunks),
    }));

    const relevantChunks = scoredChunks
      .filter((item) => item.score !== 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    if (relevantChunks.length === 0) {
      return `No relevant documentation found in ${provider.name} for query: "${query}". Try different or more general search terms.`;
    }

    const results = relevantChunks
      .map(
        (item, idx) =>
          `### Search Result ${idx + 1} (Relevance Score: ${item.score.toFixed(2)})\n\n${item.chunk.trim()}`
      )
      .join(`\n\n${'---'.repeat(20)}\n\n`);

    return `Found ${relevantChunks.length} relevant sections in ${provider.name} documentation for "${query}":\n\n${results}\n\n**Search Quality:** ${getSearchQualityIndicator(relevantChunks)}\n**Best Match Score:** ${relevantChunks[0]?.score.toFixed(2) || '0.00'}\n**Coverage:** ${relevantChunks.length}/${maxResults} possible results`;
  } catch (error) {
    return `Error searching ${provider.name} documentation: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

const getSearchQualityIndicator = (chunks: Array<{ score: number }>): string => {
  const bestScore = Math.abs(chunks[0]?.score || 0);
  const avgScore = Math.abs(
    chunks.reduce((sum, chunk) => sum + chunk.score, 0) / chunks.length
  );

  if (bestScore >= 10 && avgScore >= 5) return 'Excellent - High confidence matches';
  if (bestScore >= 3 && avgScore >= 2) return 'Good - Relevant matches found';
  if (bestScore >= 2 && avgScore >= 1) return 'Fair - Some relevant content';
  if (bestScore >= 1) return 'Low - Weak matches, consider refining search terms';
  return 'Very Low - No strong matches found';
};

const splitIntoChunks = (text: string): string[] => {
  const maxChunkSize = 1000;
  const minChunkSize = 250;
  const overlapSize = 200;

  // First, split by major separators (headers, code blocks, etc.)
  const majorSections = text.split(/\n(?=#{1,6}\s|\n\s*\n|\`\`\`)/);
  const chunks: string[] = [];

  for (const section of majorSections) {
    if (section.trim().length < minChunkSize) {
      // If section is too small, try to combine with previous chunk
      const lastChunk = chunks[chunks.length - 1];
      if (
        chunks.length > 0 &&
        lastChunk &&
        lastChunk.length + section.length <= maxChunkSize
      ) {
        chunks[chunks.length - 1] = `${lastChunk}\n${section}`;
        continue;
      }
    }

    if (section.length <= maxChunkSize) {
      chunks.push(section.trim());
    } else {
      // Split large sections into smaller chunks with overlap
      const words = section.split(/\s+/);
      let currentChunk = '';
      let wordIndex = 0;

      while (wordIndex < words.length) {
        const word = words[wordIndex];

        if (word && currentChunk.length + word.length + 1 <= maxChunkSize) {
          currentChunk += (currentChunk ? ' ' : '') + word;
          wordIndex++;
        } else {
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }

          // Start new chunk with overlap
          const overlapWords = currentChunk
            .split(/\s+/)
            .slice(-Math.floor(overlapSize / 10));
          currentChunk = overlapWords.join(' ');

          // Don't increment wordIndex to retry adding the current word
        }
      }

      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
  }

  // Final filtering and cleanup
  return chunks
    .filter((chunk) => chunk.trim().length >= minChunkSize)
    .map((chunk) => chunk.trim())
    .filter((chunk) => {
      // Filter out chunks that are mostly punctuation or whitespace
      const alphanumericChars = chunk.replace(/[^a-zA-Z0-9]/g, '').length;
      return alphanumericChars > chunk.length * 0.3;
    });
};

// Common English stop words to filter out
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'he',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'was',
  'were',
  'will',
  'with',
  'you',
  'your',
  'this',
  'but',
  'not',
  'have',
  'had',
  'what',
  'when',
  'where',
  'who',
  'which',
  'why',
  'how',
  'all',
  'any',
  'both',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'can',
  'could',
  'may',
  'might',
  'must',
  'shall',
  'should',
  'would',
]);

const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
};

const calculateTermFrequency = (term: string, tokens: string[]): number => {
  return tokens.filter((token) => token === term).length;
};

const calculateBM25Score = (
  queryTerms: string[],
  documentTokens: string[],
  allDocuments: string[][],
  k1 = 1.2,
  b = 0.75
): number => {
  const N = allDocuments.length;
  const dl = documentTokens.length;
  const avgdl = allDocuments.reduce((sum, doc) => sum + doc.length, 0) / N;

  let score = 0;

  for (const term of queryTerms) {
    const tf = calculateTermFrequency(term, documentTokens);

    if (tf === 0) continue;

    // Calculate document frequency (number of documents containing the term)
    const df = allDocuments.filter((doc) => doc.includes(term)).length;

    // Calculate IDF (Inverse Document Frequency)
    // Add small epsilon to prevent IDF from being exactly 0
    const idf = Math.log((N - df + 0.5) / (df + 0.5)) || 0.1;

    // BM25 formula
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (dl / avgdl));

    score += idf * (numerator / denominator);
  }

  return score;
};

const scoreChunk = (
  chunk: string,
  searchTerms: string[],
  allChunks: string[]
): number => {
  const documentTokens = tokenize(chunk);
  const queryTerms = searchTerms.filter((term) => term.length > 2);

  if (queryTerms.length === 0 || documentTokens.length === 0) {
    return 0;
  }

  // Tokenize all chunks for BM25 calculation
  const allDocuments = allChunks.map((c) => tokenize(c));

  return calculateBM25Score(queryTerms, documentTokens, allDocuments);
};

export const DocumentationConnectorConfig = mcpConnectorConfig({
  name: 'Documentation',
  key: 'documentation',
  version: '1.0.0',
  credentials: z.object({}),
  setup: z.object({}),
  examplePrompt:
    'Find documentation for Anthropic Claude API authentication methods, then search for Prisma database schema migration best practices.',
  logo: 'https://stackone-logos.com/api/stackone/filled/svg',
  tools: (tool) => ({
    GET_PROVIDER_KEY: tool({
      name: 'get_provider_key',
      description:
        'ALWAYS call this first to discover available documentation providers. Essential step before searching documentation. Returns provider keys, names, and descriptions for 30+ services including AI platforms (anthropic, openai), databases (pinecone, prisma), frameworks (astro, expo), and developer tools (cursor, zapier). Use the returned provider_key with search_docs.',
      schema: z.object({
        provider_name: z
          .string()
          .describe(
            'Optional provider name to fuzzy match. Examples: "anthropic", "prisma", "cursor". Leave empty to see all providers.'
          )
          .optional(),
      }),
      handler: async (args, _context) => {
        try {
          const providers = fuzzySearchProviders(args.provider_name);

          if (providers.length === 0) {
            return JSON.stringify({
              success: false,
              message: `No providers found matching "${args.provider_name}".`,
            });
          }

          // Token-efficient format: just keys if no search, or key:name pairs if searching
          if (!args.provider_name) {
            // Return all provider keys in a compact format
            const keys = providers.map((p) => p.key);
            return JSON.stringify({
              success: true,
              count: providers.length,
              keys: keys,
            });
          }
          // Return matched providers with minimal info
          const results = providers.map((p) => ({
            key: p.key,
            name: p.name,
          }));
          return JSON.stringify({
            success: true,
            count: results.length,
            providers: results,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },
    }),
    SEARCH_DOCS: tool({
      name: 'search_docs',
      description:
        'Search documentation for a specific provider using a query. MUST use get_provider_key first to get the correct provider_key. Returns relevant documentation sections with confidence scores. Works best with specific technical terms, API names, or feature descriptions.',
      schema: z.object({
        provider_key: z
          .string()
          .describe(
            'Exact provider key from get_provider_key output. Common examples: "anthropic" (Claude API), "ai-sdk" (Vercel AI SDK), "prisma" (database ORM), "cursor" (AI editor), "zapier" (automation), "pinecone" (vector database). Case-sensitive.'
          ),
        query: z
          .string()
          .describe(
            'Search query for documentation. Best results with: API method names (e.g., "createMessage"), feature names (e.g., "function calling"), technical concepts (e.g., "authentication", "rate limits"), or error codes. Avoid generic terms like "how to" or "tutorial".'
          ),
        max_results: z
          .number()
          .min(1)
          .max(10)
          .default(5)
          .describe('Maximum number of results to return (1-10). Default is 5.')
          .optional(),
      }),
      handler: async (args, context) => {
        try {
          const result = await searchDocumentation(
            args.provider_key,
            args.query,
            args.max_results || 5,
            context
          );

          // Check if result indicates an error or no results
          if (result.includes('Provider') && result.includes('not found')) {
            const response = {
              success: false,
              error: `Provider "${args.provider_key}" not found`,
              recovery_actions: [
                'Call get_provider_key to see available providers',
                'Check spelling of provider_key',
                'Use exact key from get_provider_key response',
              ],
              available_providers_hint:
                'Popular keys: anthropic, ai-sdk, prisma, cursor, zapier',
            };
            return JSON.stringify(response, null, 2);
          }

          if (result.includes('No relevant documentation found')) {
            return `No relevant documentation found for "${args.query}" in ${args.provider_key}`;
          }

          return result;
        } catch (error) {
          const response = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            recovery_actions: [
              'Verify provider_key is correct using get_provider_key',
              'Try simpler search query',
              'Check network connectivity',
              'Retry the request',
            ],
          };
          return JSON.stringify(response, null, 2);
        }
      },
    }),
  }),
});
