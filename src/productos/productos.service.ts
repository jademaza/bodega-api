import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, eq, isNull } from 'drizzle-orm';

import { DrizzleService } from '../drizzle/drizzle.service';

import { productos } from '../drizzle/Schema/productos';
import { detallesCredito } from '../drizzle/Schema/detalles-credito';
import { usuarios } from '../drizzle/Schema/usuarios';

import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    private readonly drizzle: DrizzleService,
  ) {}

  private traducirEstado(estado: string) {
    return estado === 'ACTIVE'
      ? 'ACTIVO'
      : estado === 'INACTIVE'
        ? 'INACTIVO'
        : estado;
  }

  private traducirProducto(producto: any) {
    return {
      id: producto.id,
      nombre: producto.name,
      descripcion: producto.description,
      categoria: producto.category,
      precio: producto.price,
      stock: producto.stock,
      unidad: producto.unit,
      codigoBarras: producto.barcode,
      estado: this.traducirEstado(producto.status),
      usuarioId: producto.userId,
      ...(producto.userName !== undefined && {
        usuario: producto.userName,
      }),
      ...(producto.createdAt !== undefined && {
        creadoEn: producto.createdAt,
      }),
      ...(producto.updatedAt !== undefined && {
        actualizadoEn: producto.updatedAt,
      }),
      ...(producto.deletedAt !== undefined && {
        eliminadoEn: producto.deletedAt,
      }),
    };
  }

  async create(
    createProductoDto: CreateProductoDto,
    userId: number,
  ) {
    const barcode =
      createProductoDto.barcode?.trim();

    if (barcode) {
      const existingBarcode =
        await this.drizzle.db
          .select({ id: productos.id })
          .from(productos)
          .where(eq(productos.barcode, barcode))
          .limit(1);

      if (existingBarcode.length > 0) {
        throw new ConflictException(
          'El código de barras ya está registrado',
        );
      }
    }

    const user = await this.drizzle.db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundException(
        'El usuario responsable no existe',
      );
    }

    const result = await this.drizzle.db
      .insert(productos)
      .values({
        name: createProductoDto.name.trim(),
        description:
          createProductoDto.description?.trim() || null,
        category:
          createProductoDto.category.trim(),
        price:
          createProductoDto.price.toFixed(2),
        stock: createProductoDto.stock,
        unit: createProductoDto.unit.trim(),
        barcode: barcode || null,
        status: 'ACTIVE',
        userId,
      })
      .returning({
        id: productos.id,
        name: productos.name,
        description: productos.description,
        category: productos.category,
        price: productos.price,
        stock: productos.stock,
        unit: productos.unit,
        barcode: productos.barcode,
        status: productos.status,
        userId: productos.userId,
        createdAt: productos.createdAt,
      });

    return {
      mensaje: 'Producto creado correctamente',
      datos: this.traducirProducto(result[0]),
    };
  }

  async findAll() {
    const result = await this.drizzle.db
      .select({
        id: productos.id,
        name: productos.name,
        description: productos.description,
        category: productos.category,
        price: productos.price,
        stock: productos.stock,
        unit: productos.unit,
        barcode: productos.barcode,
        status: productos.status,
        userId: productos.userId,
        userName: usuarios.name,
        createdAt: productos.createdAt,
        updatedAt: productos.updatedAt,
      })
      .from(productos)
      .innerJoin(
        usuarios,
        eq(productos.userId, usuarios.id),
      )
      .where(isNull(productos.deletedAt));

    return {
      mensaje: 'Productos obtenidos correctamente',
      total: result.length,
      datos: result.map((producto) =>
        this.traducirProducto(producto),
      ),
    };
  }

  async findOne(id: number) {
    const result = await this.drizzle.db
      .select({
        id: productos.id,
        name: productos.name,
        description: productos.description,
        category: productos.category,
        price: productos.price,
        stock: productos.stock,
        unit: productos.unit,
        barcode: productos.barcode,
        status: productos.status,
        userId: productos.userId,
        userName: usuarios.name,
        createdAt: productos.createdAt,
        updatedAt: productos.updatedAt,
      })
      .from(productos)
      .innerJoin(
        usuarios,
        eq(productos.userId, usuarios.id),
      )
      .where(
        and(
          eq(productos.id, id),
          isNull(productos.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(
        'El producto no existe',
      );
    }

    return {
      mensaje: 'Producto obtenido correctamente',
      datos: this.traducirProducto(result[0]),
    };
  }

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto,
  ) {
    const existing = await this.drizzle.db
      .select({ id: productos.id })
      .from(productos)
      .where(
        and(
          eq(productos.id, id),
          isNull(productos.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(
        'El producto no existe',
      );
    }

    if (updateProductoDto.barcode !== undefined) {
      const barcode =
        updateProductoDto.barcode.trim();

      if (barcode) {
        const duplicate =
          await this.drizzle.db
            .select({ id: productos.id })
            .from(productos)
            .where(
              and(
                eq(productos.barcode, barcode),
                isNull(productos.deletedAt),
              ),
            )
            .limit(1);

        if (
          duplicate.length > 0 &&
          duplicate[0].id !== id
        ) {
          throw new ConflictException(
            'El código de barras ya pertenece a otro producto',
          );
        }
      }
    }

    if (
      updateProductoDto.price !== undefined &&
      updateProductoDto.price <= 0
    ) {
      throw new ConflictException(
        'El precio debe ser mayor que 0',
      );
    }

    if (
      updateProductoDto.stock !== undefined
    ) {
      throw new ConflictException(
        'El stock debe modificarse mediante movimientos de inventario',
      );
    }

    const values: Partial<
      typeof productos.$inferInsert
    > = {
      updatedAt: new Date(),
    };

    if (updateProductoDto.name !== undefined) {
      values.name =
        updateProductoDto.name.trim();
    }

    if (
      updateProductoDto.description !== undefined
    ) {
      values.description =
        updateProductoDto.description.trim() || null;
    }

    if (
      updateProductoDto.category !== undefined
    ) {
      values.category =
        updateProductoDto.category.trim();
    }

    if (updateProductoDto.price !== undefined) {
      values.price =
        updateProductoDto.price.toFixed(2);
    }

    if (updateProductoDto.unit !== undefined) {
      values.unit =
        updateProductoDto.unit.trim();
    }

    if (
      updateProductoDto.barcode !== undefined
    ) {
      values.barcode =
        updateProductoDto.barcode.trim() || null;
    }

    const result = await this.drizzle.db
      .update(productos)
      .set(values)
      .where(eq(productos.id, id))
      .returning({
        id: productos.id,
        name: productos.name,
        description: productos.description,
        category: productos.category,
        price: productos.price,
        stock: productos.stock,
        unit: productos.unit,
        barcode: productos.barcode,
        status: productos.status,
        userId: productos.userId,
        updatedAt: productos.updatedAt,
      });

    return {
      mensaje: 'Producto actualizado correctamente',
      datos: this.traducirProducto(result[0]),
    };
  }

  async remove(id: number) {
    const existing = await this.drizzle.db
      .select({ id: productos.id })
      .from(productos)
      .where(
        and(
          eq(productos.id, id),
          isNull(productos.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(
        'El producto no existe',
      );
    }

    const activeDetails =
      await this.drizzle.db
        .select({ id: detallesCredito.id })
        .from(detallesCredito)
        .where(
          and(
            eq(detallesCredito.productId, id),
            isNull(detallesCredito.deletedAt),
          ),
        )
        .limit(1);

    if (activeDetails.length > 0) {
      throw new ConflictException(
        'No se puede eliminar el producto porque está siendo utilizado en créditos activos',
      );
    }

    const result = await this.drizzle.db
      .update(productos)
      .set({
        deletedAt: new Date(),
        status: 'INACTIVE',
        updatedAt: new Date(),
      })
      .where(eq(productos.id, id))
      .returning({
        id: productos.id,
        name: productos.name,
        status: productos.status,
        deletedAt: productos.deletedAt,
      });

    return {
      mensaje: 'Producto eliminado correctamente',
      datos: this.traducirProducto(result[0]),
    };
  }
}