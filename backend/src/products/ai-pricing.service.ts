import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ProductCondition } from '../entities/product.entity';

export type AiPricingInput = {
  name: string;
  description: string;
  price: number;
  categoryId: number | null;
  condition: ProductCondition | string;
};

export type AiPricingResult = {
  reasonable: boolean;
  suggestedMinVnd: number;
  suggestedMaxVnd: number;
  summary: string;
  source: 'openrouter' | 'openai' | 'heuristic';
};

const CATEGORY_LABEL: Record<number, string> = {
  1: 'Máy ảnh (camera body)',
  2: 'Ống kính (lens)',
  3: 'Phụ kiện',
};

@Injectable()
export class AiPricingService {
  private readonly logger = new Logger(AiPricingService.name);

  constructor(private readonly config: ConfigService) {}

  async evaluatePricing(input: AiPricingInput): Promise<AiPricingResult> {
    const enabled = (this.config.get<string>('AI_PRICING_ENABLED') ?? 'true').toLowerCase() === 'true';
    const openrouterKey = this.config.get<string>('OPENROUTER_API_KEY')?.trim();
    const openaiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();

    if (enabled && openrouterKey) {
      try {
        const referer =
          this.config.get<string>('OPENROUTER_HTTP_REFERER')?.trim() ||
          this.config.get<string>('FRONTEND_URL')?.split(',')[0]?.trim() ||
          this.config.get<string>('BACKEND_PUBLIC_URL')?.trim() ||
          'http://localhost:3002';
        const title = this.config.get<string>('OPENROUTER_APP_TITLE')?.trim() || 'C2C Camera pricing';
        const url =
          this.config.get<string>('OPENROUTER_API_URL')?.trim() ||
          'https://openrouter.ai/api/v1/chat/completions';
        const model =
          this.config.get<string>('OPENROUTER_PRICING_MODEL')?.trim() ||
          this.config.get<string>('OPENAI_PRICING_MODEL')?.trim() ||
          'openai/gpt-4o-mini';

        return await this.evaluateWithChatCompletions(input, {
          url,
          apiKey: openrouterKey,
          model,
          source: 'openrouter',
          extraHeaders: {
            'HTTP-Referer': referer,
            'X-Title': title,
          },
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`OpenRouter pricing failed, using heuristic: ${msg}`);
      }
    }

    if (enabled && openaiKey) {
      try {
        const model = this.config.get<string>('OPENAI_PRICING_MODEL')?.trim() || 'gpt-4o-mini';
        return await this.evaluateWithChatCompletions(input, {
          url: 'https://api.openai.com/v1/chat/completions',
          apiKey: openaiKey,
          model,
          source: 'openai',
          extraHeaders: {},
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`OpenAI pricing failed, using heuristic: ${msg}`);
      }
    }

    return this.evaluateHeuristic(input);
  }

  private async evaluateWithChatCompletions(
    input: AiPricingInput,
    opts: {
      url: string;
      apiKey: string;
      model: string;
      source: 'openrouter' | 'openai';
      extraHeaders: Record<string, string>;
    },
  ): Promise<AiPricingResult> {
    const model = opts.model;
    const categoryLabel =
      input.categoryId && CATEGORY_LABEL[input.categoryId]
        ? CATEGORY_LABEL[input.categoryId]
        : `Danh mục id ${input.categoryId ?? 'không rõ'}`;

    const prompt = `Bạn là chuyên gia định giá thiết bị chụp ảnh tại thị trường Việt Nam (C2C, đồng VND).
Đánh giá giá người bán đưa ra có hợp lý so với mô tả hay không (không cần chính xác từng đồng, chỉ cần mức độ hợp lý).

Thông tin:
- Danh mục: ${categoryLabel}
- Tình trạng: ${input.condition}
- Tên: ${input.name}
- Mô tả: ${input.description.slice(0, 2000)}
- Giá đăng (VND): ${Math.round(input.price)}

Trả về JSON thuần (không markdown), schema:
{"reasonable":boolean,"suggestedMinVnd":number,"suggestedMaxVnd":number,"shortReasonVi":"string tối đa 240 ký tự tiếng Việt"}
- reasonable=true nếu giá nằm trong khoảng hợp lý theo mô tả/thị trường VN; false nếu quá thấp bất thường hoặc quá cao ảo so với mô tả.
- suggestedMinVnd/suggestedMaxVnd: khoảng giá tham khảo VND (số nguyên).`;

    const useJsonObject =
      (this.config.get<string>('AI_PRICING_JSON_OBJECT') ?? 'true').toLowerCase() === 'true';

    const body: Record<string, unknown> = {
      model,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    };
    if (useJsonObject) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(opts.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
        ...opts.extraHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty LLM response');

    let parsed: {
      reasonable?: boolean;
      suggestedMinVnd?: number;
      suggestedMaxVnd?: number;
      shortReasonVi?: string;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Invalid JSON from LLM');
    }

    const reasonable = Boolean(parsed.reasonable);
    const min = Math.max(0, Math.round(Number(parsed.suggestedMinVnd) || 0));
    const max = Math.max(min, Math.round(Number(parsed.suggestedMaxVnd) || 0));
    const summary = (parsed.shortReasonVi ?? '').toString().slice(0, 280);

    return {
      reasonable,
      suggestedMinVnd: min,
      suggestedMaxVnd: max,
      summary: summary || (reasonable ? 'AI: Giá trong khoảng hợp lý.' : 'AI: Giá chưa hợp lý so với mô tả.'),
      source: opts.source,
    };
  }

  /** Đơn giản, không gọi mạng — dùng khi không có API key hoặc OpenAI lỗi */
  private evaluateHeuristic(input: AiPricingInput): AiPricingResult {
    const price = Number(input.price);
    const cid = Number(input.categoryId) || 0;
    const text = `${input.name} ${input.description}`.toLowerCase();

    let min = 100_000;
    let max = 200_000_000;

    if (cid === 1) {
      min = 400_000;
      max = 250_000_000;
      if (/instax|polaroid/i.test(text)) {
        min = 150_000;
        max = 12_000_000;
      }
    } else if (cid === 2) {
      min = 200_000;
      max = 100_000_000;
    } else if (cid === 3) {
      min = 30_000;
      max = 50_000_000;
    } else {
      min = 50_000;
      max = 500_000_000;
    }

    const cond = String(input.condition).toLowerCase();
    if (cond === 'damaged' || cond === 'old') {
      max = Math.round(max * 0.55);
    }

    const inBand = Number.isFinite(price) && price >= min && price <= max;
    const summary = inBand
      ? `Heuristic: Giá ${price.toLocaleString('vi-VN')}₫ nằm trong khoảng tham khảo ${min.toLocaleString('vi-VN')}–${max.toLocaleString('vi-VN')}₫.`
      : `Heuristic: Giá ${price.toLocaleString('vi-VN')}₫ ngoài khoảng tham khảo ${min.toLocaleString('vi-VN')}–${max.toLocaleString('vi-VN')}₫ (theo danh mục/tình trạng).`;

    return {
      reasonable: inBand,
      suggestedMinVnd: min,
      suggestedMaxVnd: max,
      summary,
      source: 'heuristic',
    };
  }
}
