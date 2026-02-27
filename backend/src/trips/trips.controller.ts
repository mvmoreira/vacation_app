import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto, UpdateTripDto } from './dto';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';

@Controller('trips')
export class TripsController {
    constructor(private readonly tripsService: TripsService) { }

    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTripDto) {
        return this.tripsService.create(user.activeTeamId, dto);
    }

    @Get()
    findAll(@CurrentUser() user: AuthenticatedUser) {
        return this.tripsService.findAll(user.activeTeamId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.tripsService.findOne(id, user.activeTeamId);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: UpdateTripDto,
    ) {
        return this.tripsService.update(id, user.activeTeamId, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.tripsService.remove(id, user.activeTeamId);
    }
}
