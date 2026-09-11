import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { DrizzleService } from '../drizzle/drizzle.service';
import { usuarios } from '../drizzle/Schema/usuarios';
import { roles } from '../drizzle/Schema/roles';

@Injectable()
export class AuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ) {
    const result = await this.drizzle.db
      .select({
        id: usuarios.id,
        name: usuarios.name,
        email: usuarios.email,
        password: usuarios.password,
        roleId: usuarios.roleId,
        role: roles.name,
      })
      .from(usuarios)
      .innerJoin(
        roles,
        eq(usuarios.roleId, roles.id),
      )
      .where(eq(usuarios.email, email))
      .limit(1);

    const user = result[0];

    if (!user) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: user.role,
    };
  }

  async login(
    email: string,
    password: string,
  ) {
    const user = await this.validateUser(
      email,
      password,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      mensaje: 'Inicio de sesión exitoso',
      tokenAcceso: accessToken,
      tipoToken: 'Bearer',
      expiraEn: '8h',
      usuario: {
        id: user.id,
        nombre: user.name,
        correo: user.email,
        rolId: user.roleId,
        rol: user.role,
      },
    };
  }
}