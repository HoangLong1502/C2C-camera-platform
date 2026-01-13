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
    Request,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ProductStatus } from '../entities/product.entity';

@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService) { }

    @Get()
    findAll(
        @Query('category') category?: string,
        @Query('search') search?: string,
        @Query('status') status?: ProductStatus,
    ) {
        return this.productsService.findAll(category, search, status);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Req() req: Request & { user: any }, @Body() dto: CreateProductDto) {
        try {
            const userId = req.user.userId || req.user.sub;
            console.log('Create product request:', { userId, user: req.user, dto });
            const product = await this.productsService.create(userId, dto);
            return product;
        } catch (error: any) {
            console.error('Error in create product controller:', error);
            console.error('Error stack:', error.stack);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                constraint: error.constraint,
                table: error.table,
            });
            
            // Return more detailed error message
            const errorMessage = error.detail || error.message || 'Failed to create product';
            throw new HttpException(
                { message: errorMessage, error: error.code || 'INTERNAL_ERROR' },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Req() req: Request & { user: any }, @Body() dto: UpdateProductDto) {
        const userId = req.user.userId || req.user.sub;
        return this.productsService.update(+id, userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: Request & { user: any }) {
        const userId = req.user.userId || req.user.sub;
        return this.productsService.remove(+id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('seller/my-products')
    myProducts(@Req() req: Request & { user: any }) {
        const userId = req.user.userId || req.user.sub;
        return this.productsService.findByUser(userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: ProductStatus) {
        return this.productsService.updateStatus(+id, status);
    }
}
