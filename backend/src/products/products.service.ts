import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Product, ProductStatus, ProductCondition } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectDataSource()
        private dataSource: DataSource,
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
                status: ProductStatus.APPROVED, // Auto-approve products, moderation will be added later
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

    async findOne(id: number) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['seller'],
        });

        if (!product) {
            throw new NotFoundException('Product not found');
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

        Object.assign(product, dto);
        return this.productRepository.save(product);
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
