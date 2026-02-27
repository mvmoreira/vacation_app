import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';

@Controller('expenses')
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) { }

    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExpenseDto) {
        return this.expensesService.create(user.activeTeamId, dto);
    }

    @Get('category/:categoryId')
    findAllByCategory(@Param('categoryId') categoryId: string, @CurrentUser() user: AuthenticatedUser) {
        return this.expensesService.findAllByCategory(categoryId, user.activeTeamId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.expensesService.remove(id, user.activeTeamId);
    }
}
