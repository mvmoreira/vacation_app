import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SavingsService } from './savings.service';
import { CreateSavingsEntryDto } from './dto';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';

@Controller('savings')
export class SavingsController {
    constructor(private readonly savingsService: SavingsService) { }

    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSavingsEntryDto) {
        return this.savingsService.create(user.activeTeamId, dto);
    }

    @Get('category/:categoryId')
    findAllByCategory(@Param('categoryId') categoryId: string, @CurrentUser() user: AuthenticatedUser) {
        return this.savingsService.findAllByCategory(categoryId, user.activeTeamId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.savingsService.remove(id, user.activeTeamId);
    }
}
