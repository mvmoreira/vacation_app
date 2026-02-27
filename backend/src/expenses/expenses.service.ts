import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto';

@Injectable()
export class ExpensesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(teamId: string, dto: CreateExpenseDto) {
        const category = await this.prisma.category.findFirst({
            where: { id: dto.categoryId, teamId },
            include: { trip: true },
        });

        if (!category) throw new NotFoundException('Category not found');
        if (category.trip.status !== 'ACTIVE') {
            throw new BadRequestException('Expenses can only be added during the ACTIVE phase');
        }

        return this.prisma.expense.create({
            data: {
                teamId,
                categoryId: dto.categoryId,
                personId: dto.personId,
                amount: dto.amount,
                date: new Date(dto.date),
                description: dto.description,
            },
            include: { person: true },
        });
    }

    async findAllByCategory(categoryId: string, teamId: string) {
        const category = await this.prisma.category.findFirst({ where: { id: categoryId, teamId } });
        if (!category) throw new NotFoundException('Category not found');

        return this.prisma.expense.findMany({
            where: { categoryId },
            include: { person: true },
            orderBy: { date: 'desc' },
        });
    }

    async remove(id: string, teamId: string) {
        const expense = await this.prisma.expense.findFirst({ where: { id, teamId } });
        if (!expense) throw new NotFoundException('Expense not found');

        await this.prisma.expense.delete({ where: { id } });
        return { message: 'Expense deleted' };
    }
}
