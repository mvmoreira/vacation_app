import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { Public } from '../common/decorators';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('switch-team/:teamId')
    @HttpCode(HttpStatus.OK)
    switchTeam(
        @CurrentUser() user: AuthenticatedUser,
        @Param('teamId') teamId: string,
    ) {
        return this.authService.switchTeam(user.userId, teamId);
    }

    @Get('profile')
    getProfile(@CurrentUser() user: AuthenticatedUser) {
        return this.authService.getProfile(user.userId);
    }
}
