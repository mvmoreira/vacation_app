import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto, UpdateTripDto } from './dto';

@Injectable()
export class TripsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(teamId: string, dto: CreateTripDto) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        return this.prisma.trip.create({
            data: {
                teamId,
                name: dto.name,
                startDate,
                endDate,
                totalDays,
                currency: dto.currency,
                persons: {
                    create: dto.persons?.map(name => ({
                        teamId,
                        name
                    })) || []
                }
            },
            include: { cities: { include: { city: true } }, persons: true, categories: true },
        });
    }

    async findAll(teamId: string) {
        return this.prisma.trip.findMany({
            where: { teamId },
            include: {
                cities: { include: { city: true }, orderBy: { order: 'asc' } },
                persons: true,
                _count: { select: { categories: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, teamId: string) {
        const trip = await this.prisma.trip.findFirst({
            where: { id, teamId },
            include: {
                cities: { include: { city: true }, orderBy: { order: 'asc' } },
                persons: true,
                categories: {
                    include: {
                        savings: true,
                        expenses: true,
                        funding: true,
                        transfersIn: true,
                        transfersOut: true,
                    },
                },
            },
        });

        if (!trip) throw new NotFoundException('Trip not found');

        // Calculate financial summary for each category
        const categoriesWithSummary = trip.categories.map((cat) => {
            const totalSavings = cat.savings.reduce((sum, s) => sum + Number(s.amount), 0);
            const totalFunding = cat.funding.reduce((sum, f) => sum + Number(f.amount), 0);
            const totalTransfersIn = cat.transfersIn.reduce((sum, t) => sum + Number(t.amount), 0);
            const totalTransfersOut = cat.transfersOut.reduce((sum, t) => sum + Number(t.amount), 0);
            const totalExpenses = cat.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const available = totalSavings + totalFunding + totalTransfersIn - totalTransfersOut - totalExpenses;

            // Calculate daily goal
            const today = new Date();
            const endDate = new Date(trip.endDate);
            const startDate = new Date(trip.startDate);
            const effectiveStart = today > startDate ? today : startDate;
            const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)));
            const dailyGoal = remainingDays > 0 ? available / remainingDays : 0;

            return {
                ...cat,
                summary: {
                    budgetGoal: Number(cat.budgetGoal),
                    totalSavings,
                    totalFunding,
                    totalTransfersIn,
                    totalTransfersOut,
                    totalExpenses,
                    available,
                    dailyGoal,
                    remainingDays,
                    savingsProgress: Number(cat.budgetGoal) > 0 ? (totalSavings / Number(cat.budgetGoal)) * 100 : 0,
                },
            };
        });

        // Overall trip summary
        const totalBudgetGoal = categoriesWithSummary.reduce((sum, c) => sum + c.summary.budgetGoal, 0);
        const totalSaved = categoriesWithSummary.reduce((sum, c) => sum + c.summary.totalSavings, 0);
        const totalSpent = categoriesWithSummary.reduce((sum, c) => sum + c.summary.totalExpenses, 0);
        const totalAvailable = categoriesWithSummary.reduce((sum, c) => sum + c.summary.available, 0);

        return {
            ...trip,
            categories: categoriesWithSummary,
            tripSummary: {
                totalBudgetGoal,
                totalSaved,
                totalSpent,
                totalAvailable,
                overallSavingsProgress: totalBudgetGoal > 0 ? (totalSaved / totalBudgetGoal) * 100 : 0,
            },
        };
    }

    async update(id: string, teamId: string, dto: UpdateTripDto) {
        const trip = await this.prisma.trip.findFirst({ where: { id, teamId }, include: { persons: true } });
        if (!trip) throw new NotFoundException('Trip not found');

        const startDate = dto.startDate ? new Date(dto.startDate) : trip.startDate;
        const endDate = dto.endDate ? new Date(dto.endDate) : trip.endDate;
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const updatedTrip = await this.prisma.trip.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.startDate && { startDate }),
                ...(dto.endDate && { endDate }),
                totalDays,
                ...(dto.currency && { currency: dto.currency }),
                ...(dto.status && { status: dto.status }),
            },
            include: { cities: { include: { city: true } }, persons: true },
        });

        // 3. Update persons if provided
        if (dto.persons) {
            const existingPersons = trip.persons.map(p => p.name);
            const toAdd = dto.persons.filter(p => !existingPersons.includes(p));
            const toRemove = trip.persons.filter(p => !dto.persons?.includes(p.name));

            if (toRemove.length > 0) {
                await this.prisma.person.deleteMany({
                    where: { id: { in: toRemove.map(p => p.id) } }
                });
            }

            if (toAdd.length > 0) {
                await this.prisma.person.createMany({
                    data: toAdd.map(name => ({
                        teamId,
                        tripId: id,
                        name
                    }))
                });
            }

            // Refetch to include updated persons
            return this.prisma.trip.findUnique({
                where: { id },
                include: { cities: { include: { city: true } }, persons: true }
            }) as any;
        }

        return updatedTrip;
    }

    async remove(id: string, teamId: string) {
        const trip = await this.prisma.trip.findFirst({ where: { id, teamId } });
        if (!trip) throw new NotFoundException('Trip not found');

        await this.prisma.trip.delete({ where: { id } });
        return { message: 'Trip deleted successfully' };
    }
}
