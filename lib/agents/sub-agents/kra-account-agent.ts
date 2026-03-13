// lib/agents/sub-agents/kra-account-agent.ts
// Password reset, email change, obligation termination, password validation

import { startTask, completeTask, failTask, type Task } from '../task-manager';
import { heartbeat, recordExecution } from '../agent-registry';

const AGENT_TYPE = 'kra-account' as const;

export async function execute(task: Task): Promise<void> {
  heartbeat(AGENT_TYPE);
  await startTask(task.id);

  try {
    let result: Record<string, any>;

    switch (task.taskType) {
      case 'reset_password':
        result = await resetPassword(task.inputData);
        break;
      case 'change_email':
        result = await changeEmail(task.inputData);
        break;
      case 'terminate_obligation':
        result = await terminateObligation(task.inputData);
        break;
      case 'validate_password':
        result = await validatePassword(task.inputData);
        break;
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }

    await completeTask(task.id, result);
    recordExecution(AGENT_TYPE, true);
  } catch (error: any) {
    recordExecution(AGENT_TYPE, false);
    await failTask(task.id, error.message);
  }
}

async function resetPassword(input: Record<string, any>): Promise<Record<string, any>> {
  const { pin } = input;
  if (!pin) return { success: false, error: 'PIN is required' };

  try {
    const response = await fetch(`${getBaseUrl()}/api/reset/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await response.json();
    return {
      success: data.success,
      message: data.success
        ? 'Password reset link sent to your registered email address'
        : (data.message || 'Password reset failed'),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function changeEmail(input: Record<string, any>): Promise<Record<string, any>> {
  const { pin } = input;
  return {
    success: false,
    message: 'Email change requires visiting a KRA office with your ID and KRA PIN certificate. This cannot be done online.',
    instructions: [
      '1. Visit the nearest KRA office',
      '2. Bring your original national ID',
      '3. Bring your KRA PIN certificate',
      '4. Fill out the amendment form',
      '5. New email will be updated within 48 hours',
    ],
  };
}

async function terminateObligation(input: Record<string, any>): Promise<Record<string, any>> {
  const { pin, password, company_name, obligation_ids, reason, session_id } = input;

  if (!pin || !password) return { success: false, error: 'PIN and password are required' };
  if (!obligation_ids?.length) return { success: false, error: 'At least one obligation must be selected' };
  if (!reason) return { success: false, error: 'Termination reason is required' };

  try {
    const response = await fetch(`${getBaseUrl()}/api/company/terminate-obligation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: company_name || 'Unknown',
        kra_pin: pin,
        kra_password: password,
        obligation_ids,
        reason,
        session_id,
      }),
    });
    const data = await response.json();
    return {
      success: data.success,
      submitted: data.submitted || 0,
      failed: data.failed || 0,
      results: data.results || [],
      message: data.success
        ? `${data.submitted} obligation(s) submitted for termination`
        : (data.error || 'Termination request failed'),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function validatePassword(input: Record<string, any>): Promise<Record<string, any>> {
  const { pin, password, company_name } = input;
  if (!pin || !password) return { valid: false, error: 'PIN and password are required' };

  try {
    const response = await fetch(`${getBaseUrl()}/api/auth/validate-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, password, company_name: company_name || '' }),
    });
    const data = await response.json();
    return { valid: data.success, message: data.message, status: data.status };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
