// app/api/health/route.ts
// System health endpoint for Docker healthcheck and monitoring

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  const health: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    services: {},
  };

  // Quick Supabase check
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { auth: { persistSession: false } }
    );
    const { error } = await supabase.from('sessions').select('count').limit(1);
    health.services.supabase = error ? 'degraded' : 'healthy';
  } catch {
    health.services.supabase = 'down';
  }

  // Check configured services
  health.services.gemini = process.env.GEMINI_API_KEY ? 'configured' : 'not_configured';
  health.services.openai = process.env.OPENAI_API_KEY ? 'configured' : 'not_configured';
  health.services.evolution = process.env.EVOLUTION_API_URL ? 'configured' : 'not_configured';
  health.services.encryption = process.env.ENCRYPTION_KEY ? 'configured' : 'not_configured';

  health.responseTimeMs = Date.now() - startTime;

  const isHealthy = health.services.supabase !== 'down';

  return NextResponse.json(health, { status: isHealthy ? 200 : 503 });
}
