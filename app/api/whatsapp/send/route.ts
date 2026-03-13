// app/api/whatsapp/send/route.ts
// Outbound WhatsApp message API for proactive notifications

import { NextRequest, NextResponse } from 'next/server';
import { sendText, sendMedia, sendButtons, sendList } from '@/lib/whatsapp/evolution-client';

export async function POST(req: NextRequest) {
  try {
    const { phone, message, type, mediaUrl, caption, buttons, sections } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    let result: any;

    switch (type || 'text') {
      case 'text':
        if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        result = await sendText({ phone, message });
        break;

      case 'media':
        if (!mediaUrl) return NextResponse.json({ error: 'mediaUrl is required' }, { status: 400 });
        result = await sendMedia({ phone, mediaUrl, caption, mediaType: 'document' });
        break;

      case 'buttons':
        if (!buttons?.length) return NextResponse.json({ error: 'Buttons are required' }, { status: 400 });
        result = await sendButtons({
          phone,
          title: message || 'Choose an option',
          description: caption || '',
          buttons,
        });
        break;

      case 'list':
        if (!sections?.length) return NextResponse.json({ error: 'Sections are required' }, { status: 400 });
        result = await sendList({
          phone,
          title: message || 'Menu',
          description: caption || 'Select an option',
          buttonText: 'View Options',
          sections,
        });
        break;

      default:
        return NextResponse.json({ error: `Unknown message type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[SEND] Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
