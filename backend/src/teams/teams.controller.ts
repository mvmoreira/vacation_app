import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, JoinTeamDto } from './dto';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';

@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTeamDto) {
        return this.teamsService.create(user.userId, dto);
    }

    @Get()
    findAll(@CurrentUser() user: AuthenticatedUser) {
        return this.teamsService.findAllByUser(user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.teamsService.findOne(id, user.userId);
    }

    @Post('join')
    join(@CurrentUser() user: AuthenticatedUser, @Body() dto: JoinTeamDto) {
        return this.teamsService.join(user.userId, dto);
    }

    @Delete(':teamId/members/:memberId')
    removeMember(
        @Param('teamId') teamId: string,
        @Param('memberId') memberId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.teamsService.removeMember(teamId, memberId, user.userId);
    }
}
