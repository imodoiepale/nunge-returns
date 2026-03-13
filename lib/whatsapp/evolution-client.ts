// lib/whatsapp/evolution-client.ts
// Evolution API REST client for WhatsApp messaging

const getConfig = () => ({
  baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: process.env.EVOLUTION_API_KEY || '',
  instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'nunge-returns',
});

interface SendTextParams {
  phone: string;
  message: string;
}

interface SendButtonsParams {
  phone: string;
  title: string;
  description: string;
  footer?: string;
  buttons: { buttonId: string; buttonText: { displayText: string } }[];
}

interface SendListParams {
  phone: string;
  title: string;
  description: string;
  buttonText: string;
  footer?: string;
  sections: {
    title: string;
    rows: { title: string; description?: string; rowId: string }[];
  }[];
}

interface SendMediaParams {
  phone: string;
  mediaUrl: string;
  caption?: string;
  mediaType: 'image' | 'document' | 'audio' | 'video';
  fileName?: string;
}

async function apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const { baseUrl, apiKey, instanceName } = getConfig();
  const url = `${baseUrl}/${endpoint}`.replace('{instance}', instanceName);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': apiKey,
  };

  const options: RequestInit = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Evolution API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
  if (!cleaned.includes('@')) cleaned = cleaned + '@s.whatsapp.net';
  return cleaned;
}

/**
 * Send a text message
 */
export async function sendText({ phone, message }: SendTextParams): Promise<any> {
  return apiCall(`message/sendText/{instance}`, 'POST', {
    number: normalizePhone(phone),
    textMessage: { text: message },
    options: { delay: 1200, presence: 'composing' },
  });
}

/**
 * Send interactive buttons message
 */
export async function sendButtons({ phone, title, description, footer, buttons }: SendButtonsParams): Promise<any> {
  return apiCall(`message/sendButtons/{instance}`, 'POST', {
    number: normalizePhone(phone),
    buttonMessage: {
      title,
      description,
      footerText: footer || 'Nunge Returns',
      buttons: buttons.slice(0, 3), // WhatsApp max 3 buttons
    },
  });
}

/**
 * Send interactive list message
 */
export async function sendList({ phone, title, description, buttonText, footer, sections }: SendListParams): Promise<any> {
  return apiCall(`message/sendList/{instance}`, 'POST', {
    number: normalizePhone(phone),
    listMessage: {
      title,
      description,
      footerText: footer || 'Nunge Returns',
      buttonText,
      sections,
    },
  });
}

/**
 * Send a media message (image, document, audio, video)
 */
export async function sendMedia({ phone, mediaUrl, caption, mediaType, fileName }: SendMediaParams): Promise<any> {
  return apiCall(`message/sendMedia/{instance}`, 'POST', {
    number: normalizePhone(phone),
    mediaMessage: {
      mediatype: mediaType,
      media: mediaUrl,
      caption: caption || '',
      fileName: fileName || undefined,
    },
  });
}

/**
 * Send a location message
 */
export async function sendLocation(phone: string, latitude: number, longitude: number, name?: string): Promise<any> {
  return apiCall(`message/sendLocation/{instance}`, 'POST', {
    number: normalizePhone(phone),
    locationMessage: { latitude, longitude, name: name || '' },
  });
}

/**
 * Send a contact card
 */
export async function sendContact(phone: string, contactName: string, contactPhone: string): Promise<any> {
  return apiCall(`message/sendContact/{instance}`, 'POST', {
    number: normalizePhone(phone),
    contactMessage: [{
      fullName: contactName,
      wuid: normalizePhone(contactPhone).split('@')[0],
      phoneNumber: contactPhone,
    }],
  });
}

/**
 * Check instance connection status
 */
export async function getConnectionStatus(): Promise<{ connected: boolean; state: string; error?: string }> {
  try {
    const data = await apiCall(`instance/connectionState/{instance}`);
    const state = data?.instance?.state || data?.state || 'unknown';
    return { connected: state === 'open', state };
  } catch (error: any) {
    return { connected: false, state: 'error', error: error.message };
  }
}

/**
 * Get instance info
 */
export async function getInstanceInfo(): Promise<any> {
  return apiCall(`instance/fetchInstances`);
}

/**
 * Set webhook URL for receiving messages
 */
export async function setWebhook(webhookUrl: string): Promise<any> {
  return apiCall(`webhook/set/{instance}`, 'POST', {
    enabled: true,
    url: webhookUrl,
    webhookByEvents: false,
    events: [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'CONNECTION_UPDATE',
      'QRCODE_UPDATED',
    ],
  });
}

/**
 * Mark messages as read
 */
export async function markAsRead(phone: string, messageIds: string[]): Promise<any> {
  return apiCall(`chat/markMessageAsRead/{instance}`, 'PUT', {
    readMessages: messageIds.map(id => ({
      remoteJid: normalizePhone(phone),
      id,
    })),
  });
}

/**
 * Send typing indicator
 */
export async function sendPresence(phone: string, presence: 'composing' | 'recording' | 'available'): Promise<any> {
  return apiCall(`chat/sendPresence/{instance}`, 'POST', {
    number: normalizePhone(phone),
    presence,
  });
}
