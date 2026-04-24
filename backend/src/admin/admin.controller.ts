import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { AdminService } from './admin.service';
import { ProductStatus } from '../entities/product.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('products/contacted')
  getContactedProducts() {
    return this.adminService.getContactedProducts();
  }

  @Get('products/moderation')
  getProductsForModeration(
    @Query('status') status?: string,
    @Query('autoApprovedOnly') autoApprovedOnly?: string,
  ) {
    const statusEnum = status ? (status as ProductStatus) : undefined;
    const autoOnly = autoApprovedOnly === 'true' || autoApprovedOnly === '1';
    return this.adminService.getProductsForModeration(statusEnum, autoOnly);
  }

  @Patch('products/:id/approve')
  approveProduct(
    @Param('id') id: string,
    @Body('adminFee') adminFee: number | undefined,
    @Req() req: { user: { userId: number } },
  ) {
    const adminId = req.user.userId;
    const fee = typeof adminFee === 'string' ? parseFloat(adminFee) : adminFee;
    return this.adminService.approveProduct(+id, adminId, fee);
  }

  @Patch('products/:id/reject')
  rejectProduct(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: { user: { userId: number } },
  ) {
    const adminId = req.user.userId;
    return this.adminService.rejectProduct(+id, adminId, reason ?? '');
  }
}
