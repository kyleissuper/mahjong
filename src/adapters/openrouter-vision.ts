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
});

const HandSchema = z.object({
  melds: z.array(MeldSchema).max(8),
});

const PROMPT = `Identify the mahjong tiles. Return JSON: {melds: [{type, tiles, concealed}]}. Tiles: 1b-9b, 1d-9d, 1c-9c, Ew,Sw,Ww,Nw, Rd,Gd,Wd, F. Types: chow/pong/kong/pair/flower. Top half=exposed(concealed:false), bottom=concealed(concealed:true). Group by visual spacing. 3 identical=pong, 3 consecutive same suit=chow, 2 identical=pair.`;

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
        extra_body: {
          reasoning: { effort: 'minimal' },
          provider: { sort: 'latency', allow_fallbacks: true },
        },
      } as any) as z.infer<typeof HandSchema>;
      span.setAttribute('melds.count', result.melds.length);
      return result.melds as Meld[];
    });
  }
}
