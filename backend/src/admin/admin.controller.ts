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

  @Get('products/moderation')
  getProductsForModeration(@Query('status') status?: string) {
    const statusEnum = status ? (status as ProductStatus) : undefined;
    return this.adminService.getProductsForModeration(statusEnum);
  }

  @Patch('products/:id/approve')
  approveProduct(@Param('id') id: string, @Req() req: { user: { userId?: number; sub?: number } }) {
    const adminId = req.user?.userId ?? req.user?.sub;
    return this.adminService.approveProduct(+id, adminId);
  }

  @Patch('products/:id/reject')
  rejectProduct(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: { user: { userId?: number; sub?: number } },
  ) {
    const adminId = req.user?.userId ?? req.user?.sub;
    return this.adminService.rejectProduct(+id, adminId, reason ?? '');
  }
}
