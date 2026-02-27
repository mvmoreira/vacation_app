import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';

@Controller('transfers')
export class TransfersController {
    constructor(private readonly transfersService: TransfersService) { }

    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTransferDto) {
        return this.transfersService.create(user.activeTeamId, dto);
    }

    @Get('trip/:tripId')
    findAllByTrip(@Param('tripId') tripId: string, @CurrentUser() user: AuthenticatedUser) {
        return this.transfersService.findAllByTrip(tripId, user.activeTeamId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.transfersService.remove(id, user.activeTeamId);
    }
}
