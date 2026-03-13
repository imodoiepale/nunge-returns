// lib/mcp/tool-registry.ts
// Dynamic tool registration from MCP servers — converts MCP tools to AI function declarations

import { discoverTools, type McpTool } from './client';
import type { FunctionDeclaration, FunctionDeclarationSchema } from '@google/generative-ai';

/**
 * Convert MCP tools to Gemini function declarations for AI function calling
 */
export function toGeminiFunctions(tools?: McpTool[]): FunctionDeclaration[] {
  const mcpTools = tools || discoverTools();
  return mcpTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: (tool.inputSchema || { type: 'object', properties: {} }) as FunctionDeclarationSchema,
  }));
}

/**
 * Convert MCP tools to OpenAI function format
 */
export function toOpenAiFunctions(tools?: McpTool[]): { type: 'function'; function: { name: string; description: string; parameters: any } }[] {
  const mcpTools = tools || discoverTools();
  return mcpTools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema || { type: 'object', properties: {} },
    },
  }));
}

/**
 * Get tools filtered by server name
 */
export function getToolsByServer(serverName: string): McpTool[] {
  return discoverTools().filter(t => t.serverName === serverName);
}

/**
 * Get tools filtered by name pattern
 */
export function getToolsByPattern(pattern: RegExp): McpTool[] {
  return discoverTools().filter(t => pattern.test(t.name));
}
