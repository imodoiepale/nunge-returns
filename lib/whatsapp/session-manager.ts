// lib/whatsapp/session-manager.ts
// Per-phone-number conversation state machine, persisted in Supabase

import { supabase } from '@/lib/supabaseClient';
import { createConversation } from '../ai/context-manager';
import { v4 as uuidv4 } from 'uuid';

export type SessionState =
  | 'greeting' | 'service_selection' | 'data_collection'
  | 'pin_collection' | 'password_collection' | 'obligation_selection'
  | 'payment' | 'processing' | 'delivery' | 'support'
  | 'status_check' | 'idle' | 'terminated';

export type ServiceType =
  | 'nil_returns_individual' | 'nil_returns_company' | 'terminate_obligation'
  | 'password_reset' | 'email_change' | 'pin_registration'
  | 'nssf' | 'shif' | 'status_check' | 'support';

export interface WhatsAppSession {
  id: string;
  phoneNumber: string;
  conversationId: string | null;
  currentState: SessionState;
  serviceType: ServiceType | null;
  collectedData: Record<string, any>;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded';
  paymentReference: string | null;
  taskId: string | null;
  lastMessageAt: string;
  timeoutAt: string | null;
  messageCount: number;
  metadata: Record<string, any>;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a session for a phone number
 */
export async function getOrCreateSession(phoneNumber: string): Promise<WhatsAppSession> {
  const normalized = normalizePhone(phoneNumber);

  // Look for active session
  const { data: existing } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone_number', normalized)
    .not('current_state', 'in', '("terminated","idle")')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    // Check timeout
    if (existing.timeout_at && new Date(existing.timeout_at) < new Date()) {
      await terminateSession(existing.id, 'timeout');
    } else {
      return mapRowToSession(existing);
    }
  }

  // Create new session + conversation
  const conversationId = await createConversation('whatsapp', normalized);
  const id = uuidv4();
  const now = new Date();

  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .insert({
      id,
      phone_number: normalized,
      conversation_id: conversationId,
      current_state: 'greeting',
      service_type: null,
      collected_data: {},
      payment_status: 'unpaid',
      payment_reference: null,
      task_id: null,
      last_message_at: now.toISOString(),
      timeout_at: new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString(),
      message_count: 0,
      metadata: {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return mapRowToSession(data);
}

/**
 * Update session state
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<WhatsAppSession, 'currentState' | 'serviceType' | 'collectedData' | 'paymentStatus' | 'paymentReference' | 'taskId' | 'metadata'>>
): Promise<WhatsAppSession> {
  const now = new Date();
  const dbUpdates: Record<string, any> = {
    last_message_at: now.toISOString(),
    timeout_at: new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString(),
  };

  if (updates.currentState) dbUpdates.current_state = updates.currentState;
  if (updates.serviceType) dbUpdates.service_type = updates.serviceType;
  if (updates.collectedData) dbUpdates.collected_data = updates.collectedData;
  if (updates.paymentStatus) dbUpdates.payment_status = updates.paymentStatus;
  if (updates.paymentReference) dbUpdates.payment_reference = updates.paymentReference;
  if (updates.taskId) dbUpdates.task_id = updates.taskId;
  if (updates.metadata) dbUpdates.metadata = updates.metadata;

  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .update(dbUpdates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update session: ${error.message}`);
  return mapRowToSession(data);
}

/**
 * Increment message count
 */
export async function incrementMessageCount(sessionId: string): Promise<void> {
  const { data } = await supabase
    .from('whatsapp_sessions')
    .select('message_count')
    .eq('id', sessionId)
    .single();

  await supabase
    .from('whatsapp_sessions')
    .update({
      message_count: (data?.message_count || 0) + 1,
      last_message_at: new Date().toISOString(),
      timeout_at: new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString(),
    })
    .eq('id', sessionId);
}

/**
 * Store collected data (merge with existing)
 */
export async function storeData(sessionId: string, key: string, value: any): Promise<void> {
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('collected_data')
    .eq('id', sessionId)
    .single();

  const currentData = session?.collected_data || {};
  currentData[key] = value;

  await supabase
    .from('whatsapp_sessions')
    .update({ collected_data: currentData })
    .eq('id', sessionId);
}

/**
 * Terminate a session
 */
export async function terminateSession(sessionId: string, reason: string = 'completed'): Promise<void> {
  await supabase
    .from('whatsapp_sessions')
    .update({
      current_state: 'terminated',
      metadata: { terminationReason: reason, terminatedAt: new Date().toISOString() },
    })
    .eq('id', sessionId);
}

/**
 * Get session by phone number
 */
export async function getActiveSession(phoneNumber: string): Promise<WhatsAppSession | null> {
  const normalized = normalizePhone(phoneNumber);
  const { data } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone_number', normalized)
    .not('current_state', 'in', '("terminated","idle")')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data ? mapRowToSession(data) : null;
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\+@a-z.]/gi, '');
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
  return cleaned;
}

function mapRowToSession(row: any): WhatsAppSession {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    conversationId: row.conversation_id,
    currentState: row.current_state,
    serviceType: row.service_type,
    collectedData: row.collected_data || {},
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference,
    taskId: row.task_id,
    lastMessageAt: row.last_message_at,
    timeoutAt: row.timeout_at,
    messageCount: row.message_count || 0,
    metadata: row.metadata || {},
  };
}
