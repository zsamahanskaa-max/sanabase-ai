export async function onRequestPost(context) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (!context.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY secret is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }

  try {
    const incoming = await context.request.formData();
    const file = incoming.get('file');
    const language = incoming.get('language') || '';

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Audio file is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }

    const form = new FormData();
    form.append('file', file, file.name || 'audio.webm');
    form.append('model', 'gpt-4o-mini-transcribe');
    if (language) form.append('language', language);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${context.env.OPENAI_API_KEY}` },
      body: form
    });

    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json', ...cors }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Transcription failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
