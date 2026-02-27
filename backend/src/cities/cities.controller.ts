import { Controller, Get, Post, Delete, Query, Param, Body } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';

@Controller('cities')
export class CitiesController {
    constructor(private readonly citiesService: CitiesService) { }

    @Get('search')
    search(@Query('q') query: string) {
        return this.citiesService.search(query);
    }

    @Post('trips/:tripId')
    addToTrip(
        @Param('tripId') tripId: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { geonameId: number; order: number; arrivalDate?: string; departureDate?: string },
    ) {
        return this.citiesService.addCityToTrip(
            tripId,
            user.activeTeamId,
            body.geonameId,
            body.order,
            body.arrivalDate,
            body.departureDate,
        );
    }

    @Delete('trips/:tripId/:cityId')
    removeFromTrip(
        @Param('tripId') tripId: string,
        @Param('cityId') cityId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.citiesService.removeCityFromTrip(tripId, user.activeTeamId, cityId);
    }
}
