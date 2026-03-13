// lib/mcp/index.ts
// Central MCP initialization — registers all MCP servers and exports utilities

import { registerKraMcp } from '@/mcp-servers/kra-mcp';
import { registerPaymentMcp } from '@/mcp-servers/payment-mcp';
import { registerTicketingMcp } from '@/mcp-servers/ticketing-mcp';
import { registerSystemMcp } from '@/mcp-servers/system-mcp';

export { discoverTools, findTool, executeTool, getResource, getServers, healthCheckServer } from './client';
export { toGeminiFunctions, toOpenAiFunctions, getToolsByServer, getToolsByPattern } from './tool-registry';

let initialized = false;

/**
 * Initialize all MCP servers
 */
export function initializeMcp(): void {
  if (initialized) return;

  registerKraMcp();
  registerPaymentMcp();
  registerTicketingMcp();
  registerSystemMcp();

  initialized = true;
  console.log('[MCP] All MCP servers registered');
}
