// lib/autonomous/auto-healer.ts
// Monitor system components, auto-retry failed tasks, alert on unrecoverable issues

import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface ComponentCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  responseTimeMs: number;
  errorMessage?: string;
}

const COMPONENTS: { name: string; checker: () => Promise<ComponentCheck> }[] = [
  { name: 'supabase', checker: checkSupabase },
  { name: 'kra_portal', checker: checkKraPortal },
  { name: 'evolution_api', checker: checkEvolutionApi },
  { name: 'gemini_api', checker: checkGeminiApi },
];

/**
 * Check all system components and log results
 */
export async function checkAllComponents(): Promise<ComponentCheck[]> {
  const results: ComponentCheck[] = [];

  for (const { name, checker } of COMPONENTS) {
    try {
      const result = await checker();
      results.push(result);
    } catch (error: any) {
      results.push({ component: name, status: 'down', responseTimeMs: 0, errorMessage: error.message });
    }
  }

  // Persist to system_health_logs
  for (const result of results) {
    try {
      await supabase.from('system_health_logs').insert({
        id: uuidv4(),
        component: result.component,
        status: result.status,
        response_time_ms: result.responseTimeMs,
        error_message: result.errorMessage || null,
      });
    } catch { }
  }

  // Auto-heal: retry stuck tasks
  await retryStuckTasks();

  // Alert on critical failures
  const downComponents = results.filter(r => r.status === 'down');
  if (downComponents.length > 0) {
    console.error(`[AUTO-HEALER] ${downComponents.length} component(s) DOWN:`, downComponents.map(c => c.component).join(', '));
  }

  return results;
}

async function checkSupabase(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    const { error } = await supabase.from('sessions').select('count').limit(1);
    const responseTimeMs = Date.now() - start;
    return {
      component: 'supabase',
      status: error ? 'degraded' : 'healthy',
      responseTimeMs,
      errorMessage: error?.message,
    };
  } catch (e: any) {
    return { component: 'supabase', status: 'down', responseTimeMs: Date.now() - start, errorMessage: e.message };
  }
}

async function checkKraPortal(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    const response = await fetch('https://itax.kra.go.ke/KRA-Portal/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });
    const responseTimeMs = Date.now() - start;
    return {
      component: 'kra_portal',
      status: response.ok ? 'healthy' : 'degraded',
      responseTimeMs,
    };
  } catch (e: any) {
    return { component: 'kra_portal', status: 'down', responseTimeMs: Date.now() - start, errorMessage: e.message };
  }
}

async function checkEvolutionApi(): Promise<ComponentCheck> {
  const url = process.env.EVOLUTION_API_URL;
  if (!url) return { component: 'evolution_api', status: 'unknown', responseTimeMs: 0, errorMessage: 'EVOLUTION_API_URL not configured' };

  const start = Date.now();
  try {
    const response = await fetch(`${url}/instance/fetchInstances`, {
      headers: { 'apikey': process.env.EVOLUTION_API_KEY || '' },
      signal: AbortSignal.timeout(5000),
    });
    const responseTimeMs = Date.now() - start;
    return {
      component: 'evolution_api',
      status: response.ok ? 'healthy' : 'degraded',
      responseTimeMs,
    };
  } catch (e: any) {
    return { component: 'evolution_api', status: 'down', responseTimeMs: Date.now() - start, errorMessage: e.message };
  }
}

async function checkGeminiApi(): Promise<ComponentCheck> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { component: 'gemini_api', status: 'unknown', responseTimeMs: 0, errorMessage: 'GEMINI_API_KEY not configured' };

  const start = Date.now();
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
      signal: AbortSignal.timeout(5000),
    });
    const responseTimeMs = Date.now() - start;
    return {
      component: 'gemini_api',
      status: response.ok ? 'healthy' : 'degraded',
      responseTimeMs,
    };
  } catch (e: any) {
    return { component: 'gemini_api', status: 'down', responseTimeMs: Date.now() - start, errorMessage: e.message };
  }
}

/**
 * Retry tasks stuck in 'in_progress' for more than 15 minutes
 */
async function retryStuckTasks(): Promise<number> {
  const stuckThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: stuckTasks } = await supabase
    .from('ai_tasks')
    .select('id, agent_type, task_type, retry_count, max_retries')
    .eq('status', 'in_progress')
    .lt('started_at', stuckThreshold)
    .limit(20);

  if (!stuckTasks || stuckTasks.length === 0) return 0;

  let retried = 0;
  for (const task of stuckTasks) {
    if (task.retry_count < task.max_retries) {
      await supabase.from('ai_tasks').update({
        status: 'queued',
        retry_count: task.retry_count + 1,
        error_message: 'Auto-healer: task was stuck in_progress',
      }).eq('id', task.id);
      retried++;
    } else {
      await supabase.from('ai_tasks').update({
        status: 'dead_letter',
        error_message: 'Auto-healer: task stuck and max retries exceeded',
        completed_at: new Date().toISOString(),
      }).eq('id', task.id);
    }
  }

  if (retried > 0) {
    console.log(`[AUTO-HEALER] Retried ${retried} stuck tasks`);
  }
  return retried;
}

/**
 * Get the latest health status for all components
 */
export async function getLatestHealth(): Promise<ComponentCheck[]> {
  const components = ['supabase', 'kra_portal', 'evolution_api', 'gemini_api'];
  const results: ComponentCheck[] = [];

  for (const component of components) {
    const { data: row } = await supabase
      .from('system_health_logs')
      .select('*')
      .eq('component', component)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single();

    if (row) {
      results.push({
        component: row.component,
        status: row.status,
        responseTimeMs: row.response_time_ms,
        errorMessage: row.error_message,
      });
    }
  }

  return results;
}
