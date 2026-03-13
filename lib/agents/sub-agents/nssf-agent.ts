// lib/agents/sub-agents/nssf-agent.ts
// NSSF registration assistance

import { startTask, completeTask, failTask, type Task } from '../task-manager';
import { heartbeat, recordExecution } from '../agent-registry';

const AGENT_TYPE = 'nssf' as const;

export async function execute(task: Task): Promise<void> {
  heartbeat(AGENT_TYPE);
  await startTask(task.id);

  try {
    let result: Record<string, any>;

    switch (task.taskType) {
      case 'register_nssf':
        result = await registerNssf(task.inputData);
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

async function registerNssf(input: Record<string, any>): Promise<Record<string, any>> {
  const { id_number, name, phone, email, kra_pin } = input;

  // NSSF registration guidance — automation endpoint to be added
  return {
    success: true,
    status: 'guidance_provided',
    instructions: [
      '1. Visit the NSSF portal at https://www.nssf.or.ke',
      '2. Click on "Register" for new members',
      '3. Fill in your personal details:',
      '   - Full name as per ID',
      '   - National ID number',
      '   - KRA PIN',
      '   - Phone number and email',
      '4. Upload a copy of your national ID (front and back)',
      '5. Submit the application',
      '6. You will receive your NSSF number via SMS/email within 48 hours',
    ],
    requirements: [
      'National ID (original and copy)',
      'KRA PIN certificate',
      'Passport photo',
      'Phone number for OTP verification',
      'Valid email address',
    ],
    monthlyRate: 'KES 2,160 (as of 2024 — 6% of pensionable pay, max KES 36,000/month)',
    portalUrl: 'https://www.nssf.or.ke',
    helpline: '0800 221 111',
    message: 'NSSF registration can be done online at nssf.or.ke. Would you like me to guide you through the process step by step?',
  };
}
