import { requireAuth } from '@/lib/auth';
import { claude } from '@/lib/claude';
import {
  buildGenerateBlocksPrompt,
  type GenerateBlocksBody,
  type GenerateBlocksResult,
} from '@/lib/ai';
import type { ContentBlock } from '@/lib/domain';
import { APIError } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  let body: GenerateBlocksBody;
  try {
    body = (await req.json()) as GenerateBlocksBody;
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  if (!body.types || !Array.isArray(body.types) || body.types.length === 0) {
    return NextResponse.json(
      { error: 'types doit être un tableau non vide' },
      { status: 400 },
    );
  }

  const prompt = buildGenerateBlocksPrompt(body);

  try {
    const message = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
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

    let parsed: GenerateBlocksResult;
    try {
      parsed = JSON.parse(text) as GenerateBlocksResult;
    } catch {
      parsed = { blocks: [] };
    }

    if (!Array.isArray(parsed.blocks)) {
      parsed = { blocks: [] };
    }

    const validTypes = ['hero', 'richText', 'faq', 'cta'] as const;
    const normalizedBlocks: ContentBlock[] = parsed.blocks
      .filter(
        (b) =>
          b &&
          typeof b === 'object' &&
          'type' in b &&
          validTypes.includes((b as { type: string }).type as (typeof validTypes)[number])
      )
      .map((b, index) => {
        const id = (b as { id?: string }).id ?? `ai-block-${index}`;
        return { ...(b as object), id } as ContentBlock;
      });

    const result: GenerateBlocksResult = {
      blocks: normalizedBlocks,
    };

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof APIError) {
      console.error('Claude generate-blocks error', err.status, err.message);
    } else {
      console.error('Unexpected generate-blocks AI error', err);
    }
    const fallback: GenerateBlocksResult = { blocks: [] };
    return NextResponse.json(fallback, { status: 200 });
  }
}
