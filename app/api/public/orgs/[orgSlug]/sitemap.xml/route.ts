import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: implémenter le sitemap XML multi-langue pour l’org.
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

