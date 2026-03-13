// lib/whatsapp/flows.ts
// Conversational flow engine — state machine transitions for WhatsApp sessions

import { getOrCreateSession, updateSession, storeData, incrementMessageCount, terminateSession, type WhatsAppSession, type SessionState, type ServiceType } from './session-manager';
import * as evolution from './evolution-client';
import * as templates from './message-templates';
import { processMessage } from '../agents/orchestrator';
import { createTask } from '../agents/task-manager';
import { validateKraPin } from '../security/input-sanitizer';
import { quickGuard } from '../security/prompt-guard';

const KRA_PIN_REGEX = /^[AP]\d{9}[A-Z]$/i;
const PHONE_REGEX = /^(?:\+?254|0)\d{9}$/;

interface FlowResult {
  session: WhatsAppSession;
  responded: boolean;
}

/**
 * Main entry point — process an incoming WhatsApp message
 */
export async function handleIncomingMessage(phoneNumber: string, messageText: string, messageId?: string): Promise<FlowResult> {
  // Quick security check
  if (!quickGuard(messageText)) {
    await evolution.sendText({ phone: phoneNumber, message: "I couldn't process that message. Please try again." });
    const session = await getOrCreateSession(phoneNumber);
    return { session, responded: true };
  }

  const session = await getOrCreateSession(phoneNumber);
  await incrementMessageCount(session.id);

  // Mark as read
  if (messageId) {
    try { await evolution.markAsRead(phoneNumber, [messageId]); } catch { }
  }

  // Route to appropriate handler based on current state
  switch (session.currentState) {
    case 'greeting':
      return handleGreeting(session, phoneNumber, messageText);
    case 'service_selection':
      return handleServiceSelection(session, phoneNumber, messageText);
    case 'pin_collection':
      return handlePinCollection(session, phoneNumber, messageText);
    case 'password_collection':
      return handlePasswordCollection(session, phoneNumber, messageText);
    case 'obligation_selection':
      return handleObligationSelection(session, phoneNumber, messageText);
    case 'data_collection':
      return handleDataCollection(session, phoneNumber, messageText);
    case 'payment':
      return handlePayment(session, phoneNumber, messageText);
    case 'processing':
      return handleProcessing(session, phoneNumber, messageText);
    case 'delivery':
    case 'idle':
      return handleIdle(session, phoneNumber, messageText);
    case 'support':
      return handleSupport(session, phoneNumber, messageText);
    default:
      return handleGreeting(session, phoneNumber, messageText);
  }
}

async function handleGreeting(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  // Send greeting and service menu
  await evolution.sendText({ phone, message: templates.GREETING() });

  await evolution.sendList({
    phone,
    title: 'Our Services',
    description: 'Select a service to get started',
    buttonText: 'View Services',
    sections: templates.SERVICE_MENU_SECTIONS,
  });

  const updated = await updateSession(session.id, { currentState: 'service_selection' });
  return { session: updated, responded: true };
}

async function handleServiceSelection(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  const text = message.toLowerCase().trim();

  // Map user input to service type
  const serviceMap: Record<string, ServiceType> = {
    'nil_returns_individual': 'nil_returns_individual',
    'nil_returns_company': 'nil_returns_company',
    'password_reset': 'password_reset',
    'terminate_obligation': 'terminate_obligation',
    'nssf': 'nssf',
    'shif': 'shif',
    'status_check': 'status_check',
    'support': 'support',
    // Natural language shortcuts
    '1': 'nil_returns_individual',
    '2': 'nil_returns_company',
    'file': 'nil_returns_individual',
    'nil': 'nil_returns_individual',
    'individual': 'nil_returns_individual',
    'company': 'nil_returns_company',
    'reset': 'password_reset',
    'password': 'password_reset',
    'terminate': 'terminate_obligation',
    'status': 'status_check',
    'help': 'support',
  };

  const serviceType = serviceMap[text] || null;

  if (!serviceType) {
    // Use AI to classify if no direct match
    if (session.conversationId) {
      const aiResult = await processMessage(session.conversationId, message, 'whatsapp');
      await evolution.sendText({ phone, message: aiResult.response });
    } else {
      await evolution.sendText({ phone, message: "I didn't quite catch that. Please select a service from the menu, or type *help* for support." });
    }
    return { session, responded: true };
  }

  // Route to appropriate next state
  const updated = await updateSession(session.id, { serviceType });

  switch (serviceType) {
    case 'nil_returns_individual':
    case 'nil_returns_company':
    case 'terminate_obligation':
    case 'password_reset':
      await evolution.sendText({ phone, message: templates.ASK_PIN });
      const pinState = await updateSession(session.id, { currentState: 'pin_collection', serviceType });
      return { session: pinState, responded: true };

    case 'nssf':
    case 'shif': {
      const task = await createTask({
        agentType: serviceType as any,
        taskType: serviceType === 'nssf' ? 'register_nssf' : 'register_shif',
        inputData: { phone },
        conversationId: session.conversationId || undefined,
      });
      // The agent will provide guidance
      await evolution.sendText({ phone, message: `Let me get the ${serviceType.toUpperCase()} registration information for you...` });
      const guidanceState = await updateSession(session.id, { currentState: 'delivery', taskId: task.id });
      return { session: guidanceState, responded: true };
    }

    case 'status_check':
      await evolution.sendText({ phone, message: "Let me check your recent requests. Please provide your *KRA PIN* so I can look up your history." });
      const statusState = await updateSession(session.id, { currentState: 'pin_collection', serviceType: 'status_check' });
      return { session: statusState, responded: true };

    case 'support':
      await evolution.sendText({ phone, message: "I'm connecting you with our support team. Please describe your issue and we'll help you as soon as possible." });
      const supportState = await updateSession(session.id, { currentState: 'support' });
      return { session: supportState, responded: true };
  }

  return { session: updated, responded: true };
}

async function handlePinCollection(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  const pin = message.toUpperCase().trim();

  // Check if user wants to go back
  if (['back', 'menu', 'cancel'].includes(pin.toLowerCase())) {
    return handleGreeting(session, phone, message);
  }

  const validation = validateKraPin(pin);
  if (!validation.isValid) {
    await evolution.sendText({ phone, message: templates.INVALID_PIN });
    return { session, responded: true };
  }

  // Check if service requires company PIN
  if (session.serviceType === 'nil_returns_company' || session.serviceType === 'terminate_obligation') {
    if (!pin.startsWith('P')) {
      await evolution.sendText({ phone, message: "⚠️ Company services require a *company PIN* (starts with *P*). Individual PINs start with A.\n\nPlease provide a company PIN or type *back* to change service." });
      return { session, responded: true };
    }
  }

  await storeData(session.id, 'pin', pin);

  // For password reset, we can proceed without password
  if (session.serviceType === 'password_reset') {
    const task = await createTask({
      agentType: 'kra-account',
      taskType: 'reset_password',
      inputData: { pin },
      conversationId: session.conversationId || undefined,
      priority: 'high',
    });
    await evolution.sendText({ phone, message: `Processing password reset for PIN *${pin}*... The reset link will be sent to your KRA-registered email.` });
    const updated = await updateSession(session.id, { currentState: 'processing', taskId: task.id, collectedData: { ...session.collectedData, pin } });
    return { session: updated, responded: true };
  }

  // For status check
  if (session.serviceType === 'status_check') {
    await evolution.sendText({ phone, message: `Looking up status for PIN *${pin}*...` });
    const updated = await updateSession(session.id, { currentState: 'delivery', collectedData: { ...session.collectedData, pin } });
    return { session: updated, responded: true };
  }

  // Otherwise ask for password
  await evolution.sendText({ phone, message: templates.PIN_VERIFIED(pin, pin) });
  const updated = await updateSession(session.id, {
    currentState: 'password_collection',
    collectedData: { ...session.collectedData, pin },
  });
  return { session: updated, responded: true };
}

async function handlePasswordCollection(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  if (['back', 'menu', 'cancel'].includes(message.toLowerCase().trim())) {
    return handleGreeting(session, phone, message);
  }

  const password = message.trim();
  await storeData(session.id, 'password', password);

  // For company services, check obligations first
  if (session.serviceType === 'nil_returns_company' || session.serviceType === 'terminate_obligation') {
    await evolution.sendText({ phone, message: "🔍 Checking company obligations..." });
    // Fetch obligations
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/company/check-obligations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: session.collectedData.pin }),
      });
      const data = await res.json();

      if (data.success && data.obligations?.length > 0) {
        await storeData(session.id, 'obligations', data.obligations);
        await evolution.sendText({ phone, message: templates.ASK_OBLIGATIONS(data.obligations) });
        const updated = await updateSession(session.id, {
          currentState: 'obligation_selection',
          collectedData: { ...session.collectedData, password, obligations: data.obligations },
        });
        return { session: updated, responded: true };
      } else {
        await evolution.sendText({ phone, message: "No active obligations found for this company PIN. Type *menu* to go back." });
        return { session, responded: true };
      }
    } catch {
      await evolution.sendText({ phone, message: "Couldn't fetch obligations. Please try again or type *support*." });
      return { session, responded: true };
    }
  }

  // For individual filing, proceed to payment
  const serviceCount = 1;
  const amount = serviceCount * 50;
  await evolution.sendText({ phone, message: templates.PAYMENT_REQUEST(amount, serviceCount) });

  const updated = await updateSession(session.id, {
    currentState: 'payment',
    collectedData: { ...session.collectedData, password, amount, serviceCount },
  });
  return { session: updated, responded: true };
}

async function handleObligationSelection(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  const text = message.toLowerCase().trim();
  const obligations = session.collectedData.obligations || [];

  let selectedIds: string[] = [];

  if (text === 'all') {
    selectedIds = obligations.map((o: any) => o.id);
  } else {
    // Parse comma-separated numbers
    const numbers = text.split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    selectedIds = numbers
      .filter(n => n >= 1 && n <= obligations.length)
      .map(n => obligations[n - 1].id);
  }

  if (selectedIds.length === 0) {
    await evolution.sendText({ phone, message: "Please select at least one obligation. Reply with numbers (e.g., *1, 3*) or type *all*." });
    return { session, responded: true };
  }

  await storeData(session.id, 'selectedObligationIds', selectedIds);

  // For termination, ask for reason
  if (session.serviceType === 'terminate_obligation') {
    await evolution.sendText({ phone, message: templates.TERMINATION_ASK_REASON });
    const updated = await updateSession(session.id, {
      currentState: 'data_collection',
      collectedData: { ...session.collectedData, selectedObligationIds: selectedIds },
    });
    return { session: updated, responded: true };
  }

  // For filing, proceed to payment
  const amount = selectedIds.length * 50;
  await evolution.sendText({ phone, message: templates.PAYMENT_REQUEST(amount, selectedIds.length) });

  const updated = await updateSession(session.id, {
    currentState: 'payment',
    collectedData: { ...session.collectedData, selectedObligationIds: selectedIds, amount, serviceCount: selectedIds.length },
  });
  return { session: updated, responded: true };
}

async function handleDataCollection(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  // Currently used for termination reason
  if (session.serviceType === 'terminate_obligation') {
    const reasonMap: Record<string, string> = {
      '1': 'Business Closed', '2': 'Business Dormant',
      '3': 'Merged with Another Entity', '4': 'Obligation Not Applicable',
      '5': 'Duplicate Registration',
    };
    const reason = reasonMap[message.trim()] || message.trim();
    await storeData(session.id, 'terminationReason', reason);

    const amount = (session.collectedData.selectedObligationIds?.length || 1) * 50;
    await evolution.sendText({ phone, message: templates.PAYMENT_REQUEST(amount, session.collectedData.selectedObligationIds?.length || 1) });

    const updated = await updateSession(session.id, {
      currentState: 'payment',
      collectedData: { ...session.collectedData, terminationReason: reason, amount },
    });
    return { session: updated, responded: true };
  }

  return { session, responded: false };
}

async function handlePayment(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  const text = message.trim();

  // Check if it's a phone number for STK push
  if (PHONE_REGEX.test(text.replace(/[\s\-]/g, ''))) {
    const mpesaPhone = text.replace(/[\s\-]/g, '');
    const amount = session.collectedData.amount || 50;

    await evolution.sendText({ phone, message: templates.PAYMENT_STK_SENT(mpesaPhone, amount) });

    // Create payment task
    const task = await createTask({
      agentType: 'payment',
      taskType: 'initiate_payment',
      inputData: {
        phone: mpesaPhone,
        amount,
        service_count: session.collectedData.serviceCount || 1,
        pin: session.collectedData.pin,
        session_id: session.id,
      },
      conversationId: session.conversationId || undefined,
      priority: 'high',
    });

    const updated = await updateSession(session.id, {
      currentState: 'processing',
      paymentStatus: 'pending',
      taskId: task.id,
      collectedData: { ...session.collectedData, mpesaPhone },
    });

    // Simulate payment confirmation for now (in production, wait for M-Pesa callback)
    setTimeout(async () => {
      try {
        await handlePaymentConfirmed(session.id, phone);
      } catch { }
    }, 5000);

    return { session: updated, responded: true };
  }

  // Check if it's an M-Pesa confirmation code
  if (/^[A-Z0-9]{10}$/.test(text)) {
    await storeData(session.id, 'mpesaReference', text);
    await evolution.sendText({ phone, message: templates.PAYMENT_CONFIRMED(text) });
    await handlePaymentConfirmed(session.id, phone);
    return { session, responded: true };
  }

  await evolution.sendText({ phone, message: "Please provide your *M-Pesa number* (e.g., 0712345678) or an *M-Pesa transaction code*." });
  return { session, responded: true };
}

async function handlePaymentConfirmed(sessionId: string, phone: string): Promise<void> {
  const { data: sessionRow } = await (await import('@/lib/supabaseClient')).supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!sessionRow) return;

  const session = {
    id: sessionRow.id,
    collectedData: sessionRow.collected_data || {},
    serviceType: sessionRow.service_type,
    conversationId: sessionRow.conversation_id,
  };

  await evolution.sendText({ phone, message: templates.FILING_IN_PROGRESS });

  // Create the filing/termination task
  if (session.serviceType === 'nil_returns_individual') {
    await createTask({
      agentType: 'kra-filing',
      taskType: 'file_nil_return',
      inputData: {
        pin: session.collectedData.pin,
        password: session.collectedData.password,
        type: 'individual',
      },
      conversationId: session.conversationId || undefined,
      priority: 'high',
    });
  } else if (session.serviceType === 'nil_returns_company') {
    await createTask({
      agentType: 'kra-filing',
      taskType: 'batch_file',
      inputData: {
        pin: session.collectedData.pin,
        password: session.collectedData.password,
        company_name: session.collectedData.companyName || 'Company',
        obligation_ids: session.collectedData.selectedObligationIds || [],
      },
      conversationId: session.conversationId || undefined,
      priority: 'high',
    });
  } else if (session.serviceType === 'terminate_obligation') {
    await createTask({
      agentType: 'kra-account',
      taskType: 'terminate_obligation',
      inputData: {
        pin: session.collectedData.pin,
        password: session.collectedData.password,
        obligation_ids: session.collectedData.selectedObligationIds || [],
        reason: session.collectedData.terminationReason || 'Business Closed',
      },
      conversationId: session.conversationId || undefined,
      priority: 'medium',
    });
  }

  await (await import('@/lib/supabaseClient')).supabase
    .from('whatsapp_sessions')
    .update({
      current_state: 'processing',
      payment_status: 'paid',
    })
    .eq('id', sessionId);
}

async function handleProcessing(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  await evolution.sendText({ phone, message: "⏳ Your request is still being processed. I'll notify you as soon as it's done!" });
  return { session, responded: true };
}

async function handleIdle(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  // Start fresh
  return handleGreeting(session, phone, message);
}

async function handleSupport(session: WhatsAppSession, phone: string, message: string): Promise<FlowResult> {
  if (session.conversationId) {
    const aiResult = await processMessage(session.conversationId, message, 'whatsapp');
    await evolution.sendText({ phone, message: aiResult.response });

    // Auto-create ticket if needed
    if (aiResult.tasks.length === 0 && session.messageCount > 3) {
      await createTask({
        agentType: 'ticketing',
        taskType: 'create_ticket',
        inputData: {
          description: message,
          requester_phone: phone,
          channel: 'whatsapp',
          category: 'general',
        },
        conversationId: session.conversationId,
      });
    }
  } else {
    await evolution.sendText({ phone, message: "Our support team has been notified. They'll get back to you shortly. In the meantime, you can type *menu* to see other options." });
  }
  return { session, responded: true };
}

/**
 * Send a proactive notification to a phone number
 */
export async function sendNotification(phone: string, message: string): Promise<void> {
  await evolution.sendText({ phone, message });
}

/**
 * Deliver filing results to user via WhatsApp
 */
export async function deliverResults(phone: string, sessionId: string, results: any): Promise<void> {
  if (results.receiptUrl) {
    // Send receipt as document
    await evolution.sendMedia({
      phone,
      mediaUrl: results.receiptUrl,
      caption: `KRA Nil Return Receipt - ${results.pin || ''}`,
      mediaType: 'document',
      fileName: 'KRA_Receipt.pdf',
    });
    await evolution.sendText({ phone, message: templates.FILING_SUCCESS(results.receiptUrl, results.pin || '') });
  } else if (results.results) {
    // Batch results
    await evolution.sendText({
      phone,
      message: templates.FILING_BATCH_SUCCESS(results.results.map((r: any) => ({ name: r.obligation_name, status: r.status }))),
    });
    // Send individual receipts
    for (const r of results.results) {
      if (r.receipt_url) {
        await evolution.sendMedia({ phone, mediaUrl: r.receipt_url, caption: `Receipt: ${r.obligation_name}`, mediaType: 'document' });
      }
    }
  } else if (results.error) {
    await evolution.sendText({ phone, message: templates.FILING_FAILED(results.error) });
  }

  // Update session to delivery/idle
  await (await import('@/lib/supabaseClient')).supabase
    .from('whatsapp_sessions')
    .update({ current_state: 'idle' })
    .eq('id', sessionId);
}
