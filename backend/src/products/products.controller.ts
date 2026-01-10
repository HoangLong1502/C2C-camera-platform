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
    create(@Req() req: Request & { user: any }, @Body() dto: CreateProductDto) {
        return this.productsService.create(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Req() req: Request & { user: any }, @Body() dto: UpdateProductDto) {
        return this.productsService.update(+id, req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: Request & { user: any }) {
        return this.productsService.remove(+id, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('seller/my-products')
    myProducts(@Req() req: Request & { user: any }) {
        return this.productsService.findByUser(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: ProductStatus) {
        return this.productsService.updateStatus(+id, status);
    }
}
