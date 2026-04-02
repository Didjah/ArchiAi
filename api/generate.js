export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { description, surface, lang } = req.body;
  if (!description || !surface) return res.status(400).json({ error: 'Champs manquants' });

  const apiKey = process.env.CLE_API_ANTHROPIC;
  if (!apiKey) return res.status(500).json({ error: 'Cle API manquante sur le serveur' });

  const prompt = lang === 'fr'
    ? `Tu es un architecte expert. Un client decrit son projet : "${description}" avec une superficie de ${surface} m2. Genere un plan architectural professionnel en francais. Structure ta reponse ainsi :
1. Nom du projet (ex: Villa moderne 3 chambres)
2. Description du plan en 3-4 phrases (disposition des pieces, orientation, circulation).
Ne mentionne pas de cout ou estimation financiere.`
    : `You are an expert architect. Client project: "${description}", surface: ${surface} m2. Generate a professional architectural plan in English:
1. Project name (ex: Modern 3-bedroom villa)
2. Plan description in 3-4 sentences (room layout, orientation, flow).
Do not mention any cost or financial estimate.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data?.error?.message || 'Erreur API Anthropic' });
    }

    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ result: text });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
}
