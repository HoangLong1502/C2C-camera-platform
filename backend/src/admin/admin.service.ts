import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { ProductStatus } from '../entities/product.entity';
import { NotificationsService } from '../notifications/notifications.service';

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
    private notificationsService: NotificationsService,
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

  async getProductsForModeration(status?: ProductStatus) {
    const where = status != null ? { status } : {};
    return this.productRepo.find({
      where,
      relations: ['seller'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveProduct(id: number, adminUserId: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['seller'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== ProductStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Chỉ có thể duyệt bài đang chờ kiểm duyệt.');
    }
    product.status = ProductStatus.APPROVED;
    product.approvedAt = new Date();
    product.approvedBy = adminUserId;
    product.adminComment = null;
    await this.productRepo.save(product);
    await this.notificationsService.create(
      product.sellerId,
      'product_approved',
      'Bài đăng đã được duyệt',
      'Bài đăng của bạn đã được kiểm duyệt và đã được hiển thị công khai.',
      `/products/${product.id}`,
    );
    return product;
  }

  async rejectProduct(id: number, adminUserId: number, reason: string) {
    const trimmed = reason?.trim();
    if (!trimmed) throw new BadRequestException('Vui lòng nhập lý do từ chối.');
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['seller'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== ProductStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Chỉ có thể từ chối bài đang chờ kiểm duyệt.');
    }
    product.status = ProductStatus.REJECTED;
    product.approvedAt = null;
    product.approvedBy = adminUserId;
    product.adminComment = trimmed;
    await this.productRepo.save(product);
    await this.notificationsService.create(
      product.sellerId,
      'product_rejected',
      'Bài đăng bị từ chối',
      `Bài đăng của bạn đã bị từ chối. Lý do: ${trimmed}`,
      `/my-products`,
    );
    return product;
  }
}
