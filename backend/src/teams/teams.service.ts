import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, JoinTeamDto } from './dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TeamsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateTeamDto) {
        const team = await this.prisma.team.create({
            data: {
                name: dto.name,
                ownerId: userId,
                inviteCode: randomUUID().slice(0, 8).toUpperCase(),
                members: {
                    create: {
                        userId,
                        role: 'OWNER',
                    },
                },
            },
            include: { members: true },
        });

        return team;
    }

    async findAllByUser(userId: string) {
        return this.prisma.team.findMany({
            where: {
                members: { some: { userId } },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
                _count: { select: { trips: true } },
            },
        });
    }

    async findOne(teamId: string, userId: string) {
        const team = await this.prisma.team.findFirst({
            where: {
                id: teamId,
                members: { some: { userId } },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        return team;
    }

    async join(userId: string, dto: JoinTeamDto) {
        const team = await this.prisma.team.findUnique({
            where: { inviteCode: dto.inviteCode },
        });

        if (!team) {
            throw new NotFoundException('Invalid invite code');
        }

        const existingMember = await this.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: team.id,
                    userId,
                },
            },
        });

        if (existingMember) {
            throw new ConflictException('Already a member of this team');
        }

        await this.prisma.teamMember.create({
            data: {
                teamId: team.id,
                userId,
                role: 'MEMBER',
            },
        });

        return { message: 'Successfully joined the team', teamId: team.id, teamName: team.name };
    }

    async removeMember(teamId: string, memberId: string, requesterId: string) {
        // Check requester is owner/admin
        const requesterMembership = await this.prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: requesterId } },
        });

        if (!requesterMembership || requesterMembership.role === 'MEMBER') {
            throw new ForbiddenException('Only owners and admins can remove members');
        }

        const targetMembership = await this.prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: memberId } },
        });

        if (!targetMembership) {
            throw new NotFoundException('Member not found in this team');
        }

        if (targetMembership.role === 'OWNER') {
            throw new ForbiddenException('Cannot remove the team owner');
        }

        await this.prisma.teamMember.delete({
            where: { teamId_userId: { teamId, userId: memberId } },
        });

        return { message: 'Member removed successfully' };
    }
}
