// Cloudflare Worker: serves the static app and hosts the tile-recognition API.
//
// Only /api/* is routed here (see run_worker_first in wrangler.jsonc); every
// other request is served directly from static assets. The OpenRouter key lives
// in env (a Worker secret) and never reaches the browser.
//
// The prompt and model call live here (plumbing); the defensive parsing of the
// model's reply lives in ../src/scan.ts (pure + unit-tested).

import { parseScanResponse } from '../src/scan.js';

interface Env {
  OPENROUTER_API_KEY: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const MODEL = 'qwen/qwen3-vl-235b-a22b-instruct';

const PROMPT = `You are reading a photo of a winning Hong Kong mahjong hand and transcribing it into structured melds.

Tile notation:
- bamboo 1b..9b, dots/circles 1d..9d, characters(wan) 1c..9c
- winds Ew(east) Sw(south) Ww(west) Nw(north)
- dragons Rd(red) Gd(green) Wd(white)
- flower F

Meld types:
- "chow": 3 consecutive tiles, same suit (e.g. 1c 2c 3c)
- "pong": 3 identical tiles
- "kong": 4 identical tiles
- "pair": 2 identical tiles
- "flower": one or more F tiles
- "orphans": the special 13-orphans hand

Layout conventions (use them, but trust what you actually see):
- Tiles in the TOP HALF of the image are exposed melds -> concealed = false.
- Tiles in the BOTTOM HALF of the image are concealed -> concealed = true.
- Exactly ONE tile in the whole hand is the winning tile: the single tile is often rotated sideways. Set "winTile" ONLY on the one meld that contains it, and OMIT "winTile" on every other meld.
- Group tiles into melds using the visual spacing between groups.
- A "pair" is exactly 2 identical tiles. Three identical tiles are a "pong", never a "chow"; a "chow" is 3 different consecutive tiles. Count the tiles in each group carefully.

Read carefully. If you are not confident what a tile is, use "unknown" for that tile rather than guessing.

Respond with ONLY this JSON, no prose:
{"melds":[{"type":"chow","tiles":["1c","2c","3c"],"concealed":false,"winTile":"2c"}]}`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Send the image to the model and return its raw text reply. Throws with a
// client-safe message.
async function callModel(image: string, apiKey: string): Promise<string> {
  let resp: Response;
  try {
    resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'x-title': 'Mahjong Scorer',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
      }),
    });
  } catch {
    throw new Error('Could not reach the model provider');
  }

  if (!resp.ok) {
    const detail = (await resp.text().catch(() => '')).slice(0, 200);
    throw new Error(`Model provider error (${resp.status})${detail ? `: ${detail}` : ''}`);
  }

  const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from model');
  return content;
}

async function recognize(request: Request, env: Env): Promise<Response> {
  if (!env.OPENROUTER_API_KEY) {
    return json({ error: 'Server is missing OPENROUTER_API_KEY' }, 500);
  }

  let body: { image?: unknown };
  try {
    body = (await request.json()) as { image?: unknown };
  } catch {
    return json({ error: 'Body must be JSON: { image: "data:image/...;base64,..." }' }, 400);
  }
  if (typeof body.image !== 'string' || !body.image.startsWith('data:image/')) {
    return json({ error: 'image must be a data URL' }, 400);
  }

  let content: string;
  try {
    content = await callModel(body.image, env.OPENROUTER_API_KEY);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Model request failed' }, 502);
  }

  try {
    return json({ melds: parseScanResponse(content) });
  } catch {
    return json({ error: 'Could not parse tiles from the model response' }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/recognize') {
      if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
      return recognize(request, env);
    }
    if (pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);

    // Everything else: static assets (only reached if routed here).
    return env.ASSETS.fetch(request);
  },
};
