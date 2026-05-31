export const PLANS = {
  free: {
    storage_mb: 50,
    max_members: 1,
    max_workspaces: 1,
    max_tools: 1,
    max_messages: 50,
    allowed_models: ['gpt-4o-mini'],
  },
  starter: {
    storage_mb: 5000,
    max_members: 10,
    max_workspaces: 3,
    max_tools: 5,
    max_messages: 1000,
    allowed_models: ['gpt-4o-mini', 'gpt-4o'],
  },
  pro: {
    storage_mb: 50000,
    max_members: null,      // null = onbeperkt
    max_workspaces: null,
    max_tools: null,
    max_messages: 10000,
    allowed_models: ['gpt-4o-mini', 'gpt-4o', 'gpt-5'],
  },
}