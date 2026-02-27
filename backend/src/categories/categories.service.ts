import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(teamId: string, dto: CreateCategoryDto) {
        const trip = await this.prisma.trip.findFirst({ where: { id: dto.tripId, teamId } });
        if (!trip) throw new NotFoundException('Trip not found');

        return this.prisma.category.create({
            data: {
                teamId,
                tripId: dto.tripId,
                name: dto.name,
                budgetType: dto.budgetType ?? 'GLOBAL',
                budgetGoal: dto.budgetGoal ?? 0,
                budgetDetails: dto.budgetDetails ?? undefined,
            },
        });
    }

    async findAllByTrip(tripId: string, teamId: string) {
        return this.prisma.category.findMany({
            where: { tripId, teamId },
            include: {
                savings: { orderBy: { date: 'desc' } },
                expenses: { orderBy: { date: 'desc' } },
                funding: { orderBy: { date: 'desc' } },
                transfersIn: { orderBy: { date: 'desc' } },
                transfersOut: { orderBy: { date: 'desc' } },
            },
        });
    }

    async findOne(id: string, teamId: string) {
        const category = await this.prisma.category.findFirst({
            where: { id, teamId },
            include: {
                savings: { orderBy: { date: 'desc' } },
                expenses: { orderBy: { date: 'desc' }, include: { person: true } },
                funding: { orderBy: { date: 'desc' } },
                transfersIn: { orderBy: { date: 'desc' } },
                transfersOut: { orderBy: { date: 'desc' } },
            },
        });

        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    async update(id: string, teamId: string, dto: UpdateCategoryDto) {
        const category = await this.prisma.category.findFirst({ where: { id, teamId } });
        if (!category) throw new NotFoundException('Category not found');

        return this.prisma.category.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.budgetType && { budgetType: dto.budgetType }),
                ...(dto.budgetGoal !== undefined && { budgetGoal: dto.budgetGoal }),
                ...(dto.budgetDetails && { budgetDetails: dto.budgetDetails }),
            },
        });
    }

    async remove(id: string, teamId: string) {
        const category = await this.prisma.category.findFirst({ where: { id, teamId } });
        if (!category) throw new NotFoundException('Category not found');

        await this.prisma.category.delete({ where: { id } });
        return { message: 'Category deleted successfully' };
    }
}
