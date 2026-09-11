import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, desc, eq, isNull } from 'drizzle-orm';

import { DrizzleService } from '../drizzle/drizzle.service';
import { movimientosInventario } from '../drizzle/Schema/movimientos-inventario';
import { productos } from '../drizzle/Schema/productos';
import { usuarios } from '../drizzle/Schema/usuarios';

import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto';

@Injectable()
export class MovimientosInventarioService {
  constructor(
    private readonly drizzle: DrizzleService,
  ) {}

  private traducirTipo(tipo: string) {
    const tipos: Record<string, string> = {
      IN: 'ENTRADA',
      OUT: 'SALIDA',
      ADJUSTMENT: 'AJUSTE',
    };

    return tipos[tipo] ?? tipo;
  }

  private traducirMovimiento(movimiento: any) {
    return {
      id: movimiento.id,
      productoId: movimiento.productId,
      ...(movimiento.product !== undefined && {
        producto: movimiento.product,
      }),
      usuarioId: movimiento.userId,
      ...(movimiento.user !== undefined && {
        usuario: movimiento.user,
      }),
      tipo: this.traducirTipo(movimiento.type),
      cantidad: movimiento.quantity,
      motivo: movimiento.reason,
      referenciaId: movimiento.referenceId,
      creadoEn: movimiento.createdAt,
      ...(movimiento.previousStock !== undefined && {
        stockAnterior: movimiento.previousStock,
      }),
      ...(movimiento.newStock !== undefined && {
        stockNuevo: movimiento.newStock,
      }),
    };
  }

  async create(
    createMovimientoDto: CreateMovimientoInventarioDto,
    userId: number,
    userRole: string,
  ) {
    const productResult = await this.drizzle.db
      .select({
        id: productos.id,
        name: productos.name,
        stock: productos.stock,
        status: productos.status,
      })
      .from(productos)
      .where(
        and(
          eq(
            productos.id,
            createMovimientoDto.productId,
          ),
          isNull(productos.deletedAt),
        ),
      )
      .limit(1);

    const product = productResult[0];

    if (!product) {
      throw new NotFoundException(
        'El producto no existe',
      );
    }

    if (product.status !== 'ACTIVE') {
      throw new ConflictException(
        'No se puede registrar un movimiento para un producto inactivo',
      );
    }

    const quantity =
      createMovimientoDto.quantity;

    if (
      createMovimientoDto.type === 'IN' &&
      quantity <= 0
    ) {
      throw new ConflictException(
        'La cantidad de una entrada debe ser mayor que cero',
      );
    }

    if (
      createMovimientoDto.type === 'OUT' &&
      quantity <= 0
    ) {
      throw new ConflictException(
        'La cantidad de una salida debe ser mayor que cero',
      );
    }

    if (
      createMovimientoDto.type === 'ADJUSTMENT' &&
      quantity === 0
    ) {
      throw new ConflictException(
        'El ajuste no puede tener una cantidad igual a cero',
      );
    }

    if (
      createMovimientoDto.type === 'ADJUSTMENT' &&
      userRole !== 'ADMIN'
    ) {
      throw new ConflictException(
        'Solo el ADMIN puede realizar ajustes de inventario',
      );
    }

    let newStock = product.stock;

    if (createMovimientoDto.type === 'IN') {
      newStock =
        product.stock + quantity;
    }

    if (createMovimientoDto.type === 'OUT') {
      if (product.stock < quantity) {
        throw new ConflictException(
          `Stock insuficiente. Stock disponible: ${product.stock}`,
        );
      }

      newStock =
        product.stock - quantity;
    }

    if (
      createMovimientoDto.type === 'ADJUSTMENT'
    ) {
      newStock =
        product.stock + quantity;

      if (newStock < 0) {
        throw new ConflictException(
          `El ajuste no puede dejar el stock en negativo. Stock actual: ${product.stock}`,
        );
      }
    }

    const result =
      await this.drizzle.db.transaction(
        async (tx) => {
          await tx
            .update(productos)
            .set({
              stock: newStock,
              updatedAt: new Date(),
            })
            .where(
              eq(productos.id, product.id),
            );

          const movement = await tx
            .insert(movimientosInventario)
            .values({
              productId: product.id,
              userId,
              type: createMovimientoDto.type,
              quantity,
              reason:
                createMovimientoDto.reason.trim(),
              referenceId:
                createMovimientoDto.referenceId,
            })
            .returning({
              id: movimientosInventario.id,
              productId:
                movimientosInventario.productId,
              userId:
                movimientosInventario.userId,
              type:
                movimientosInventario.type,
              quantity:
                movimientosInventario.quantity,
              reason:
                movimientosInventario.reason,
              referenceId:
                movimientosInventario.referenceId,
              createdAt:
                movimientosInventario.createdAt,
            });

          return movement[0];
        },
      );

    return {
      mensaje:
        'Movimiento de inventario registrado correctamente',
      datos: this.traducirMovimiento({
        ...result,
        previousStock: product.stock,
        newStock,
      }),
    };
  }

  async findAll() {
    const result = await this.drizzle.db
      .select({
        id: movimientosInventario.id,
        productId:
          movimientosInventario.productId,
        product: productos.name,
        userId:
          movimientosInventario.userId,
        user: usuarios.name,
        type:
          movimientosInventario.type,
        quantity:
          movimientosInventario.quantity,
        reason:
          movimientosInventario.reason,
        referenceId:
          movimientosInventario.referenceId,
        createdAt:
          movimientosInventario.createdAt,
      })
      .from(movimientosInventario)
      .innerJoin(
        productos,
        eq(
          movimientosInventario.productId,
          productos.id,
        ),
      )
      .innerJoin(
        usuarios,
        eq(
          movimientosInventario.userId,
          usuarios.id,
        ),
      )
      .where(
        isNull(movimientosInventario.deletedAt),
      )
      .orderBy(
        desc(movimientosInventario.createdAt),
      );

    return {
      mensaje:
        'Movimientos de inventario obtenidos correctamente',
      total: result.length,
      datos: result.map((movimiento) =>
        this.traducirMovimiento(movimiento),
      ),
    };
  }

  async findByProduct(productId: number) {
    const product = await this.drizzle.db
      .select({
        id: productos.id,
        name: productos.name,
      })
      .from(productos)
      .where(
        and(
          eq(productos.id, productId),
          isNull(productos.deletedAt),
        ),
      )
      .limit(1);

    if (product.length === 0) {
      throw new NotFoundException(
        'El producto no existe',
      );
    }

    const result = await this.drizzle.db
      .select({
        id: movimientosInventario.id,
        productId:
          movimientosInventario.productId,
        product: productos.name,
        userId:
          movimientosInventario.userId,
        user: usuarios.name,
        type:
          movimientosInventario.type,
        quantity:
          movimientosInventario.quantity,
        reason:
          movimientosInventario.reason,
        referenceId:
          movimientosInventario.referenceId,
        createdAt:
          movimientosInventario.createdAt,
      })
      .from(movimientosInventario)
      .innerJoin(
        productos,
        eq(
          movimientosInventario.productId,
          productos.id,
        ),
      )
      .innerJoin(
        usuarios,
        eq(
          movimientosInventario.userId,
          usuarios.id,
        ),
      )
      .where(
        and(
          eq(
            movimientosInventario.productId,
            productId,
          ),
          isNull(
            movimientosInventario.deletedAt,
          ),
        ),
      )
      .orderBy(
        desc(movimientosInventario.createdAt),
      );

    return {
      mensaje:
        'Movimientos del producto obtenidos correctamente',
      producto: {
        id: product[0].id,
        nombre: product[0].name,
      },
      total: result.length,
      datos: result.map((movimiento) =>
        this.traducirMovimiento(movimiento),
      ),
    };
  }
}