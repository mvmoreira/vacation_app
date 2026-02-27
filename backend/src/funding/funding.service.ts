import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFundingEntryDto } from './dto';

@Injectable()
export class FundingService {
    constructor(private readonly prisma: PrismaService) { }

    async create(teamId: string, dto: CreateFundingEntryDto) {
        const category = await this.prisma.category.findFirst({
            where: { id: dto.categoryId, teamId },
            include: { trip: true },
        });

        if (!category) throw new NotFoundException('Category not found');
        if (category.trip.status !== 'ACTIVE') {
            throw new BadRequestException('Funding can only be added during the ACTIVE phase');
        }

        return this.prisma.fundingEntry.create({
            data: {
                categoryId: dto.categoryId,
                amount: dto.amount,
                date: new Date(dto.date),
                description: dto.description,
                method: dto.method,
            },
        });
    }

    async findAllByCategory(categoryId: string, teamId: string) {
        const category = await this.prisma.category.findFirst({ where: { id: categoryId, teamId } });
        if (!category) throw new NotFoundException('Category not found');

        return this.prisma.fundingEntry.findMany({
            where: { categoryId },
            orderBy: { date: 'desc' },
        });
    }

    async remove(id: string, teamId: string) {
        const entry = await this.prisma.fundingEntry.findFirst({
            where: { id },
            include: { category: true },
        });

        if (!entry || entry.category.teamId !== teamId) {
            throw new NotFoundException('Funding entry not found');
        }

        await this.prisma.fundingEntry.delete({ where: { id } });
        return { message: 'Funding entry deleted' };
    }
}
