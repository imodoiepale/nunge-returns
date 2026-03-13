// app/api/whatsapp/status/route.ts
// Evolution API connection health check

import { NextRequest, NextResponse } from 'next/server';
import { getConnectionStatus, getInstanceInfo } from '@/lib/whatsapp/evolution-client';

export async function GET(req: NextRequest) {
  try {
    const connectionStatus = await getConnectionStatus();

    let instanceInfo = null;
    try {
      instanceInfo = await getInstanceInfo();
    } catch { }

    return NextResponse.json({
      success: true,
      connection: connectionStatus,
      instance: {
        name: process.env.EVOLUTION_INSTANCE_NAME || 'nunge-returns',
        url: process.env.EVOLUTION_API_URL ? 'configured' : 'not_configured',
        info: instanceInfo,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      connection: { connected: false, state: 'error', error: error.message },
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
