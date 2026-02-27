import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
        return this.categoriesService.create(user.activeTeamId, dto);
    }

    @Get('trip/:tripId')
    findAllByTrip(@Param('tripId') tripId: string, @CurrentUser() user: AuthenticatedUser) {
        return this.categoriesService.findAllByTrip(tripId, user.activeTeamId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.categoriesService.findOne(id, user.activeTeamId);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: UpdateCategoryDto,
    ) {
        return this.categoriesService.update(id, user.activeTeamId, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.categoriesService.remove(id, user.activeTeamId);
    }
}
