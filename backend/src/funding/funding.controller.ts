import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { FundingService } from './funding.service';
import { CreateFundingEntryDto } from './dto';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';

@Controller('funding')
export class FundingController {
    constructor(private readonly fundingService: FundingService) { }

    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFundingEntryDto) {
        return this.fundingService.create(user.activeTeamId, dto);
    }

    @Get('category/:categoryId')
    findAllByCategory(@Param('categoryId') categoryId: string, @CurrentUser() user: AuthenticatedUser) {
        return this.fundingService.findAllByCategory(categoryId, user.activeTeamId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.fundingService.remove(id, user.activeTeamId);
    }
}
