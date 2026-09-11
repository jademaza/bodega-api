import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { eq } from 'drizzle-orm';

import { DrizzleService } from '../drizzle/drizzle.service';

import { usuarios } from '../drizzle/Schema/usuarios';
import { roles } from '../drizzle/Schema/roles';

import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly drizzle: DrizzleService,
  ) {}

  private traducirUsuario(usuario: any) {
    return {
      id: usuario.id,
      nombre: usuario.name,
      correo: usuario.email,
      rolId: usuario.roleId,
      ...(usuario.role !== undefined && {
        rol: usuario.role,
      }),
      ...(usuario.createdAt !== undefined && {
        creadoEn: usuario.createdAt,
      }),
    };
  }

  async create(
    createUsuarioDto: CreateUsuarioDto,
  ) {
    const name =
      createUsuarioDto.name.trim();

    const email =
      createUsuarioDto.email
        .trim()
        .toLowerCase();

    const existingUser =
      await this.drizzle.db
        .select({
          id: usuarios.id,
          email: usuarios.email,
        })
        .from(usuarios)
        .where(eq(usuarios.email, email))
        .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException(
        'El email ya está registrado',
      );
    }

    const role =
      await this.drizzle.db
        .select({
          id: roles.id,
          name: roles.name,
        })
        .from(roles)
        .where(
          eq(
            roles.id,
            createUsuarioDto.roleId,
          ),
        )
        .limit(1);

    if (role.length === 0) {
      throw new NotFoundException(
        'El rol indicado no existe',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        createUsuarioDto.password,
        10,
      );

    const result =
      await this.drizzle.db
        .insert(usuarios)
        .values({
          name,
          email,
          password: passwordHash,
          roleId: role[0].id,
        })
        .returning({
          id: usuarios.id,
          name: usuarios.name,
          email: usuarios.email,
          roleId: usuarios.roleId,
          createdAt: usuarios.createdAt,
        });

    return {
      mensaje:
        'Usuario creado correctamente',
      datos: this.traducirUsuario(
        result[0],
      ),
    };
  }

  async createInitialAdmin(
    createUsuarioDto: CreateUsuarioDto,
  ) {
    const existingUsers =
      await this.drizzle.db
        .select({
          id: usuarios.id,
        })
        .from(usuarios)
        .limit(1);

    if (existingUsers.length > 0) {
      throw new ConflictException(
        'La configuración inicial del administrador ya fue realizada',
      );
    }

    const adminRole =
      await this.drizzle.db
        .select({
          id: roles.id,
          name: roles.name,
        })
        .from(roles)
        .where(eq(roles.name, 'ADMIN'))
        .limit(1);

    if (adminRole.length === 0) {
      throw new NotFoundException(
        'Primero debe existir el rol ADMIN',
      );
    }

    const email =
      createUsuarioDto.email
        .trim()
        .toLowerCase();

    const passwordHash =
      await bcrypt.hash(
        createUsuarioDto.password,
        10,
      );

    const result =
      await this.drizzle.db
        .insert(usuarios)
        .values({
          name:
            createUsuarioDto.name.trim(),
          email,
          password: passwordHash,
          roleId: adminRole[0].id,
        })
        .returning({
          id: usuarios.id,
          name: usuarios.name,
          email: usuarios.email,
          roleId: usuarios.roleId,
          createdAt: usuarios.createdAt,
        });

    return {
      mensaje:
        'Usuario administrador inicial creado correctamente',
      datos: this.traducirUsuario(
        result[0],
      ),
    };
  }

  async findAll() {
    const result =
      await this.drizzle.db
        .select({
          id: usuarios.id,
          name: usuarios.name,
          email: usuarios.email,
          roleId: usuarios.roleId,
          role: roles.name,
          createdAt: usuarios.createdAt,
        })
        .from(usuarios)
        .innerJoin(
          roles,
          eq(
            usuarios.roleId,
            roles.id,
          ),
        );

    return {
      mensaje:
        'Usuarios obtenidos correctamente',
      total: result.length,
      datos: result.map((usuario) =>
        this.traducirUsuario(
          usuario,
        ),
      ),
    };
  }

  async findOne(id: number) {
    const result =
      await this.drizzle.db
        .select({
          id: usuarios.id,
          name: usuarios.name,
          email: usuarios.email,
          roleId: usuarios.roleId,
          role: roles.name,
          createdAt: usuarios.createdAt,
        })
        .from(usuarios)
        .innerJoin(
          roles,
          eq(
            usuarios.roleId,
            roles.id,
          ),
        )
        .where(
          eq(usuarios.id, id),
        )
        .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(
        'El usuario no existe',
      );
    }

    return {
      mensaje:
        'Usuario obtenido correctamente',
      datos: this.traducirUsuario(
        result[0],
      ),
    };
  }
}