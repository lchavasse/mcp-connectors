import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createMockContext } from '../__mocks__/connector-context';
import { DocumentationConnectorConfig } from './documentation';

// Test data
const sampleDocContent = `
# API Documentation

## Authentication
Use your API key in the Authorization header.

## Creating Messages
Use the /v1/messages endpoint to create messages.

### Rate Limits
- 1000 requests per minute
- 10000 tokens per minute

## Function Calling
Claude supports function calling for tool use.
`;

const longDocContent = `
# API Documentation

## Authentication
Authentication is required for all API requests. The authentication system validates your credentials and ensures secure access to API endpoints.

### API Key Format
Your API key should be formatted as Bearer sk-ant-api03-your-key-here. This authentication token format is standardized across all endpoints.

### Authentication Examples
Here are examples of proper authentication implementation:
curl -H "Authorization: Bearer sk-ant-api03-your-key" https://api.anthropic.com/v1/messages

## Message Creation
The message creation endpoint allows you to send messages to Claude and receive responses.

### Message Structure
Messages follow a specific structure for successful API interactions:
- role: Specifies whether the message is from user or assistant
- content: Contains the actual message text or structured content

### Rate Limits
Rate limiting ensures fair usage and system stability:
- 1000 requests per minute for standard users
- 10000 tokens per minute for standard users

## Function Calling
Function calling enables Claude to interact with external tools and systems.

### Function Definition
Functions must be defined with comprehensive schemas:
- name: Descriptive function name following naming conventions
- description: Clear explanation of function purpose and usage
- parameters: JSON schema defining expected input structure

## Error Handling
The API provides comprehensive error handling with standard HTTP status codes and detailed error messages.

### Common Errors
- 401: Invalid API key or authentication failure
- 429: Rate limit exceeded, implement retry logic
- 400: Bad request format or invalid parameters
- 500: Internal server error, retry may resolve

## Best Practices
Following best practices ensures optimal performance and security:
- Use HTTPS for all API requests
- Implement proper error handling and retry logic
- Monitor usage to stay within rate limits
- Store API keys securely in environment variables
`;

// MSW server setup
const server = setupServer();

describe('DocumentationConnector', () => {
  let mockContext: ReturnType<typeof createMockContext>;
  let mockCacheGet: ReturnType<typeof mock>;
  let mockCachePut: ReturnType<typeof mock>;

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    server.resetHandlers();
    mockCacheGet = mock(() => Promise.resolve(null));
    mockCachePut = mock(() => Promise.resolve());
    mockContext = createMockContext({
      cache: {
        get: mockCacheGet,
        put: mockCachePut,
      },
    });
  });

  describe('#get_provider_key', () => {
    const getProviderKeyTool = DocumentationConnectorConfig.tools.GET_PROVIDER_KEY;

    if (!getProviderKeyTool) {
      throw new Error('GET_PROVIDER_KEY tool not found in DocumentationConnectorConfig');
    }

    describe('.when no search query provided', () => {
      test('should return all providers', async () => {
        const result = await getProviderKeyTool.handler({}, mockContext);
        const parsedResult = JSON.parse(result);

        expect(parsedResult.success).toBe(true);
        expect(parsedResult.keys).toBeDefined();
        expect(Array.isArray(parsedResult.keys)).toBe(true);
        expect(parsedResult.keys.length).toBeGreaterThan(0);
        expect(parsedResult.keys).toContain('anthropic');
      });
    });

    describe('.when searching for providers', () => {
      test('should return filtered providers', async () => {
        const result = await getProviderKeyTool.handler(
          { provider_name: 'anthropic' },
          mockContext
        );
        const parsedResult = JSON.parse(result);

        expect(parsedResult.success).toBe(true);
        expect(parsedResult.providers).toBeDefined();
        expect(Array.isArray(parsedResult.providers)).toBe(true);

        const anthropicProvider = parsedResult.providers.find(
          (p: { key: string }) => p.key === 'anthropic'
        );
        expect(anthropicProvider).toBeDefined();
        expect(anthropicProvider.name).toBe('Anthropic');
      });
    });
  });

  describe('#search_docs', () => {
    const searchDocsTool = DocumentationConnectorConfig.tools.SEARCH_DOCS;

    if (!searchDocsTool) {
      throw new Error('SEARCH_DOCS tool not found in DocumentationConnectorConfig');
    }

    describe('.when provider exists and documentation is found', () => {
      beforeEach(() => {
        server.use(
          http.get('https://docs.anthropic.com/llms-full.txt', () => {
            return HttpResponse.text(longDocContent);
          })
        );
        mockCacheGet.mockImplementation(() => Promise.resolve(null));
      });

      test('should return search results', async () => {
        const result = await searchDocsTool.handler(
          {
            provider_key: 'anthropic',
            query: 'authentication',
          },
          mockContext
        );

        expect(result).toContain('Found');
        expect(result.toLowerCase()).toContain('authentication');
        expect(result).toMatch(/Search Result \d+/);
        expect(result).toMatch(/Relevance Score:/);
      });

      test('should cache documentation when content is substantial', async () => {
        await searchDocsTool.handler(
          {
            provider_key: 'anthropic',
            query: 'authentication',
          },
          mockContext
        );

        expect(mockCachePut).toHaveBeenCalledWith('docs:anthropic:v2', longDocContent, {
          expirationTtl: 86400,
        });
      });

      test('should not cache small content', async () => {
        const tinyContent = 'Small doc content';
        server.use(
          http.get('https://docs.anthropic.com/llms-full.txt', () => {
            return HttpResponse.text(tinyContent);
          })
        );

        await searchDocsTool.handler(
          {
            provider_key: 'anthropic',
            query: 'content',
          },
          mockContext
        );

        expect(mockCachePut).not.toHaveBeenCalled();
      });

      test('should use cached documentation when available', async () => {
        const cachedContent = `
# Cached Documentation

## Authentication
Cached authentication information for testing.
        `.trim();
        mockCacheGet.mockImplementation(() => Promise.resolve(cachedContent));

        const result = await searchDocsTool.handler(
          {
            provider_key: 'anthropic',
            query: 'authentication',
          },
          mockContext
        );

        expect(result).toContain('authentication');
      });
    });

    describe('.when provider does not exist', () => {
      test('should return error response', async () => {
        const result = await searchDocsTool.handler(
          {
            provider_key: 'nonexistent-provider',
            query: 'test',
          },
          mockContext
        );
        const parsedResult = JSON.parse(result);

        expect(parsedResult.success).toBe(false);
        expect(parsedResult.error).toContain('not found');
        expect(parsedResult.recovery_actions).toBeDefined();
      });
    });

    describe('.when fetch fails', () => {
      beforeEach(() => {
        server.use(
          http.get('https://docs.anthropic.com/llms-full.txt', () => {
            return HttpResponse.text('', { status: 404, statusText: 'Not Found' });
          })
        );
        mockCacheGet.mockImplementation(() => Promise.resolve(null));
      });

      test('should return error message with status code', async () => {
        const result = await searchDocsTool.handler(
          {
            provider_key: 'anthropic',
            query: 'test',
          },
          mockContext
        );

        expect(result).toContain('Error fetching documentation');
        expect(result).toContain('404 Not Found');
      });
    });

    describe('.when no relevant content found', () => {
      beforeEach(() => {
        server.use(
          http.get('https://docs.anthropic.com/llms-full.txt', () => {
            return HttpResponse.text(
              'Unrelated content about something completely different'
            );
          })
        );
        mockCacheGet.mockImplementation(() => Promise.resolve(null));
      });

      test('should return no results message', async () => {
        const result = await searchDocsTool.handler(
          {
            provider_key: 'anthropic',
            query: 'very-specific-nonexistent-term',
          },
          mockContext
        );

        expect(result).toContain('No relevant documentation found');
        expect(result).toContain('very-specific-nonexistent-term');
        expect(result).toContain('anthropic');
      });
    });

    describe('.when invalid search terms provided', () => {
      beforeEach(() => {
        server.use(
          http.get('https://docs.anthropic.com/llms-full.txt', () => {
            return HttpResponse.text(sampleDocContent);
          })
        );
        mockCacheGet.mockImplementation(() => Promise.resolve(null));
      });

      test('should handle empty query string', async () => {
        const result = await searchDocsTool.handler(
          {
            provider_key: 'anthropic',
            query: '',
          },
          mockContext
        );

        expect(result).toContain('No valid search terms provided');
      });

      test('should handle query with only stop words', async () => {
        const result = await searchDocsTool.handler(
          {
            provider_key: 'anthropic',
            query: 'a the is',
          },
          mockContext
        );

        expect(result).toContain('No valid search terms provided');
      });
    });
  });

  describe('Error Handling', () => {
    const searchDocsTool = DocumentationConnectorConfig.tools.SEARCH_DOCS;

    if (!searchDocsTool) {
      throw new Error('SEARCH_DOCS tool not found in DocumentationConnectorConfig');
    }

    test('should handle network errors gracefully', async () => {
      mockCacheGet.mockImplementation(() => Promise.resolve(null));
      server.use(
        http.get('https://docs.anthropic.com/llms-full.txt', () => {
          return HttpResponse.error();
        })
      );

      const result = await searchDocsTool.handler(
        {
          provider_key: 'anthropic',
          query: 'authentication',
        },
        mockContext
      );

      expect(result).toContain('Error searching');
    });

    test('should handle KV cache errors gracefully', async () => {
      mockCacheGet.mockImplementation(() => Promise.reject(new Error('KV error')));
      server.use(
        http.get('https://docs.anthropic.com/llms-full.txt', () => {
          return HttpResponse.text(sampleDocContent);
        })
      );

      const result = await searchDocsTool.handler(
        {
          provider_key: 'anthropic',
          query: 'authentication',
        },
        mockContext
      );

      expect(result).not.toContain('KV error');
    });
  });
});
