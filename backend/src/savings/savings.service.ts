import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavingsEntryDto } from './dto';

@Injectable()
export class SavingsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(teamId: string, dto: CreateSavingsEntryDto) {
        // Verify category belongs to team
        const category = await this.prisma.category.findFirst({
            where: { id: dto.categoryId, teamId },
            include: { trip: true },
        });

        if (!category) throw new NotFoundException('Category not found');
        if (category.trip.status !== 'PLANNING') {
            throw new BadRequestException('Savings can only be added during the PLANNING phase');
        }

        return this.prisma.savingsEntry.create({
            data: {
                categoryId: dto.categoryId,
                amount: dto.amount,
                date: new Date(dto.date),
                description: dto.description,
            },
        });
    }

    async findAllByCategory(categoryId: string, teamId: string) {
        const category = await this.prisma.category.findFirst({ where: { id: categoryId, teamId } });
        if (!category) throw new NotFoundException('Category not found');

        const entries = await this.prisma.savingsEntry.findMany({
            where: { categoryId },
            orderBy: { date: 'desc' },
        });

        const totalSaved = entries.reduce((sum, e) => sum + Number(e.amount), 0);

        return {
            entries,
            totalSaved,
            budgetGoal: Number(category.budgetGoal),
            progress: Number(category.budgetGoal) > 0 ? (totalSaved / Number(category.budgetGoal)) * 100 : 0,
        };
    }

    async remove(id: string, teamId: string) {
        const entry = await this.prisma.savingsEntry.findFirst({
            where: { id },
            include: { category: true },
        });

        if (!entry || entry.category.teamId !== teamId) {
            throw new NotFoundException('Savings entry not found');
        }

        await this.prisma.savingsEntry.delete({ where: { id } });
        return { message: 'Savings entry deleted' };
    }
}
