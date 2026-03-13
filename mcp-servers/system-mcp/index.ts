// mcp-servers/system-mcp/index.ts
// System MCP Server — health checks, metrics, bug reporting, service management

import { registerServer } from '@/lib/mcp/client';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function registerSystemMcp(): void {
  registerServer({
    name: 'system-mcp',
    description: 'System management tools — health checks, metrics, bug reports, service restarts',
    baseUrl: `${BASE_URL}/api/mcp/system`,
    tools: [
      {
        name: 'health_check',
        description: 'Check the health status of all system components (Supabase, KRA portal, Evolution API, AI models)',
        inputSchema: {
          type: 'object',
          properties: {
            component: { type: 'string', description: 'Specific component to check (optional — checks all if omitted)', enum: ['next_app', 'supabase', 'kra_portal', 'evolution_api', 'gemini_api', 'openai_api', 'redis', 'playwright'] },
          },
        },
      },
      {
        name: 'get_metrics',
        description: 'Get system metrics: task completion rates, agent performance, error rates, response times',
        inputSchema: {
          type: 'object',
          properties: {
            period: { type: 'string', description: 'Time period', enum: ['1h', '24h', '7d', '30d'] },
            metric_type: { type: 'string', description: 'Specific metric type', enum: ['tasks', 'agents', 'errors', 'latency', 'all'] },
          },
        },
      },
      {
        name: 'report_bug',
        description: 'Report a system bug — auto-creates a ticket and logs the error',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Bug title' },
            description: { type: 'string', description: 'Detailed bug description' },
            severity: { type: 'string', description: 'Bug severity', enum: ['critical', 'high', 'medium', 'low'] },
            component: { type: 'string', description: 'Affected component' },
            error_log: { type: 'string', description: 'Relevant error log output' },
          },
          required: ['title', 'description'],
        },
      },
      {
        name: 'restart_service',
        description: 'Request a service restart (queued for admin approval for critical services)',
        inputSchema: {
          type: 'object',
          properties: {
            service: { type: 'string', description: 'Service to restart', enum: ['whatsapp_bot', 'task_processor', 'health_monitor', 'sla_monitor'] },
            reason: { type: 'string', description: 'Reason for restart' },
          },
          required: ['service', 'reason'],
        },
      },
    ],
    resources: [
      {
        uri: 'system://components',
        name: 'System Components',
        description: 'List of all system components and their expected status',
        mimeType: 'application/json',
      },
      {
        uri: 'system://health-thresholds',
        name: 'Health Thresholds',
        description: 'Thresholds for healthy/degraded/down classification',
        mimeType: 'application/json',
      },
    ],
  });
}

export const SYSTEM_COMPONENTS = {
  next_app: { name: 'Next.js Application', healthEndpoint: '/api/health', critical: true },
  supabase: { name: 'Supabase Database', healthEndpoint: null, critical: true },
  kra_portal: { name: 'KRA iTax Portal', healthEndpoint: 'https://itax.kra.go.ke/KRA-Portal/', critical: true },
  evolution_api: { name: 'Evolution API (WhatsApp)', healthEndpoint: null, critical: false },
  gemini_api: { name: 'Google Gemini AI', healthEndpoint: null, critical: true },
  openai_api: { name: 'OpenAI GPT (fallback)', healthEndpoint: null, critical: false },
  redis: { name: 'Redis Cache', healthEndpoint: null, critical: false },
  playwright: { name: 'Playwright Browser', healthEndpoint: null, critical: true },
};

export const HEALTH_THRESHOLDS = {
  response_time_ms: { healthy: 1000, degraded: 5000 },
  error_rate_percent: { healthy: 1, degraded: 5 },
  task_queue_depth: { healthy: 50, degraded: 200 },
  memory_usage_percent: { healthy: 70, degraded: 90 },
};
