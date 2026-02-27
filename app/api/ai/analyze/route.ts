import { requireAuth } from '@/lib/auth';
import { claude } from '@/lib/claude';
import { buildSeoGeoPrompt } from '@/lib/ai';
import type { AnalyzeBody, AnalyzeResult } from '@/lib/ai';
import { APIError } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  let body: AnalyzeBody;
  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  if (!body.blocks || !Array.isArray(body.blocks) || body.blocks.length === 0) {
    return NextResponse.json(
      { error: 'blocks doit être un tableau non vide' },
      { status: 400 },
    );
  }

  const prompt = buildSeoGeoPrompt(body);

  try {
    const message = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = message.content
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n')
      .trim();

    let parsed: AnalyzeResult;
    try {
      parsed = JSON.parse(text) as AnalyzeResult;
    } catch {
      parsed = {
        geoScore: 60,
        suggestions: ['Impossible de parser la réponse IA, veuillez réessayer.'],
      };
    }

    if (
      typeof parsed.geoScore !== 'number' ||
      !Array.isArray(parsed.suggestions)
    ) {
      parsed = {
        geoScore: 60,
        suggestions: ['Réponse IA invalide, utilisez ce résultat avec prudence.'],
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    if (err instanceof APIError) {
      console.error('Claude API error', err.status, err.message);
    } else {
      console.error('Unexpected AI error', err);
    }
    const fallback: AnalyzeResult = {
      geoScore: 50,
      suggestions: [
        'Impossible de contacter le moteur IA pour le moment.',
        'Ajoutez une FAQ ciblée sur les questions locales fréquentes.',
        'Mentionnez explicitement la ville / région dans le Hero et les titres.',
      ],
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}
