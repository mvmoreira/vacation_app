import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto';

@Injectable()
export class TransfersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(teamId: string, dto: CreateTransferDto) {
        if (dto.fromCategoryId === dto.toCategoryId) {
            throw new BadRequestException('Cannot transfer to the same category');
        }

        // Verify both categories belong to the same team and trip
        const fromCategory = await this.prisma.category.findFirst({
            where: { id: dto.fromCategoryId, teamId },
            include: { trip: true },
        });

        const toCategory = await this.prisma.category.findFirst({
            where: { id: dto.toCategoryId, teamId },
        });

        if (!fromCategory || !toCategory) {
            throw new NotFoundException('One or both categories not found');
        }

        if (fromCategory.tripId !== toCategory.tripId) {
            throw new BadRequestException('Categories must belong to the same trip');
        }

        if (fromCategory.trip.status !== 'ACTIVE') {
            throw new BadRequestException('Transfers can only be made during the ACTIVE phase');
        }

        return this.prisma.categoryTransfer.create({
            data: {
                fromCategoryId: dto.fromCategoryId,
                toCategoryId: dto.toCategoryId,
                amount: dto.amount,
                date: new Date(dto.date),
                description: dto.description,
            },
            include: {
                fromCategory: { select: { id: true, name: true } },
                toCategory: { select: { id: true, name: true } },
            },
        });
    }

    async findAllByTrip(tripId: string, teamId: string) {
        return this.prisma.categoryTransfer.findMany({
            where: {
                fromCategory: { tripId, teamId },
            },
            include: {
                fromCategory: { select: { id: true, name: true } },
                toCategory: { select: { id: true, name: true } },
            },
            orderBy: { date: 'desc' },
        });
    }

    async remove(id: string, teamId: string) {
        const transfer = await this.prisma.categoryTransfer.findFirst({
            where: { id },
            include: { fromCategory: true },
        });

        if (!transfer || transfer.fromCategory.teamId !== teamId) {
            throw new NotFoundException('Transfer not found');
        }

        await this.prisma.categoryTransfer.delete({ where: { id } });
        return { message: 'Transfer deleted' };
    }
}
