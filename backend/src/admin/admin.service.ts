import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { ProductStatus } from '../entities/product.entity';

export interface AdminDashboardStats {
  totalProducts: number;
  totalUsers: number;
  productsOnSale: number;
  productsContacted: number;
  pendingApproval: number;
  totalChatRooms: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ChatRoom)
    private chatRoomRepo: Repository<ChatRoom>,
  ) {}

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [totalProducts, totalUsers, productsOnSale, pendingApproval, totalChatRooms, contactedRaw] = await Promise.all([
      this.productRepo.count(),
      this.userRepo.count(),
      this.productRepo.count({ where: { status: ProductStatus.APPROVED } }),
      this.productRepo.count({ where: { status: ProductStatus.PENDING_APPROVAL } }),
      this.chatRoomRepo.count(),
      this.chatRoomRepo
        .createQueryBuilder('r')
        .select('COUNT(DISTINCT r.product_id)', 'count')
        .where('r.product_id IS NOT NULL')
        .getRawOne<{ count: string }>(),
    ]);

    const productsContacted = parseInt(contactedRaw?.count || '0', 10);

    return {
      totalProducts,
      totalUsers,
      productsOnSale,
      productsContacted,
      pendingApproval,
      totalChatRooms,
    };
  }
}
