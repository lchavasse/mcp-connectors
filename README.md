# @stackone/mcp-connectors

MCP (Model Context Protocol) connectors for various SaaS services including GitHub, Slack, Linear, Notion, and many more.

## Installation

```bash
bun add @stackone/mcp-connectors
# or
npm install @stackone/mcp-connectors
# or
pnpm add @stackone/mcp-connectors
```

## Usage

```typescript
import { GitHubConnectorConfig, SlackConnectorConfig } from '@stackone/mcp-connectors';

// Use the connector configurations with your MCP server
const githubConnector = GitHubConnectorConfig;
const slackConnector = SlackConnectorConfig;
```

## Available Connectors

- **Productivity**: Asana, Linear, Jira, Todoist, Notion
- **Communication**: Slack, LinkedIn
- **Development**: GitHub, Langsmith, Pylon, Supabase
- **Data & Analytics**: Datadog, Tinybird, Turbopuffer, Logfire
- **AI & ML**: Deepseek, Perplexity, Replicate, ElevenLabs, Fal
- **Business**: Deel, HiBob, Xero, Attio
- **Security**: OnePassword
- **Cloud**: AWS, Google Drive
- **Other**: DuckDuckGo, Fireflies, Incident, StackOne

## Development

This package uses Bun and tsdown for building and publishing.

### Setup

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun test

# Lint and format
bun run lint
bun run format

# Type check
bun run typecheck
```

### Publishing

The package is automatically published to npm when changes are merged to the main branch using release-please.

## License

Apache-2.0