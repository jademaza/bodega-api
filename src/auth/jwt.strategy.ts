import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    role: string;
  }) {
    if (!payload) {
      throw new UnauthorizedException(
        'Token inválido',
      );
    }

    if (!payload.sub) {
      throw new UnauthorizedException(
        'El token no contiene un usuario válido',
      );
    }

    if (!payload.role) {
      throw new UnauthorizedException(
        'El token no contiene un rol válido',
      );
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}