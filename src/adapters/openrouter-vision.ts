import { tracing } from 'cloudflare:workers';
import type { Meld } from '../mahjong/types.ts';

interface VisionModel {
  recognize(image: string): Promise<Meld[]>;
}

const MODEL = 'google/gemini-3.6-flash';

const ALL_TILES = [
  ...['b', 'd', 'c'].flatMap(s => [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `${n}${s}`)),
  'Ew', 'Sw', 'Ww', 'Nw', 'Rd', 'Gd', 'Wd', 'F',
];

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    melds: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        required: ['type', 'tiles', 'concealed'],
        properties: {
          type: { type: 'string', enum: ['chow', 'pong', 'kong', 'pair', 'flower', 'orphans'] },
          tiles: { type: 'array', items: { type: 'string', enum: ALL_TILES }, maxItems: 14 },
          concealed: { type: 'boolean' },
          winTile: { type: 'string', enum: ALL_TILES },
        },
        additionalProperties: false,
      },
    },
  },
  required: ['melds'],
  additionalProperties: false,
};

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

Read carefully. If you are not confident what a tile is, leave it out of the meld rather than guessing.`;

export class OpenRouterVision implements VisionModel {
  constructor(private apiKey: string) {}

  async recognize(image: string): Promise<Meld[]> {
    const body = tracing.enterSpan('serializeRequest', () => JSON.stringify({
      model: MODEL,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'mahjong_hand', strict: true, schema: RESPONSE_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
    }));

    let resp: Response;
    try {
      resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
          'x-title': 'Mahjong Scorer',
        },
        body,
      });
    } catch {
      throw new Error('Could not reach the model provider');
    }

    if (!resp.ok) {
      const detail = (await resp.text().catch(() => '')).slice(0, 200);
      throw new Error(`Model provider error (${resp.status})${detail ? `: ${detail}` : ''}`);
    }

    const data = await tracing.enterSpan('readResponseBody', () =>
      resp.json() as Promise<{ choices?: { message?: { content?: string } }[] }>
    );
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from model');

    const parsed = JSON.parse(content) as { melds: Meld[] };
    return parsed.melds;
  }
}
