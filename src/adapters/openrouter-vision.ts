import { tracing } from 'cloudflare:workers';
import Instructor from '@instructor-ai/instructor';
import OpenAI from 'openai';
import { z } from 'zod';
import type { Meld } from '../mahjong/types.ts';

interface VisionModel {
  recognize(image: string): Promise<Meld[]>;
}

const DEFAULT_MODEL = 'google/gemini-3.6-flash';

const ALL_TILES = [
  ...['b', 'd', 'c'].flatMap(s => [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `${n}${s}`)),
  'Ew', 'Sw', 'Ww', 'Nw', 'Rd', 'Gd', 'Wd', 'F',
] as unknown as [string, ...string[]];

const MeldSchema = z.object({
  type: z.enum(['chow', 'pong', 'kong', 'pair', 'flower', 'orphans']),
  tiles: z.array(z.enum(ALL_TILES)).max(14),
  concealed: z.boolean(),
  winTile: z.enum(ALL_TILES).optional(),
});

const HandSchema = z.object({
  melds: z.array(MeldSchema).max(8),
});

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
  private client: ReturnType<typeof Instructor>;

  constructor(private apiKey: string, private model = DEFAULT_MODEL) {
    const oai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: { 'x-title': 'Mahjong Scorer' },
    });
    this.client = Instructor({ client: oai, mode: 'JSON' });
  }

  async recognize(image: string): Promise<Meld[]> {
    return tracing.enterSpan('recognize', async (span) => {
      span.setAttribute('model', this.model);
      const result = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0,
        max_retries: 2,
        response_model: { schema: HandSchema, name: 'MahjongHand' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: image } },
          ],
        }],
      });
      span.setAttribute('melds.count', result.melds.length);
      return result.melds as Meld[];
    });
  }
}
