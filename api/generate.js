export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { description, surface, lang } = body;

    if (!description || !surface) {
      return new Response(JSON.stringify({ error: 'Champs manquants' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.CLE_API_ANTHROPIC;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Cle API non configuree' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = lang === 'fr'
      ? `Tu es un architecte expert. Un client decrit son projet : "${description}" avec une superficie de ${surface} m2. Genere un plan architectural professionnel en francais. Structure ta reponse ainsi :
1. Nom du projet (ex: Villa moderne 3 chambres)
2. Description du plan en 3-4 phrases (disposition des pieces, orientation, circulation).
Ne mentionne pas de cout ou estimation financiere.`
      : `You are an expert architect. Client project: "${description}", surface: ${surface} m2. Generate a professional architectural plan in English:
1. Project name (ex: Modern 3-bedroom villa)
2. Plan description in 3-4 sentences (room layout, orientation, flow).
Do not mention any cost or financial estimate.`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || 'Erreur API' }), {
        status: anthropicResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = data.content?.[0]?.text || '';

    return new Response(JSON.stringify({ result: text }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur: ' + err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
