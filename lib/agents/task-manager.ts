// lib/agents/task-manager.ts
// Priority queue task manager with persistence in Supabase

import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'queued' | 'assigned' | 'in_progress' | 'waiting' | 'completed' | 'failed' | 'dead_letter';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type AgentType = 'orchestrator' | 'kra-filing' | 'kra-pin' | 'kra-account' | 'payment' | 'ticketing' | 'security' | 'devops' | 'nssf' | 'shif';

export interface Task {
  id: string;
  conversationId?: string;
  parentTaskId?: string;
  agentType: AgentType;
  taskType: string;
  priority: TaskPriority;
  status: TaskStatus;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  dependencies: string[];
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
  createdAt: string;
}

const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Create a new task
 */
export async function createTask(params: {
  agentType: AgentType;
  taskType: string;
  inputData: Record<string, any>;
  priority?: TaskPriority;
  conversationId?: string;
  parentTaskId?: string;
  dependencies?: string[];
  maxRetries?: number;
  deadline?: string;
}): Promise<Task> {
  const id = uuidv4();
  const task: Task = {
    id,
    conversationId: params.conversationId,
    parentTaskId: params.parentTaskId,
    agentType: params.agentType,
    taskType: params.taskType,
    priority: params.priority || 'medium',
    status: 'queued',
    inputData: params.inputData,
    outputData: {},
    retryCount: 0,
    maxRetries: params.maxRetries ?? 3,
    dependencies: params.dependencies || [],
    deadline: params.deadline,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from('ai_tasks').insert({
    id: task.id,
    conversation_id: task.conversationId || null,
    parent_task_id: task.parentTaskId || null,
    agent_type: task.agentType,
    task_type: task.taskType,
    priority: task.priority,
    status: task.status,
    input_data: task.inputData,
    output_data: {},
    retry_count: 0,
    max_retries: task.maxRetries,
    dependencies: task.dependencies,
    deadline: task.deadline || null,
  });

  if (error) throw new Error(`Failed to create task: ${error.message}`);

  await logTaskEvent(id, 'info', `Task created: ${task.taskType} for ${task.agentType}`);
  return task;
}

/**
 * Get the next task to process for a given agent type
 * Respects priority ordering and dependency resolution
 */
export async function getNextTask(agentType: AgentType): Promise<Task | null> {
  // Get queued tasks for this agent, ordered by priority then creation time
  const { data, error } = await supabase
    .from('ai_tasks')
    .select('*')
    .eq('agent_type', agentType)
    .eq('status', 'queued')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(10);

  if (error || !data || data.length === 0) return null;

  // Find first task with all dependencies met
  for (const row of data) {
    if (row.dependencies && row.dependencies.length > 0) {
      const { data: deps } = await supabase
        .from('ai_tasks')
        .select('id, status')
        .in('id', row.dependencies);

      const allComplete = deps?.every(d => d.status === 'completed');
      const anyFailed = deps?.some(d => d.status === 'failed' || d.status === 'dead_letter');

      if (anyFailed) {
        await updateTaskStatus(row.id, 'failed', 'Dependency task failed');
        continue;
      }
      if (!allComplete) continue;
    }

    return mapRowToTask(row);
  }

  return null;
}

/**
 * Assign a task (mark as assigned)
 */
export async function assignTask(taskId: string): Promise<void> {
  await supabase.from('ai_tasks').update({
    status: 'assigned',
    assigned_at: new Date().toISOString(),
  }).eq('id', taskId);
  await logTaskEvent(taskId, 'info', 'Task assigned');
}

/**
 * Start processing a task
 */
export async function startTask(taskId: string): Promise<void> {
  await supabase.from('ai_tasks').update({
    status: 'in_progress',
    started_at: new Date().toISOString(),
  }).eq('id', taskId);
  await logTaskEvent(taskId, 'info', 'Task started');
}

/**
 * Complete a task with output data
 */
export async function completeTask(taskId: string, outputData: Record<string, any>): Promise<void> {
  await supabase.from('ai_tasks').update({
    status: 'completed',
    output_data: outputData,
    completed_at: new Date().toISOString(),
  }).eq('id', taskId);
  await logTaskEvent(taskId, 'info', 'Task completed');
}

/**
 * Fail a task, with retry logic
 */
export async function failTask(taskId: string, errorMessage: string): Promise<{ retrying: boolean }> {
  const { data } = await supabase.from('ai_tasks').select('retry_count, max_retries').eq('id', taskId).single();

  if (!data) return { retrying: false };

  const newRetryCount = (data.retry_count || 0) + 1;

  if (newRetryCount <= data.max_retries) {
    // Retry: put back in queue
    await supabase.from('ai_tasks').update({
      status: 'queued',
      retry_count: newRetryCount,
      error_message: errorMessage,
    }).eq('id', taskId);
    await logTaskEvent(taskId, 'warn', `Task failed, retrying (${newRetryCount}/${data.max_retries}): ${errorMessage}`);
    return { retrying: true };
  } else {
    // Dead letter
    await supabase.from('ai_tasks').update({
      status: 'dead_letter',
      retry_count: newRetryCount,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId);
    await logTaskEvent(taskId, 'error', `Task dead-lettered after ${newRetryCount} attempts: ${errorMessage}`);
    return { retrying: false };
  }
}

/**
 * Update task status directly
 */
export async function updateTaskStatus(taskId: string, status: TaskStatus, errorMessage?: string): Promise<void> {
  const update: any = { status };
  if (errorMessage) update.error_message = errorMessage;
  if (status === 'completed' || status === 'failed' || status === 'dead_letter') {
    update.completed_at = new Date().toISOString();
  }
  await supabase.from('ai_tasks').update(update).eq('id', taskId);
}

/**
 * Get task by ID
 */
export async function getTask(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase.from('ai_tasks').select('*').eq('id', taskId).single();
  if (error || !data) return null;
  return mapRowToTask(data);
}

/**
 * Get all tasks for a conversation
 */
export async function getTasksByConversation(conversationId: string): Promise<Task[]> {
  const { data } = await supabase
    .from('ai_tasks')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return (data || []).map(mapRowToTask);
}

/**
 * Get active task counts by agent type
 */
export async function getQueueStats(): Promise<Record<AgentType, { queued: number; in_progress: number; failed: number }>> {
  const { data } = await supabase
    .from('ai_tasks')
    .select('agent_type, status')
    .in('status', ['queued', 'assigned', 'in_progress']);

  const stats: Record<string, any> = {};
  for (const row of (data || [])) {
    if (!stats[row.agent_type]) stats[row.agent_type] = { queued: 0, in_progress: 0, failed: 0 };
    if (row.status === 'queued' || row.status === 'assigned') stats[row.agent_type].queued++;
    else if (row.status === 'in_progress') stats[row.agent_type].in_progress++;
  }
  return stats as any;
}

/**
 * Log a task event
 */
async function logTaskEvent(taskId: string, level: string, message: string, metadata?: Record<string, any>): Promise<void> {
  try {
    await supabase.from('ai_task_logs').insert({
      id: uuidv4(),
      task_id: taskId,
      log_level: level,
      message,
      metadata: metadata || {},
    });
  } catch { }
}

function mapRowToTask(row: any): Task {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    parentTaskId: row.parent_task_id,
    agentType: row.agent_type,
    taskType: row.task_type,
    priority: row.priority,
    status: row.status,
    inputData: row.input_data || {},
    outputData: row.output_data || {},
    errorMessage: row.error_message,
    retryCount: row.retry_count || 0,
    maxRetries: row.max_retries || 3,
    dependencies: row.dependencies || [],
    assignedAt: row.assigned_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    deadline: row.deadline,
    createdAt: row.created_at,
  };
}
