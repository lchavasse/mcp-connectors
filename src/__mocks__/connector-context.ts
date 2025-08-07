import { mock } from 'bun:test';
import type { ConnectorContext } from '../config-types';

export const createMockContext = (
  overrides?: Partial<ConnectorContext>
): ConnectorContext => ({
  getCredentials: async () => ({}),
  getSetup: async () => ({}),
  getData: async () => undefined,
  setData: async () => {},
  cache: {
    get: mock(() => Promise.resolve(null)),
    put: mock(() => Promise.resolve()),
  },
  ...overrides,
});
