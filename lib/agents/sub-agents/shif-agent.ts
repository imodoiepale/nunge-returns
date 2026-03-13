// lib/agents/sub-agents/shif-agent.ts
// SHIF (Social Health Insurance Fund) registration assistance

import { startTask, completeTask, failTask, type Task } from '../task-manager';
import { heartbeat, recordExecution } from '../agent-registry';

const AGENT_TYPE = 'shif' as const;

export async function execute(task: Task): Promise<void> {
  heartbeat(AGENT_TYPE);
  await startTask(task.id);

  try {
    let result: Record<string, any>;

    switch (task.taskType) {
      case 'register_shif':
        result = await registerShif(task.inputData);
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

async function registerShif(input: Record<string, any>): Promise<Record<string, any>> {
  const { id_number, name, phone, email, kra_pin } = input;

  return {
    success: true,
    status: 'guidance_provided',
    instructions: [
      '1. Visit the SHA portal at https://sha.go.ke',
      '2. Click "Register" to create an account',
      '3. Enter your National ID number for verification',
      '4. Fill in personal details:',
      '   - Full name as per ID',
      '   - Date of birth',
      '   - Phone number and email',
      '   - KRA PIN (if available)',
      '5. Add dependants (spouse, children under 25, parents over 65)',
      '6. Select your preferred primary health facility',
      '7. Submit registration',
      '8. You will receive your SHIF number via SMS',
    ],
    requirements: [
      'National ID or Passport',
      'Phone number registered with Safaricom/Airtel',
      'Valid email address',
      'Dependant details (if applicable)',
    ],
    monthlyRate: 'KES 300 minimum (2.75% of gross salary for employed persons)',
    portalUrl: 'https://sha.go.ke',
    helpline: '0800 720 601',
    ussdCode: '*147#',
    message: 'SHIF registration can be done online at sha.go.ke or via USSD *147#. Would you like step-by-step guidance?',
  };
}
