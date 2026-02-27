import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.$transaction(async (tx: any) => {
            // Create user
            const newUser = await tx.user.create({
                data: {
                    email: dto.email,
                    passwordHash,
                    name: dto.name,
                },
            });

            // Create default team
            const team = await tx.team.create({
                data: {
                    name: `${dto.name}'s Team`,
                    ownerId: newUser.id,
                    inviteCode: randomUUID().slice(0, 8).toUpperCase(),
                },
            });

            // Add user as owner of the team
            await tx.teamMember.create({
                data: {
                    teamId: team.id,
                    userId: newUser.id,
                    role: 'OWNER',
                },
            });

            return newUser;
        });

        // Get the default team for the token
        const teamMember = await this.prisma.teamMember.findFirst({
            where: { userId: user.id },
        });

        return this.generateTokens(user.id, user.email, teamMember?.teamId ?? '');
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Get user's first team as active team
        const teamMember = await this.prisma.teamMember.findFirst({
            where: { userId: user.id },
            orderBy: { team: { createdAt: 'asc' } },
        });

        return this.generateTokens(user.id, user.email, teamMember?.teamId ?? '');
    }

    async switchTeam(userId: string, teamId: string) {
        // Verify user belongs to the team
        const membership = await this.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
            include: { user: true },
        });

        if (!membership) {
            throw new UnauthorizedException('You are not a member of this team');
        }

        return this.generateTokens(userId, membership.user.email, teamId);
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                teamMembers: {
                    include: {
                        team: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        return user;
    }

    private generateTokens(userId: string, email: string, activeTeamId: string) {
        const payload = { sub: userId, email, activeTeamId };

        return {
            accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
            activeTeamId,
        };
    }
}
