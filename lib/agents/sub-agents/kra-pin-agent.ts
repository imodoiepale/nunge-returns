// lib/agents/sub-agents/kra-pin-agent.ts
// PIN validation, taxpayer details retrieval, obligation checking

import { startTask, completeTask, failTask, type Task } from '../task-manager';
import { heartbeat, recordExecution } from '../agent-registry';

const AGENT_TYPE = 'kra-pin' as const;

export async function execute(task: Task): Promise<void> {
  heartbeat(AGENT_TYPE);
  await startTask(task.id);

  try {
    let result: Record<string, any>;

    switch (task.taskType) {
      case 'validate_pin':
        result = await validatePin(task.inputData);
        break;
      case 'get_taxpayer_details':
        result = await getTaxpayerDetails(task.inputData);
        break;
      case 'check_obligations':
        result = await checkObligations(task.inputData);
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

async function validatePin(input: Record<string, any>): Promise<Record<string, any>> {
  const { pin } = input;
  if (!pin) return { valid: false, error: 'PIN is required' };

  try {
    const response = await fetch(`${getBaseUrl()}/api/kra/validate-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await response.json();
    return {
      valid: data.success,
      taxpayerName: data.manufacturerDetails?.basic?.fullName || null,
      email: data.manufacturerDetails?.contact?.mainEmail || null,
      phone: data.manufacturerDetails?.contact?.mobileNumber || null,
      pinType: pin.startsWith('A') ? 'individual' : 'company',
      error: data.success ? null : (data.error || 'Validation failed'),
    };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

async function getTaxpayerDetails(input: Record<string, any>): Promise<Record<string, any>> {
  const { pin, id_number } = input;

  if (id_number) {
    try {
      const response = await fetch(`${getBaseUrl()}/api/kra/fetch-by-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  if (pin) {
    return validatePin({ pin });
  }

  return { success: false, error: 'PIN or ID number required' };
}

async function checkObligations(input: Record<string, any>): Promise<Record<string, any>> {
  const { pin } = input;
  if (!pin) return { success: false, error: 'PIN is required' };

  try {
    const response = await fetch(`${getBaseUrl()}/api/company/check-obligations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await response.json();
    return {
      success: data.success,
      obligations: data.obligations || [],
      taxpayerName: data.taxpayerName || null,
      pinStatus: data.pinStatus || null,
      error: data.success ? null : (data.error || 'Failed to fetch obligations'),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
