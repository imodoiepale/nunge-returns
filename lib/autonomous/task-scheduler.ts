// lib/autonomous/task-scheduler.ts
// Cron-like scheduler for recurring tasks: health checks, deadline reminders, reports

import { processAllQueues } from '../agents';
import { supabase } from '@/lib/supabaseClient';
import { checkAllComponents } from './auto-healer';
import { checkSlaCompliance } from './sla-monitor';
import { scanForBugs } from './bug-detector';

export interface ScheduledJob {
  id: string;
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
  lastRun: number;
  running: boolean;
  enabled: boolean;
}

const jobs: Map<string, ScheduledJob> = new Map();
let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Register a scheduled job
 */
export function registerJob(id: string, name: string, intervalMs: number, handler: () => Promise<void>): void {
  jobs.set(id, { id, name, intervalMs, handler, lastRun: 0, running: false, enabled: true });
}

/**
 * Start the scheduler loop
 */
export function startScheduler(tickIntervalMs: number = 10000): void {
  if (schedulerInterval) return;

  // Register default jobs
  registerDefaultJobs();

  schedulerInterval = setInterval(async () => {
    const now = Date.now();
    for (const job of jobs.values()) {
      if (!job.enabled || job.running) continue;
      if (now - job.lastRun < job.intervalMs) continue;

      job.running = true;
      job.lastRun = now;

      try {
        await job.handler();
      } catch (error: any) {
        console.error(`[SCHEDULER] Job ${job.name} failed:`, error.message);
      } finally {
        job.running = false;
      }
    }
  }, tickIntervalMs);

  console.log('[SCHEDULER] Started with', jobs.size, 'jobs');
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

/**
 * Enable/disable a job
 */
export function setJobEnabled(jobId: string, enabled: boolean): void {
  const job = jobs.get(jobId);
  if (job) job.enabled = enabled;
}

/**
 * Get status of all jobs
 */
export function getJobStatuses(): { id: string; name: string; enabled: boolean; running: boolean; lastRun: string; intervalMs: number }[] {
  return Array.from(jobs.values()).map(j => ({
    id: j.id,
    name: j.name,
    enabled: j.enabled,
    running: j.running,
    lastRun: j.lastRun ? new Date(j.lastRun).toISOString() : 'never',
    intervalMs: j.intervalMs,
  }));
}

/**
 * Manually trigger a job
 */
export async function triggerJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);
  if (job.running) throw new Error(`Job already running: ${jobId}`);

  job.running = true;
  try {
    await job.handler();
    job.lastRun = Date.now();
  } finally {
    job.running = false;
  }
}

function registerDefaultJobs(): void {
  // Process agent task queues every 30 seconds
  registerJob('process-queues', 'Process Agent Task Queues', 30 * 1000, async () => {
    const result = await processAllQueues();
    if (result.processed > 0 || result.errors > 0) {
      console.log(`[SCHEDULER] Queue processing: ${result.processed} processed, ${result.errors} errors`);
    }
  });

  // Health check every 5 minutes
  registerJob('health-check', 'System Health Check', 5 * 60 * 1000, async () => {
    await checkAllComponents();
  });

  // SLA monitoring every 2 minutes
  registerJob('sla-monitor', 'SLA Compliance Monitor', 2 * 60 * 1000, async () => {
    await checkSlaCompliance();
  });

  // Bug detection every 10 minutes
  registerJob('bug-detector', 'Automated Bug Detection', 10 * 60 * 1000, async () => {
    await scanForBugs();
  });

  // Daily report at midnight (check every hour)
  registerJob('daily-report', 'Daily Summary Report', 60 * 60 * 1000, async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 10) {
      await generateDailyReport();
    }
  });

  // Filing deadline reminders (check daily)
  registerJob('deadline-reminders', 'Tax Filing Deadline Reminders', 24 * 60 * 60 * 1000, async () => {
    await checkDeadlineReminders();
  });
}

async function generateDailyReport(): Promise<void> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [tasksResult, ticketsResult, securityResult] = await Promise.all([
    supabase.from('ai_tasks').select('status').gte('created_at', yesterday),
    supabase.from('tickets').select('status').gte('created_at', yesterday),
    supabase.from('security_events').select('event_type, severity').gte('created_at', yesterday),
  ]);

  const tasks = tasksResult.data || [];
  const tickets = ticketsResult.data || [];
  const events = securityResult.data || [];

  console.log(`[DAILY REPORT] Tasks: ${tasks.length} (completed: ${tasks.filter(t => t.status === 'completed').length})`);
  console.log(`[DAILY REPORT] Tickets: ${tickets.length} (resolved: ${tickets.filter(t => t.status === 'resolved').length})`);
  console.log(`[DAILY REPORT] Security events: ${events.length} (critical: ${events.filter(e => e.severity === 'critical').length})`);
}

async function checkDeadlineReminders(): Promise<void> {
  // June 30 is the annual tax filing deadline in Kenya
  const now = new Date();
  const deadlineMonth = 5; // June (0-indexed)
  const deadlineDay = 30;
  const daysUntilDeadline = Math.ceil(
    (new Date(now.getFullYear(), deadlineMonth, deadlineDay).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDeadline === 30 || daysUntilDeadline === 14 || daysUntilDeadline === 7 || daysUntilDeadline === 3 || daysUntilDeadline === 1) {
    console.log(`[SCHEDULER] Tax filing deadline reminder: ${daysUntilDeadline} day(s) until June 30 deadline`);
    // In production, send WhatsApp reminders to users who haven't filed
  }
}
