import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not set');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    validate(payload: JwtPayload): AuthenticatedUser {
        return {
            userId: payload.sub,
            email: payload.email,
            activeTeamId: payload.activeTeamId ?? '',
        };
    }
}
