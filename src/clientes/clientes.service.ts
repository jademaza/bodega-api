import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, eq, isNull } from 'drizzle-orm';

import { DrizzleService } from '../drizzle/drizzle.service';

import { clientes } from '../drizzle/Schema/clientes';
import { creditos } from '../drizzle/Schema/creditos';
import { usuarios } from '../drizzle/Schema/usuarios';

import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    private readonly drizzle: DrizzleService,
  ) {}

  private traducirEstado(estado: string) {
    const estados: Record<string, string> = {
      ACTIVE: 'ACTIVO',
      INACTIVE: 'INACTIVO',
    };

    return estados[estado] ?? estado;
  }

  private traducirCliente(cliente: any) {
    if (!cliente) {
      return cliente;
    }

    return {
      id: cliente.id,
      nombre: cliente.name,
      apellido: cliente.lastname,
      dni: cliente.dni,
      telefono: cliente.phone,
      direccion: cliente.address,
      correo: cliente.email,
      limiteCredito: cliente.creditLimit,
      estado: this.traducirEstado(cliente.status),
      usuarioId: cliente.userId,
      ...(cliente.userName !== undefined && {
        usuario: cliente.userName,
      }),
      ...(cliente.createdAt !== undefined && {
        creadoEn: cliente.createdAt,
      }),
      ...(cliente.updatedAt !== undefined && {
        actualizadoEn: cliente.updatedAt,
      }),
      ...(cliente.deletedAt !== undefined && {
        eliminadoEn: cliente.deletedAt,
      }),
    };
  }

  async create(
    createClienteDto: CreateClienteDto,
    userId: number,
  ) {
    const dni = createClienteDto.dni.trim();

    const existingDni = await this.drizzle.db
      .select({
        id: clientes.id,
      })
      .from(clientes)
      .where(eq(clientes.dni, dni))
      .limit(1);

    if (existingDni.length > 0) {
      throw new ConflictException(
        'El DNI ya está registrado',
      );
    }

    const user = await this.drizzle.db
      .select({
        id: usuarios.id,
      })
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundException(
        'El usuario responsable no existe',
      );
    }

    if (createClienteDto.creditLimit < 0) {
      throw new ConflictException(
        'El límite de crédito no puede ser negativo',
      );
    }

    const result = await this.drizzle.db
      .insert(clientes)
      .values({
        name: createClienteDto.name.trim(),
        lastname: createClienteDto.lastname.trim(),
        dni,
        phone: createClienteDto.phone.trim(),
        address: createClienteDto.address.trim(),
        email: createClienteDto.email
          ? createClienteDto.email.trim().toLowerCase()
          : null,
        creditLimit:
          createClienteDto.creditLimit.toFixed(2),
        status: 'ACTIVE',
        userId,
      })
      .returning({
        id: clientes.id,
        name: clientes.name,
        lastname: clientes.lastname,
        dni: clientes.dni,
        phone: clientes.phone,
        address: clientes.address,
        email: clientes.email,
        creditLimit: clientes.creditLimit,
        status: clientes.status,
        userId: clientes.userId,
        createdAt: clientes.createdAt,
      });

    return {
      mensaje: 'Cliente creado correctamente',
      datos: this.traducirCliente(result[0]),
    };
  }

  async findAll() {
    const result = await this.drizzle.db
      .select({
        id: clientes.id,
        name: clientes.name,
        lastname: clientes.lastname,
        dni: clientes.dni,
        phone: clientes.phone,
        address: clientes.address,
        email: clientes.email,
        creditLimit: clientes.creditLimit,
        status: clientes.status,
        userId: clientes.userId,
        userName: usuarios.name,
        createdAt: clientes.createdAt,
        updatedAt: clientes.updatedAt,
      })
      .from(clientes)
      .innerJoin(
        usuarios,
        eq(clientes.userId, usuarios.id),
      )
      .where(isNull(clientes.deletedAt));

    return {
      mensaje: 'Clientes obtenidos correctamente',
      total: result.length,
      datos: result.map((cliente) =>
        this.traducirCliente(cliente),
      ),
    };
  }

  async findOne(id: number) {
    const result = await this.drizzle.db
      .select({
        id: clientes.id,
        name: clientes.name,
        lastname: clientes.lastname,
        dni: clientes.dni,
        phone: clientes.phone,
        address: clientes.address,
        email: clientes.email,
        creditLimit: clientes.creditLimit,
        status: clientes.status,
        userId: clientes.userId,
        userName: usuarios.name,
        createdAt: clientes.createdAt,
        updatedAt: clientes.updatedAt,
      })
      .from(clientes)
      .innerJoin(
        usuarios,
        eq(clientes.userId, usuarios.id),
      )
      .where(
        and(
          eq(clientes.id, id),
          isNull(clientes.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(
        'El cliente no existe',
      );
    }

    return {
      mensaje: 'Cliente obtenido correctamente',
      datos: this.traducirCliente(result[0]),
    };
  }

  async update(
    id: number,
    updateClienteDto: UpdateClienteDto,
  ) {
    const existing = await this.drizzle.db
      .select({
        id: clientes.id,
      })
      .from(clientes)
      .where(
        and(
          eq(clientes.id, id),
          isNull(clientes.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(
        'El cliente no existe',
      );
    }

    if (updateClienteDto.dni) {
      const dni = updateClienteDto.dni.trim();

      const duplicate = await this.drizzle.db
        .select({
          id: clientes.id,
        })
        .from(clientes)
        .where(
          and(
            eq(clientes.dni, dni),
            isNull(clientes.deletedAt),
          ),
        )
        .limit(1);

      if (
        duplicate.length > 0 &&
        duplicate[0].id !== id
      ) {
        throw new ConflictException(
          'El DNI ya pertenece a otro cliente',
        );
      }
    }

    if (
      updateClienteDto.creditLimit !== undefined &&
      updateClienteDto.creditLimit < 0
    ) {
      throw new ConflictException(
        'El límite de crédito no puede ser negativo',
      );
    }

    const values: Partial<
      typeof clientes.$inferInsert
    > = {
      updatedAt: new Date(),
    };

    if (updateClienteDto.name !== undefined) {
      values.name =
        updateClienteDto.name.trim();
    }

    if (updateClienteDto.lastname !== undefined) {
      values.lastname =
        updateClienteDto.lastname.trim();
    }

    if (updateClienteDto.dni !== undefined) {
      values.dni =
        updateClienteDto.dni.trim();
    }

    if (updateClienteDto.phone !== undefined) {
      values.phone =
        updateClienteDto.phone.trim();
    }

    if (updateClienteDto.address !== undefined) {
      values.address =
        updateClienteDto.address.trim();
    }

    if (updateClienteDto.email !== undefined) {
      values.email = updateClienteDto.email
        ? updateClienteDto.email
            .trim()
            .toLowerCase()
        : null;
    }

    if (
      updateClienteDto.creditLimit !== undefined
    ) {
      values.creditLimit =
        updateClienteDto.creditLimit.toFixed(2);
    }

    const result = await this.drizzle.db
      .update(clientes)
      .set(values)
      .where(eq(clientes.id, id))
      .returning({
        id: clientes.id,
        name: clientes.name,
        lastname: clientes.lastname,
        dni: clientes.dni,
        phone: clientes.phone,
        address: clientes.address,
        email: clientes.email,
        creditLimit: clientes.creditLimit,
        status: clientes.status,
        userId: clientes.userId,
        updatedAt: clientes.updatedAt,
      });

    return {
      mensaje: 'Cliente actualizado correctamente',
      datos: this.traducirCliente(result[0]),
    };
  }

  async remove(id: number) {
    const existing = await this.drizzle.db
      .select({
        id: clientes.id,
      })
      .from(clientes)
      .where(
        and(
          eq(clientes.id, id),
          isNull(clientes.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(
        'El cliente no existe',
      );
    }

    const activeCredits = await this.drizzle.db
      .select({
        id: creditos.id,
      })
      .from(creditos)
      .where(
        and(
          eq(creditos.customerId, id),
          isNull(creditos.deletedAt),
        ),
      )
      .limit(1);

    if (activeCredits.length > 0) {
      throw new ConflictException(
        'No se puede eliminar el cliente porque tiene créditos activos',
      );
    }

    const result = await this.drizzle.db
      .update(clientes)
      .set({
        deletedAt: new Date(),
        status: 'INACTIVE',
        updatedAt: new Date(),
      })
      .where(eq(clientes.id, id))
      .returning({
        id: clientes.id,
        name: clientes.name,
        lastname: clientes.lastname,
        status: clientes.status,
        deletedAt: clientes.deletedAt,
      });

    return {
      mensaje: 'Cliente eliminado correctamente',
      datos: this.traducirCliente(result[0]),
    };
  }
}