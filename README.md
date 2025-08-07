# @stackone/mcp-connectors

MCP Connectors for disco.dev.

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
import {
  GitHubConnectorConfig,
  SlackConnectorConfig,
} from "@stackone/mcp-connectors";
```

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
