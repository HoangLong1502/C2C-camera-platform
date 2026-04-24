import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ProductStatus } from '../entities/product.entity';
import { ChatService } from '../chat/chat.service';
import { getJwtUserId, type JwtAuthedRequest, type JwtOptionalRequest } from '../auth/types/jwt-user';

@Controller('products')
export class ProductsController {
    constructor(
        private productsService: ProductsService,
        private chatService: ChatService,
    ) { }

    @Get()
    findAll(
        @Query('category') category?: string,
        @Query('search') search?: string,
        @Query('status') status?: ProductStatus,
    ) {
        return this.productsService.findAll(category, search, status);
    }

    @UseGuards(JwtAuthGuard)
    @Get('seller/my-products')
    myProducts(@Req() req: JwtAuthedRequest) {
        const userId = getJwtUserId(req.user);
        return this.productsService.findByUser(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/stats')
    async getProductStats(@Param('id') id: string, @Req() req: JwtAuthedRequest) {
        const userId = getJwtUserId(req.user);
        const productId = +id;
        const product = await this.productsService.findOne(productId);
        if (!product || product.sellerId !== userId) {
            throw new HttpException('Chỉ chủ sản phẩm mới xem được thống kê', HttpStatus.FORBIDDEN);
        }
        const viewCount = await this.productsService.getViewCount(productId);
        const chattedUsers = await this.chatService.getRoomsByProduct(productId, userId);
        return { viewCount, chattedUsers };
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Post(':id/view')
    async recordView(@Param('id') id: string, @Req() req: JwtOptionalRequest) {
        const productId = +id;
        const userId = req.user?.userId ?? req.user?.sub ?? null;
        await this.productsService.recordView(productId, userId);
        return { ok: true };
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @Req() req: JwtOptionalRequest) {
        const user = req.user;
        const viewer = user
            ? { userId: user.userId ?? user.sub, isAdmin: user.role === UserRole.ADMIN }
            : undefined;
        return this.productsService.findOne(+id, viewer);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Req() req: JwtAuthedRequest, @Body() dto: CreateProductDto) {
        try {
            const userId = getJwtUserId(req.user);
            console.log('Create product request:', { userId, user: req.user, dto });
            const product = await this.productsService.create(userId, dto);
            return product;
        } catch (error: unknown) {
            console.error('Error in create product controller:', error);
            const err = error instanceof Error ? error : new Error(String(error));
            const ext = error as {
                code?: string;
                detail?: string;
                constraint?: string;
                table?: string;
                status?: number;
            };
            console.error('Error stack:', err.stack);
            console.error('Error details:', {
                message: err.message,
                code: ext.code,
                detail: ext.detail,
                constraint: ext.constraint,
                table: ext.table,
            });

            if (error instanceof HttpException) {
                throw error;
            }

            // Return more detailed error message
            const errorMessage = ext.detail || err.message || 'Failed to create product';
            throw new HttpException(
                { message: errorMessage, error: ext.code || 'INTERNAL_ERROR' },
                ext.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Req() req: JwtAuthedRequest, @Body() dto: UpdateProductDto) {
        const userId = getJwtUserId(req.user);
        return this.productsService.update(+id, userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: JwtAuthedRequest) {
        const userId = getJwtUserId(req.user);
        return this.productsService.remove(+id, userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: ProductStatus) {
        return this.productsService.updateStatus(+id, status);
    }
}
