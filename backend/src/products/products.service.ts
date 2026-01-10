import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    async create(userId: number, dto: CreateProductDto) {
        const product = this.productRepository.create({
            ...dto,
            sellerId: userId,
            status: ProductStatus.PENDING_APPROVAL,
        });

        return this.productRepository.save(product);
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

        return query.getMany();
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

        return product;
    }

    async findByUser(sellerId: number) {
        return this.productRepository.find({
            where: { sellerId },
            order: { createdAt: 'DESC' },
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
