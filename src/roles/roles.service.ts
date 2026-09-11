import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { eq } from 'drizzle-orm';

import { DrizzleService } from '../drizzle/drizzle.service';
import { roles } from '../drizzle/Schema/roles';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly drizzle: DrizzleService,
  ) {}

  async createInitialRoles() {
    const existingRoles = await this.drizzle.db
      .select({
        id: roles.id,
      })
      .from(roles)
      .limit(1);

    if (existingRoles.length > 0) {
      throw new ConflictException(
        'La configuración inicial de roles ya fue realizada',
      );
    }

    const result = await this.drizzle.db
      .insert(roles)
      .values([
        { name: 'ADMIN' },
        { name: 'VENDEDOR' },
        { name: 'CONSULTOR' },
      ])
      .returning({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
      });

    return {
      mensaje:
        'Roles iniciales creados correctamente',
      total: result.length,
      datos: result.map((role) => ({
        id: role.id,
        nombre: role.name,
        creadoEn: role.createdAt,
      })),
    };
  }

  async create(createRoleDto: CreateRoleDto) {
    const name =
      createRoleDto.name
        .trim()
        .toUpperCase();

    const existingRole = await this.drizzle.db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);

    if (existingRole.length > 0) {
      throw new ConflictException(
        `El rol ${name} ya existe`,
      );
    }

    const result = await this.drizzle.db
      .insert(roles)
      .values({
        name,
      })
      .returning({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
      });

    return {
      mensaje: 'Rol creado correctamente',
      datos: {
        id: result[0].id,
        nombre: result[0].name,
        creadoEn: result[0].createdAt,
      },
    };
  }

  async findAll() {
    const result = await this.drizzle.db
      .select({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
      })
      .from(roles);

    return {
      mensaje:
        'Roles obtenidos correctamente',
      total: result.length,
      datos: result.map((role) => ({
        id: role.id,
        nombre: role.name,
        creadoEn: role.createdAt,
      })),
    };
  }

  async findOne(id: number) {
    const result = await this.drizzle.db
      .select({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
      })
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(
        'El rol solicitado no existe',
      );
    }

    return {
      mensaje: 'Rol obtenido correctamente',
      datos: {
        id: result[0].id,
        nombre: result[0].name,
        creadoEn: result[0].createdAt,
      },
    };
  }
}