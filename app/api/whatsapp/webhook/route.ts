// app/api/whatsapp/webhook/route.ts
// Evolution API webhook handler — receives incoming WhatsApp messages

import { NextRequest, NextResponse } from 'next/server';
import { handleIncomingMessage } from '@/lib/whatsapp/flows';

/**
 * POST /api/whatsapp/webhook
 * Called by Evolution API when a WhatsApp message/event arrives
 */
export async function POST(req: NextRequest) {
  try {
    // Validate Evolution API key
    const apiKey = req.headers.get('apikey') || req.headers.get('x-api-key');
    const expectedKey = process.env.EVOLUTION_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      console.warn('[WEBHOOK] Invalid API key from Evolution');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    console.log('[WEBHOOK] Received event:', JSON.stringify(payload).substring(0, 500));

    // Evolution API event types
    const event = payload.event || '';

    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      return handleMessagesUpsert(payload);
    }

    if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
      return handleConnectionUpdate(payload);
    }

    if (event === 'qrcode.updated' || event === 'QRCODE_UPDATED') {
      console.log('[WEBHOOK] QR Code updated — scan required');
      return NextResponse.json({ status: 'qr_noted' });
    }

    if (event === 'messages.update' || event === 'MESSAGES_UPDATE') {
      // Message status updates (delivered, read, etc.) — log only
      return NextResponse.json({ status: 'noted' });
    }

    // Unknown event
    console.log('[WEBHOOK] Unhandled event type:', event);
    return NextResponse.json({ status: 'ignored' });

  } catch (error: any) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleMessagesUpsert(payload: any): Promise<NextResponse> {
  try {
    const data = payload.data || payload;

    // Extract message details — Evolution API format
    const message = data.message || data;
    const key = message.key || data.key || {};
    const messageContent = message.message || {};

    // Skip outgoing messages (fromMe)
    if (key.fromMe) {
      return NextResponse.json({ status: 'skipped_outgoing' });
    }

    // Extract phone number (remove @s.whatsapp.net suffix)
    const remoteJid = key.remoteJid || '';
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

    if (!phone || phone.includes('status')) {
      return NextResponse.json({ status: 'skipped_non_user' });
    }

    // Extract message text
    let text = '';

    if (messageContent.conversation) {
      text = messageContent.conversation;
    } else if (messageContent.extendedTextMessage?.text) {
      text = messageContent.extendedTextMessage.text;
    } else if (messageContent.buttonsResponseMessage?.selectedButtonId) {
      text = messageContent.buttonsResponseMessage.selectedButtonId;
    } else if (messageContent.listResponseMessage?.singleSelectReply?.selectedRowId) {
      text = messageContent.listResponseMessage.singleSelectReply.selectedRowId;
    } else if (messageContent.templateButtonReplyMessage?.selectedId) {
      text = messageContent.templateButtonReplyMessage.selectedId;
    } else if (messageContent.imageMessage || messageContent.documentMessage) {
      text = '[media]';
    } else {
      // Try to extract any text from the message
      const possibleText = messageContent.text || message.body || '';
      if (possibleText) text = possibleText;
    }

    if (!text) {
      return NextResponse.json({ status: 'no_text_content' });
    }

    console.log(`[WEBHOOK] Message from ${phone}: ${text.substring(0, 100)}`);

    // Process through the conversational flow engine
    const result = await handleIncomingMessage(phone, text, key.id);

    return NextResponse.json({
      status: 'processed',
      sessionState: result.session.currentState,
      responded: result.responded,
    });

  } catch (error: any) {
    console.error('[WEBHOOK] Error handling message:', error);
    return NextResponse.json({ error: 'Message processing failed' }, { status: 500 });
  }
}

function handleConnectionUpdate(payload: any): NextResponse {
  const data = payload.data || payload;
  const state = data.state || data.instance?.state || 'unknown';
  console.log(`[WEBHOOK] Connection state: ${state}`);

  if (state === 'close' || state === 'disconnected') {
    console.warn('[WEBHOOK] WhatsApp disconnected! Reconnection may be needed.');
  }

  return NextResponse.json({ status: 'connection_noted', state });
}

/**
 * GET /api/whatsapp/webhook — Health check / webhook verification
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'nunge-returns-whatsapp',
    timestamp: new Date().toISOString(),
  });
}
