import type { ContentBlock } from '@/lib/domain';

export interface AnalyzeBody {
  blocks: ContentBlock[];
  url?: string;
  locale?: string;
}

export interface AnalyzeResult {
  geoScore: number;
  suggestions: string[];
}

export function buildSeoGeoPrompt(body: AnalyzeBody): string {
  const { blocks, url, locale } = body;

  const localeText = locale ?? 'fr';
  const urlText = url ?? 'URL non spécifiée';

  const blocksSummary = blocks
    .map((block, index) => {
      switch (block.type) {
        case 'hero':
          return `Bloc #${index + 1} (Hero): titre="${block.title}", sous-titre="${block.subtitle ?? ''}"`;
        case 'richText':
          return `Bloc #${index + 1} (Texte riche): extrait="${block.html.slice(0, 200)}"`;
        case 'faq':
          return `Bloc #${index + 1} (FAQ): ${block.items.length} questions (ex: "${block.items[0]?.question ?? ''}")`;
        case 'cta':
          return `Bloc #${index + 1} (CTA): label="${block.label}", url="${block.url}"`;
        default:
          return `Bloc #${index + 1} (type inconnu)`;
      }
    })
    .join('\n');

  return `
Tu es un expert SEO/GEO francophone spécialisé en contenus multi-localisés.

Contexte:
- URL cible: ${urlText}
- Langue de la page: ${localeText}

Le contenu de la page est structuré en blocs de type Hero, Texte riche, FAQ et CTA.
Voici un résumé des blocs:

${blocksSummary}

Tâche:
1) Évalue la "citabilité GEO" de cette page sur 100:
   - 0 = très peu utile ou très générique pour un contexte local (ville, région, secteur).
   - 100 = extrêmement spécifique, utile et citée potentiellement par des sites/entités liés au territoire ciblé.
2) Propose entre 3 et 5 suggestions concrètes pour améliorer:
   - la précision géographique,
   - la pertinence locale (références à la ville, aux quartiers, aux cas d'usage locaux),
   - la capacité de la page à être reprise/citée par des acteurs locaux (médias, partenaires, institutions).

Format de réponse STRICT (JSON, une seule ligne) :
{
  "geoScore": nombre entre 0 et 100,
  "suggestions": ["phrase 1", "phrase 2", "phrase 3", ...]
}

Ne rajoute aucun autre texte en dehors de ce JSON.
`;
}

// --- Génération de blocs ---

export type GenerateBlocksType = 'hero' | 'richText' | 'faq' | 'cta';

export interface GenerateBlocksBody {
  /**
   * Type de blocs à générer (un ou plusieurs selon la demande).
   */
  types: GenerateBlocksType[];
  businessContext?: string;
  geoContext?: string;
  goal?: string;
  tone?: string;
  locale?: string;
}

export interface GenerateBlocksResult {
  blocks: ContentBlock[];
}

export function buildGenerateBlocksPrompt(body: GenerateBlocksBody): string {
  const {
    types,
    businessContext,
    geoContext,
    goal,
    tone,
    locale = 'fr',
  } = body;

  const typesText = types.join(', ') || 'hero, richText, faq, cta';

  return `
Tu es un expert UX/SEO francophone spécialisé en landing pages orientées conversion.

Langue de sortie: ${locale}
Types de blocs à générer: ${typesText}

Contexte métier: ${businessContext ?? 'Non spécifié'}
Contexte géographique: ${geoContext ?? 'Non spécifié'}
Objectif de la page: ${goal ?? 'Non spécifié'}
Tonalité souhaitée: ${tone ?? 'professionnel et accessible'}

Tâche:
Génère un ensemble de blocs de contenu prêts à être intégrés dans mon éditeur de blocs.
Respecte strictement les structures TypeScript suivantes (conceptuellement):

- HeroBlock: { id: string; type: 'hero'; title: string; subtitle?: string; backgroundImageUrl?: string; }
- RichTextBlock: { id: string; type: 'richText'; html: string; }
- FAQBlock: { id: string; type: 'faq'; items: { question: string; answer: string }[]; }
- CtaBlock: { id: string; type: 'cta'; label: string; url: string; }

Règles:
- Tous les ids peuvent être des chaînes aléatoires (ex: "hero-1"), le runtime remplacera par de vrais UUID.
- Le contenu doit être réaliste, adapté au contexte métier et géographique, et orienté conversion.
- Si 'faq' est demandé, propose au moins 3 questions/réponses pertinentes.
- Si 'hero' est demandé, produire un titre fort, un sous-titre clair et éventuellement une image de fond symbolique (URL générique).
- Si 'cta' est demandé, produire un libellé orienté action et une URL relative (ex: "/contact" ou "/devis").

Format de réponse STRICT (JSON, une seule ligne) :
{
  "blocks": [
    { ...ContentBlock },
    { ...ContentBlock },
    ...
  ]
}

Ne rajoute aucun autre texte en dehors de ce JSON.
`;
}
