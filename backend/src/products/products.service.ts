import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Product, ProductStatus, ProductCondition } from '../entities/product.entity';
import { ProductView } from '../entities/product-view.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { User } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AutoModerationService } from './auto-moderation.service';
import { AiPricingService } from './ai-pricing.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(ProductView)
        private productViewRepository: Repository<ProductView>,
        @InjectDataSource()
        private dataSource: DataSource,
        private notificationsService: NotificationsService,
        private autoModerationService: AutoModerationService,
        private aiPricingService: AiPricingService,
    ) { }

    async create(userId: number, dto: CreateProductDto) {
        try {
            console.log('Creating product with:', { userId, dto });
            console.log('DTO type check:', {
                name: typeof dto.name,
                description: typeof dto.description,
                price: typeof dto.price,
                condition: typeof dto.condition,
                stock: typeof dto.stock,
                images: Array.isArray(dto.images) ? `array[${dto.images.length}]` : typeof dto.images,
            });
            
            // Verify user exists
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new BadRequestException(`User with ID ${userId} not found`);
            }
            console.log('User verified:', user.id, user.email);

            // Condition is required and must be valid enum value
            if (!dto.condition || !Object.values(ProductCondition).includes(dto.condition as ProductCondition)) {
                throw new BadRequestException('Độ mới là bắt buộc và phải là một trong: đã qua sử dụng, mới, như mới, cũ, nát');
            }
            const condition = dto.condition as ProductCondition;

            // Format images for jsonb (TypeORM jsonb stores as JSON array)
            let imagesFormatted: string[] | null = null;
            if (dto.images && Array.isArray(dto.images) && dto.images.length > 0) {
                // Filter out empty strings and ensure all are strings
                // Also validate base64 format
                imagesFormatted = dto.images.filter(img => {
                    if (!img || typeof img !== 'string' || img.trim().length === 0) {
                        return false;
                    }
                    // Validate base64 data URL format
                    const isValid = img.startsWith('data:image') && img.includes('base64,');
                    if (!isValid) {
                        console.warn('Invalid image format detected:', img.substring(0, 100));
                    }
                    return isValid;
                });
                
                if (imagesFormatted.length === 0) {
                    imagesFormatted = null;
                } else {
                    // Log image lengths to detect truncation
                    imagesFormatted.forEach((img, index) => {
                        console.log(`Image ${index + 1} length:`, img.length, 'Preview:', img.substring(0, 50));
                    });
                }
            }

            // Prepare product data
            const productData: any = {
                name: dto.name.trim(),
                description: dto.description.trim(),
                price: Number(dto.price),
                condition: condition as ProductCondition,
                stock: dto.stock ? Number(dto.stock) : 1,
                sellerId: Number(userId),
                status: ProductStatus.PENDING_APPROVAL,
            };

            // Location is required
            if (!dto.location || !dto.location.trim()) {
                throw new BadRequestException('Địa điểm là bắt buộc');
            }
            productData.location = dto.location.trim();
            // Category is required
            if (!dto.categoryId) {
                throw new BadRequestException('Loại sản phẩm là bắt buộc');
            }
            productData.categoryId = Number(dto.categoryId);
            if (imagesFormatted && imagesFormatted.length > 0) {
                productData.images = imagesFormatted;
                console.log('Images to save:', {
                    count: imagesFormatted.length,
                    firstImageLength: imagesFormatted[0]?.length || 0,
                    firstImagePreview: imagesFormatted[0]?.substring(0, 100) || 'N/A'
                });
            } else {
                console.log('No images to save');
            }

            console.log('Product data to save:', productData);
            
            // Save product using raw query to ensure proper jsonb serialization for images
            let savedProduct: Product;
            if (imagesFormatted && imagesFormatted.length > 0) {
                // Use raw query to insert with proper jsonb handling
                const result = await this.dataSource.query(
                    `INSERT INTO products (name, description, price, condition, stock, seller_id, status, category_id, location, images, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                     RETURNING *`,
                    [
                        productData.name,
                        productData.description,
                        productData.price,
                        productData.condition,
                        productData.stock,
                        productData.sellerId,
                        productData.status,
                        productData.categoryId || null,
                        productData.location || null,
                        JSON.stringify(imagesFormatted), // Explicitly stringify for jsonb
                    ]
                );
                
                // Convert raw result to Product entity
                const foundProduct = await this.productRepository.findOne({ where: { id: result[0].id } });
                if (!foundProduct) {
                    throw new Error('Failed to load saved product');
                }
                savedProduct = foundProduct;
            } else {
                const product = this.productRepository.create(productData);
                const saved = await this.productRepository.save(product);
                // TypeORM save() can return Product or Product[], ensure it's a single Product
                savedProduct = Array.isArray(saved) ? saved[0] : saved;
            }
            
            // Ensure we have a single Product
            const productResult = savedProduct;
            console.log('Product created successfully:', productResult.id);
            const imagesForLog = productResult.images as string[] | string | null | undefined;
            
            // Validate saved images
            if (imagesForLog) {
                if (Array.isArray(imagesForLog)) {
                    imagesForLog.forEach((img, index) => {
                        if (typeof img === 'string') {
                            console.log(`Saved image ${index + 1}:`, {
                                length: img.length,
                                preview: img.substring(0, 100),
                                isValid: img.startsWith('data:image') && img.includes('base64,'),
                                isTruncated: img.length < 100 // Base64 images should be much longer
                            });
                        }
                    });
                } else if (typeof imagesForLog === 'string') {
                    console.log('Saved image (string):', {
                        length: imagesForLog.length,
                        preview: imagesForLog.substring(0, 100),
                        isValid: imagesForLog.startsWith('data:image') && imagesForLog.includes('base64,')
                    });
                }
            }
            
            console.log('Saved product images summary:', {
                images: imagesForLog,
                imagesType: typeof imagesForLog,
                isArray: Array.isArray(imagesForLog),
                imagesLength: typeof imagesForLog === 'string' ? imagesForLog.length : Array.isArray(imagesForLog) ? imagesForLog.length : 'N/A'
            });
            // Auto-moderation (AI free) -> may auto-approve/publish
            const autoApproveEnabled = (process.env.AUTO_APPROVE_ENABLED ?? 'true').toLowerCase() === 'true';
            const result = this.autoModerationService.evaluate({
                name: productResult.name,
                description: productResult.description,
                price: Number(productResult.price),
                location: productResult.location,
                categoryId: productResult.categoryId,
                condition: productResult.condition,
                stock: productResult.stock,
                imagesCount: Array.isArray(productResult.images) ? productResult.images.length : 0,
            });

            const pricing = await this.aiPricingService.evaluatePricing({
                name: productResult.name,
                description: productResult.description,
                price: Number(productResult.price),
                categoryId: productResult.categoryId ?? null,
                condition: productResult.condition,
            });

            const moderationIssues = [
                ...result.issues,
                {
                    code: 'ai_pricing',
                    message: `[${pricing.source}] ${pricing.summary} (tham khảo ${pricing.suggestedMinVnd.toLocaleString('vi-VN')}–${pricing.suggestedMaxVnd.toLocaleString('vi-VN')}₫)`,
                },
            ];
            if (!pricing.reasonable) {
                moderationIssues.push({
                    code: 'price_unreasonable',
                    message: 'Giá chưa được hệ thống định giá chấp nhận để tự động đăng bài.',
                });
            }

            productResult.moderationScore = result.score;
            productResult.moderationIssues = moderationIssues.length ? moderationIssues : null;

            // Mặc định: vừa pass moderation rule vừa AI thấy giá hợp lý.
            // Đặt AUTO_PUBLISH_STRICT_MODERATION=false → chỉ cần AI định giá hợp lý (+ AUTO_APPROVE_ENABLED) là tự publish.
            const strictModeration =
                (process.env.AUTO_PUBLISH_STRICT_MODERATION ?? 'true').toLowerCase() === 'true';
            const canAutoPublish =
                autoApproveEnabled &&
                pricing.reasonable &&
                (!strictModeration || result.passed);

            if (canAutoPublish) {
                productResult.status = ProductStatus.APPROVED;
                productResult.approvedAt = new Date();
                productResult.approvedBy = null;
                productResult.autoApproved = true;
                productResult.adminComment = null;
                await this.productRepository.save(productResult);
                await this.notificationsService.create(
                    productResult.sellerId,
                    'product_approved',
                    'Bài đăng đã được duyệt',
                    'Bài đăng của bạn đã được hệ thống kiểm tra và được tự động duyệt.',
                    `/products/${productResult.id}`,
                );
            } else {
                // Persist moderation feedback for admin/seller to improve listing
                productResult.autoApproved = false;
                await this.productRepository.save(productResult);
            }

            return productResult;
        } catch (error: any) {
            console.error('Error creating product:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                constraint: error.constraint,
                table: error.table,
            });
            throw error;
        }
    }

    async findAll(category?: string, search?: string, status?: ProductStatus) {
        const query = this.productRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.seller', 'seller');

        if (!status) {
            query.where('product.status = :status', { status: ProductStatus.APPROVED });
        } else {
            query.where('product.status = :status', { status });
        }

        if (category) {
            query.andWhere('product.categoryId = :category', { category });
        }

        if (search) {
            query.andWhere(
                '(product.name ILIKE :search OR product.description ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        query.orderBy('product.createdAt', 'DESC');

        const products = await query.getMany();
        
        // Process images - jsonb returns array directly
        const processedProducts = products.map(product => {
            let processedImages: string[] | null = null;
            
            const imagesValue = product.images as string[] | string | null | undefined;
            
            if (imagesValue) {
                if (Array.isArray(imagesValue)) {
                    // jsonb returns array directly
                    processedImages = imagesValue.filter((img: any) => 
                        img && typeof img === 'string' && img.trim().length > 0
                    );
                } else if (typeof imagesValue === 'string' && imagesValue.trim()) {
                    // Fallback: if somehow it's a string, try to parse as JSON
                    try {
                        const parsed = JSON.parse(imagesValue);
                        if (Array.isArray(parsed)) {
                            processedImages = parsed.filter((img: any) => 
                                img && typeof img === 'string' && img.trim().length > 0
                            );
                        }
                    } catch (e) {
                        // If not JSON, treat as comma-separated (legacy format)
                        processedImages = imagesValue.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0);
                    }
                }
                
                // Log first product's images for debugging
                if (product.id === products[0]?.id) {
                    console.log('Processing images for product', product.id, {
                        originalType: typeof imagesValue,
                        isArray: Array.isArray(imagesValue),
                        processedCount: processedImages?.length || 0,
                        firstImagePreview: processedImages?.[0]?.substring(0, 100) || 'N/A'
                    });
                }
            }
            
            return {
                ...product,
                images: processedImages && processedImages.length > 0 ? processedImages : null,
            };
        });
        
        return processedProducts;
    }

    async findOne(id: number, viewer?: { userId?: number; isAdmin?: boolean }) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['seller'],
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Non-approved products: only seller or admin can view
        if (product.status !== ProductStatus.APPROVED) {
            const isOwner = viewer?.userId != null && product.sellerId === viewer.userId;
            const isAdmin = viewer?.isAdmin === true;
            if (!isOwner && !isAdmin) {
                throw new NotFoundException('Product not found');
            }
        }

        // Increment view count
        await this.productRepository.increment({ id }, 'views', 1);

        // Process images - jsonb returns array directly
        let processedImages: string[] | null = null;
        
        const imagesValue = product.images as string[] | string | null | undefined;
        
        if (imagesValue) {
            if (Array.isArray(imagesValue)) {
                // jsonb returns array directly
                processedImages = imagesValue.filter((img: any) => 
                    img && typeof img === 'string' && img.trim().length > 0
                );
            } else if (typeof imagesValue === 'string' && imagesValue.trim()) {
                // Fallback: if somehow it's a string, try to parse as JSON
                try {
                    const parsed = JSON.parse(imagesValue);
                    if (Array.isArray(parsed)) {
                        processedImages = parsed.filter((img: any) => 
                            img && typeof img === 'string' && img.trim().length > 0
                        );
                    }
                } catch (e) {
                    // If not JSON, treat as comma-separated (legacy format)
                    processedImages = imagesValue.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0);
                }
            }
            
            console.log('Processing images for product detail', id, {
                originalType: typeof imagesValue,
                isArray: Array.isArray(imagesValue),
                processedCount: processedImages?.length || 0,
                firstImagePreview: processedImages?.[0]?.substring(0, 100) || 'N/A'
            });
        } else {
            console.log('No images for product', id);
        }
        
        return {
            ...product,
            images: processedImages && processedImages.length > 0 ? processedImages : null,
        };
    }

    async findByUser(sellerId: number) {
        const products = await this.productRepository.find({
            where: { sellerId },
            order: { createdAt: 'DESC' },
        });
        
        // Process images - jsonb returns array directly
        return products.map(product => {
            let processedImages: string[] | null = null;
            
            const imagesValue = product.images as string[] | string | null | undefined;
            
            if (imagesValue) {
                if (Array.isArray(imagesValue)) {
                    // jsonb returns array directly
                    processedImages = imagesValue.filter((img: any) => 
                        img && typeof img === 'string' && img.trim().length > 0
                    );
                } else if (typeof imagesValue === 'string' && imagesValue.trim()) {
                    // Fallback: if somehow it's a string, try to parse as JSON
                    try {
                        const parsed = JSON.parse(imagesValue);
                        if (Array.isArray(parsed)) {
                            processedImages = parsed.filter((img: any) => 
                                img && typeof img === 'string' && img.trim().length > 0
                            );
                        }
                    } catch (e) {
                        // If not JSON, treat as comma-separated (legacy format)
                        processedImages = imagesValue.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0);
                    }
                }
            }
            
            return {
                ...product,
                images: processedImages && processedImages.length > 0 ? processedImages : null,
            };
        });
    }

    async update(id: number, userId: number, dto: UpdateProductDto) {
        const product = await this.productRepository.findOne({ where: { id } });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (product.sellerId !== userId) {
            throw new ForbiddenException('You can only update your own products');
        }

        // When resubmitting after reject: clear admin fields and set back to pending
        if (product.status === ProductStatus.REJECTED) {
            product.status = ProductStatus.PENDING_APPROVAL;
            product.adminComment = null;
            product.approvedAt = null;
            product.approvedBy = null;
        }

        Object.assign(product, dto);
        const saved = await this.productRepository.save(product);

        // If product is pending (new or re-submitted), attempt auto-approve again
        if (saved.status === ProductStatus.PENDING_APPROVAL) {
            const autoApproveEnabled = (process.env.AUTO_APPROVE_ENABLED ?? 'true').toLowerCase() === 'true';
            const result = this.autoModerationService.evaluate({
                name: saved.name,
                description: saved.description,
                price: Number(saved.price),
                location: saved.location,
                categoryId: saved.categoryId,
                condition: saved.condition,
                stock: saved.stock,
                imagesCount: Array.isArray(saved.images) ? saved.images.length : 0,
            });

            saved.moderationScore = result.score;
            saved.moderationIssues = result.issues.length ? result.issues : null;

            if (autoApproveEnabled && result.passed) {
                saved.status = ProductStatus.APPROVED;
                saved.approvedAt = new Date();
                saved.approvedBy = null;
                saved.autoApproved = true;
                saved.adminComment = null;
                await this.productRepository.save(saved);
                await this.notificationsService.create(
                    saved.sellerId,
                    'product_approved',
                    'Bài đăng đã được duyệt',
                    'Bài đăng của bạn đã được hệ thống kiểm tra và được tự động duyệt.',
                    `/products/${saved.id}`,
                );
            } else {
                saved.autoApproved = false;
                await this.productRepository.save(saved);
            }
        }

        return saved;
    }

    async remove(id: number, userId: number) {
        const product = await this.productRepository.findOne({ where: { id } });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (product.sellerId !== userId) {
            throw new ForbiddenException('You can only delete your own products');
        }

        await this.productRepository.remove(product);
        return { message: 'Product deleted successfully' };
    }

    async recordView(productId: number, userId: number | null) {
        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (!product) return;
        if (userId !== null) {
            await this.productViewRepository.upsert(
                { productId, userId, viewedAt: new Date() },
                { conflictPaths: ['productId', 'userId'] },
            );
        }
    }

    async getViewCount(productId: number): Promise<number> {
        const result = await this.productViewRepository
            .createQueryBuilder('v')
            .where('v.product_id = :productId', { productId })
            .select('COUNT(DISTINCT v.user_id)', 'count')
            .getRawOne<{ count: string }>();
        return parseInt(result?.count || '0', 10);
    }

    // Admin methods
    async updateStatus(id: number, status: ProductStatus) {
        const product = await this.productRepository.findOne({ where: { id } });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        product.status = status;
        return this.productRepository.save(product);
    }
}
