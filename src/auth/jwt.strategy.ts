import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET no está configurado en el archivo .env',
      );
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: jwtSecret,
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

    if (!payload.email) {
      throw new UnauthorizedException(
        'El token no contiene un correo válido',
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