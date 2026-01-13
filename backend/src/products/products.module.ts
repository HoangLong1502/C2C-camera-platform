import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Product, User])],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService],
})
export class ProductsModule { }
