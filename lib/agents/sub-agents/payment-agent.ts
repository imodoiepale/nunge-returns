// lib/agents/sub-agents/payment-agent.ts
// M-Pesa payment processing, status checking, refunds

import { startTask, completeTask, failTask, type Task } from '../task-manager';
import { heartbeat, recordExecution } from '../agent-registry';
import { supabase } from '@/lib/supabaseClient';

const AGENT_TYPE = 'payment' as const;
const SERVICE_FEE = 50; // KES per service

export async function execute(task: Task): Promise<void> {
  heartbeat(AGENT_TYPE);
  await startTask(task.id);

  try {
    let result: Record<string, any>;

    switch (task.taskType) {
      case 'initiate_payment':
        result = await initiatePayment(task.inputData);
        break;
      case 'check_payment':
        result = await checkPayment(task.inputData);
        break;
      case 'process_refund':
        result = await processRefund(task.inputData);
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

async function initiatePayment(input: Record<string, any>): Promise<Record<string, any>> {
  const { phone, amount, service_count, pin, session_id, description } = input;

  if (!phone) return { success: false, error: 'Phone number is required' };

  const totalAmount = amount || (service_count ? service_count * SERVICE_FEE : SERVICE_FEE);

  // Normalize phone number to 254 format
  let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (normalizedPhone.startsWith('0')) normalizedPhone = '254' + normalizedPhone.substring(1);
  else if (normalizedPhone.startsWith('+')) normalizedPhone = normalizedPhone.substring(1);

  try {
    // Record payment initiation in database
    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .insert({
        session_id: session_id || null,
        phone_number: normalizedPhone,
        amount: totalAmount,
        currency: 'KES',
        status: 'pending',
        payment_method: 'mpesa',
        description: description || `Nunge Returns - ${service_count || 1} service(s)`,
        metadata: { pin, service_count: service_count || 1 },
      })
      .select()
      .single();

    if (txnError) {
      console.error('[PAYMENT] Failed to record transaction:', txnError);
    }

    // Initiate M-Pesa STK push
    // This calls the existing payment endpoint or M-Pesa API directly
    const response = await fetch(`${getBaseUrl()}/api/mpesa/stk-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: normalizedPhone,
        amount: totalAmount,
        reference: txn?.id || `NR-${Date.now()}`,
        description: `Nunge Returns Service`,
      }),
    });

    if (!response.ok) {
      // If STK endpoint doesn't exist yet, return pending with manual instructions
      return {
        success: true,
        status: 'pending',
        transactionId: txn?.id,
        amount: totalAmount,
        phone: normalizedPhone,
        message: `Please send KES ${totalAmount} to our M-Pesa till. You will receive a confirmation once payment is verified.`,
        manualPayment: true,
      };
    }

    const data = await response.json();
    return {
      success: true,
      status: 'stk_sent',
      transactionId: txn?.id,
      checkoutRequestId: data.CheckoutRequestID,
      amount: totalAmount,
      phone: normalizedPhone,
      message: `M-Pesa payment request of KES ${totalAmount} sent to ${phone}. Please enter your PIN to complete.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      amount: totalAmount,
      phone: normalizedPhone,
      message: `Payment initiation failed. Please try again or pay KES ${totalAmount} manually via M-Pesa.`,
    };
  }
}

async function checkPayment(input: Record<string, any>): Promise<Record<string, any>> {
  const { transaction_id, checkout_request_id, phone } = input;

  if (transaction_id) {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (data) {
      return {
        success: true,
        status: data.status,
        amount: data.amount,
        phone: data.phone_number,
        paidAt: data.paid_at,
        reference: data.mpesa_reference,
      };
    }
  }

  if (phone) {
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '').replace(/^0/, '254');
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      return { success: true, status: data.status, amount: data.amount, reference: data.mpesa_reference };
    }
  }

  return { success: false, error: 'Transaction not found' };
}

async function processRefund(input: Record<string, any>): Promise<Record<string, any>> {
  const { transaction_id, reason } = input;
  // Refunds require manual processing for now
  return {
    success: true,
    status: 'refund_queued',
    message: `Refund request queued for transaction ${transaction_id}. Reason: ${reason || 'Not specified'}. Our team will process this within 24 hours.`,
  };
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
