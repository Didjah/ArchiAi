export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt manquant' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLE_API_OPENAI}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: `Tu es ArchiAI, un assistant expert en architecture et urbanisme.
Tu génères des descriptions de projets architecturaux claires, professionnelles et créatives.
Réponds toujours en français et en anglais (FR puis EN).
Structure ta réponse avec des sections : Concept, Matériaux, Espaces, Durabilité.`
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Erreur OpenAI');
    }

    const text = data.choices[0].message.content;
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: error.message });
  }
}
