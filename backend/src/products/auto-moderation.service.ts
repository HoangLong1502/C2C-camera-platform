import { Injectable } from '@nestjs/common';
import { ProductCondition } from '../entities/product.entity';

export type ModerationIssue = { code: string; message: string };

export type ModerationResult = {
  score: number; // 0..100
  passed: boolean;
  issues: ModerationIssue[];
};

@Injectable()
export class AutoModerationService {
  evaluate(input: {
    name?: string;
    description?: string;
    price?: number;
    location?: string;
    categoryId?: number;
    condition?: ProductCondition | string;
    stock?: number;
    imagesCount?: number;
  }): ModerationResult {
    const issues: ModerationIssue[] = [];

    const name = (input.name ?? '').trim();
    const description = (input.description ?? '').trim();
    const location = (input.location ?? '').trim();
    const price = typeof input.price === 'number' ? input.price : Number(input.price ?? 0);
    const stock = typeof input.stock === 'number' ? input.stock : Number(input.stock ?? 0);
    const imagesCount = typeof input.imagesCount === 'number' ? input.imagesCount : 0;
    const categoryId = typeof input.categoryId === 'number' ? input.categoryId : Number(input.categoryId ?? 0);
    const condition = (input.condition ?? '').toString();

    // Hard requirements (if missing -> fail)
    if (name.length < 6) issues.push({ code: 'name_short', message: 'Tên sản phẩm quá ngắn (>= 6 ký tự).' });
    if (description.length < 80) issues.push({ code: 'description_short', message: 'Mô tả chưa đủ chi tiết (>= 80 ký tự).' });
    if (!Number.isFinite(price) || price <= 0) issues.push({ code: 'price_invalid', message: 'Giá phải lớn hơn 0.' });
    if (location.length < 3) issues.push({ code: 'location_missing', message: 'Thiếu địa điểm (>= 3 ký tự).' });
    if (!Number.isFinite(categoryId) || categoryId <= 0) issues.push({ code: 'category_missing', message: 'Thiếu loại sản phẩm.' });
    if (imagesCount <= 0) issues.push({ code: 'images_missing', message: 'Cần ít nhất 1 hình ảnh.' });
    if (!Object.values(ProductCondition).includes(condition as ProductCondition)) {
      issues.push({ code: 'condition_invalid', message: 'Độ mới không hợp lệ.' });
    }

    // Scoring (soft boosts)
    let score = 0;
    score += Math.min(20, Math.floor(name.length / 3)); // up to 20
    score += Math.min(35, Math.floor(description.length / 10)); // up to 35
    score += imagesCount > 0 ? Math.min(25, 10 + imagesCount * 5) : 0; // 1 img = 15, 3 img = 25
    score += location.length >= 6 ? 10 : location.length >= 3 ? 6 : 0;
    score += Number.isFinite(stock) && stock > 0 ? 5 : 0;
    score += Number.isFinite(price) && price >= 50000 ? 5 : 2; // discourage tiny/invalid

    score = Math.max(0, Math.min(100, score));

    // Pass criteria: no hard issues and score threshold
    const hardOk = issues.length === 0;
    const passed = hardOk && score >= 70;

    return { score, passed, issues };
  }
}

