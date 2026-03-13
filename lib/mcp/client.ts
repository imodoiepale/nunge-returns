// lib/mcp/client.ts
// MCP client — connects agents to MCP servers, discovers tools

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  serverName: string;
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverName: string;
}

export interface McpServer {
  name: string;
  description: string;
  baseUrl: string;
  apiKey?: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: McpTool[];
  resources: McpResource[];
  lastHealthCheck: number;
}

const servers: Map<string, McpServer> = new Map();

/**
 * Register an MCP server
 */
export function registerServer(config: {
  name: string;
  description: string;
  baseUrl: string;
  apiKey?: string;
  tools: Omit<McpTool, 'serverName'>[];
  resources?: Omit<McpResource, 'serverName'>[];
}): void {
  servers.set(config.name, {
    name: config.name,
    description: config.description,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    status: 'connected',
    tools: config.tools.map(t => ({ ...t, serverName: config.name })),
    resources: (config.resources || []).map(r => ({ ...r, serverName: config.name })),
    lastHealthCheck: Date.now(),
  });
}

/**
 * Discover all available tools across all servers
 */
export function discoverTools(): McpTool[] {
  const allTools: McpTool[] = [];
  for (const server of servers.values()) {
    if (server.status !== 'disconnected') {
      allTools.push(...server.tools);
    }
  }
  return allTools;
}

/**
 * Find a tool by name
 */
export function findTool(toolName: string): McpTool | undefined {
  for (const server of servers.values()) {
    const tool = server.tools.find(t => t.name === toolName);
    if (tool) return tool;
  }
  return undefined;
}

/**
 * Execute a tool on its MCP server
 */
export async function executeTool(toolName: string, args: Record<string, any>): Promise<any> {
  const tool = findTool(toolName);
  if (!tool) throw new Error(`Tool not found: ${toolName}`);

  const server = servers.get(tool.serverName);
  if (!server) throw new Error(`Server not found: ${tool.serverName}`);

  const startTime = Date.now();

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (server.apiKey) headers['Authorization'] = `Bearer ${server.apiKey}`;

    const response = await fetch(`${server.baseUrl}/tools/${toolName}/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ arguments: args }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`MCP tool execution failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const executionTimeMs = Date.now() - startTime;

    // Log execution (non-blocking)
    logExecution(tool, args, result, executionTimeMs, 'success').catch(() => {});

    return result;
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    logExecution(tool, args, null, executionTimeMs, 'error', error.message).catch(() => {});
    throw error;
  }
}

/**
 * Get a resource from an MCP server
 */
export async function getResource(uri: string): Promise<any> {
  for (const server of servers.values()) {
    const resource = server.resources.find(r => r.uri === uri);
    if (resource) {
      const headers: Record<string, string> = {};
      if (server.apiKey) headers['Authorization'] = `Bearer ${server.apiKey}`;

      const response = await fetch(`${server.baseUrl}/resources/${encodeURIComponent(uri)}`, { headers });
      if (!response.ok) throw new Error(`Resource fetch failed: ${response.status}`);
      return response.json();
    }
  }
  throw new Error(`Resource not found: ${uri}`);
}

/**
 * Get all registered servers with status
 */
export function getServers(): McpServer[] {
  return Array.from(servers.values());
}

/**
 * Health check a specific server
 */
export async function healthCheckServer(serverName: string): Promise<{ healthy: boolean; latencyMs: number }> {
  const server = servers.get(serverName);
  if (!server) return { healthy: false, latencyMs: 0 };

  const start = Date.now();
  try {
    const response = await fetch(`${server.baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    const healthy = response.ok;
    server.status = healthy ? 'connected' : 'error';
    server.lastHealthCheck = Date.now();
    return { healthy, latencyMs };
  } catch {
    server.status = 'disconnected';
    return { healthy: false, latencyMs: Date.now() - start };
  }
}

async function logExecution(
  tool: McpTool, inputParams: any, outputResult: any,
  executionTimeMs: number, status: string, errorMessage?: string
): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { v4: uuidv4 } = await import('uuid');
    await supabase.from('mcp_tool_executions').insert({
      id: uuidv4(),
      server_name: tool.serverName,
      tool_name: tool.name,
      input_params: inputParams,
      output_result: outputResult || {},
      status,
      execution_time_ms: executionTimeMs,
      error_message: errorMessage || null,
    });
  } catch { }
}
