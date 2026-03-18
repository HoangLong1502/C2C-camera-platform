import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { ProductView } from '../entities/product-view.entity';
import { ChatModule } from '../chat/chat.module';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { AutoModerationService } from './auto-moderation.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, User, ProductView]),
        ChatModule,
        NotificationsModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService, OptionalJwtAuthGuard, AutoModerationService],
    exports: [ProductsService],
})
export class ProductsModule { }
