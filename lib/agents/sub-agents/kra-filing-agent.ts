// lib/agents/sub-agents/kra-filing-agent.ts
// Handles nil return filing for individuals and companies

import { getTask, startTask, completeTask, failTask, type Task } from '../task-manager';
import { heartbeat, recordExecution } from '../agent-registry';

const AGENT_TYPE = 'kra-filing' as const;

export interface FilingResult {
  success: boolean;
  receiptUrl?: string;
  receiptNumber?: string;
  error?: string;
  periodFrom?: string;
  periodTo?: string;
}

export interface BatchFilingResult {
  success: boolean;
  total: number;
  completed: number;
  failed: number;
  results: { obligation_id: string; obligation_name: string; status: string; receipt_url: string | null; error: string | null }[];
}

/**
 * Execute a filing task
 */
export async function execute(task: Task): Promise<void> {
  heartbeat(AGENT_TYPE);
  await startTask(task.id);

  try {
    if (task.taskType === 'file_nil_return') {
      const result = await fileIndividualReturn(task.inputData);
      await completeTask(task.id, result);
      recordExecution(AGENT_TYPE, result.success);
    } else if (task.taskType === 'batch_file') {
      const result = await fileBatchReturns(task.inputData);
      await completeTask(task.id, result);
      recordExecution(AGENT_TYPE, result.success);
    } else if (task.taskType === 'check_filing_status') {
      const result = await checkFilingStatus(task.inputData);
      await completeTask(task.id, result);
      recordExecution(AGENT_TYPE, true);
    } else {
      throw new Error(`Unknown task type: ${task.taskType}`);
    }
  } catch (error: any) {
    recordExecution(AGENT_TYPE, false);
    await failTask(task.id, error.message);
  }
}

async function fileIndividualReturn(input: Record<string, any>): Promise<FilingResult> {
  const { pin, password, name, email, resident_type, session_id } = input;

  if (!pin || !password) {
    return { success: false, error: 'PIN and password are required' };
  }

  try {
    const response = await fetch(`${getBaseUrl()}/api/individual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kra_pin: pin,
        kra_password: password,
        name: name || 'Unknown',
        email: email || '',
        resident_type: resident_type || '1',
        session_id,
      }),
    });

    const data = await response.json();

    if (data.requiresPayment) {
      return {
        success: false,
        error: data.message || 'Employment income detected — cannot file nil return',
        periodFrom: data.periodFrom,
        periodTo: data.periodTo,
      };
    }

    if (data.success) {
      return {
        success: true,
        receiptUrl: data.receipt_url,
        receiptNumber: data.receipt_number || `ACK-${Date.now()}`,
      };
    }

    return { success: false, error: data.error || data.message || 'Filing failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function fileBatchReturns(input: Record<string, any>): Promise<BatchFilingResult> {
  const { pin, password, company_name, obligation_ids, session_id } = input;

  if (!pin || !password || !obligation_ids?.length) {
    return { success: false, total: 0, completed: 0, failed: 0, results: [] };
  }

  try {
    const response = await fetch(`${getBaseUrl()}/api/company/batch-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: company_name || 'Unknown',
        kra_pin: pin,
        kra_password: password,
        obligation_ids,
        session_id,
      }),
    });

    const data = await response.json();
    return {
      success: data.success,
      total: data.total || obligation_ids.length,
      completed: data.completed || 0,
      failed: data.failed || 0,
      results: data.results || [],
    };
  } catch (error: any) {
    return { success: false, total: obligation_ids.length, completed: 0, failed: obligation_ids.length, results: [] };
  }
}

async function checkFilingStatus(input: Record<string, any>): Promise<Record<string, any>> {
  const { pin, session_id } = input;
  // Query Supabase for recent filings
  return { pin, status: 'check_not_implemented_yet', session_id };
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
