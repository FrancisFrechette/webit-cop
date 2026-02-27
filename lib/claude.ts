import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  // En build/local sans clé, on expose un client "stub" qui lèvera une erreur
  // uniquement si on tente réellement d'appeler l'API.
  // Cela évite de faire échouer `next build` à cause de l'absence de variables d'env.
  // eslint-disable-next-line no-console
  console.warn('Missing ANTHROPIC_API_KEY env var – Claude désactivé en environnement courant.');
}

const stubClaude = {
  messages: {
    create() {
      throw new Error('Claude est désactivé : ANTHROPIC_API_KEY manquant.');
    },
  },
} as unknown as Anthropic;

export const claude: Anthropic =
  apiKey != null && apiKey !== ''
    ? new Anthropic({ apiKey })
    : stubClaude;
