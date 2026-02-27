/**
 * Health check du provider de recherche (Meilisearch ou local).
 * GET /api/search/health => { provider, status, details? }
 */

import { NextResponse } from 'next/server';
import { loadMeilisearchConfig } from '@/lib/search/meilisearchConfig';
import { MeilisearchSearchProvider } from '@/lib/search/providers/meilisearchSearchProvider';

export async function GET() {
  const config = loadMeilisearchConfig();
  if (!config) {
    return NextResponse.json({
      provider: 'local',
      status: 'ok',
      details: 'Aucun provider externe configuré',
    });
  }

  try {
    const provider = new MeilisearchSearchProvider(config);
    const health = await provider.health();
    const status =
      health.status === 'ok' ? 'ok' : health.status === 'degraded' ? 'degraded' : 'error';
    return NextResponse.json({
      provider: 'meilisearch',
      status,
      ...(health.message && { details: health.message }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      provider: 'meilisearch',
      status: 'error',
      details: message,
    });
  }
}
