import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Transaction } from './entities/transaction.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Review } from './entities/review.entity';
import { Payment } from './entities/payment.entity';
import { Notification } from './entities/notification.entity';
import { Promotion } from './entities/promotion.entity';
import { Dispute } from './entities/dispute.entity';
import { Subscription } from './entities/subscription.entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: parseInt(config.get<string>('DATABASE_PORT') || '5432', 10),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        entities: [
          User,
          Product,
          Category,
          Order,
          OrderItem,
          Transaction,
          ChatRoom,
          ChatMessage,
          Review,
          Payment,
          Notification,
          Promotion,
          Dispute,
          Subscription,
        ],
        synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in development only
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
