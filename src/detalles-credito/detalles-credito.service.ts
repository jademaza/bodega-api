import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  and,
  eq,
  isNull,
} from 'drizzle-orm';

import { DrizzleService } from '../drizzle/drizzle.service';

import { creditos } from '../drizzle/Schema/creditos';
import { detallesCredito } from '../drizzle/Schema/detalles-credito';
import { productos } from '../drizzle/Schema/productos';

@Injectable()
export class DetallesCreditoService {
  constructor(
    private readonly drizzle: DrizzleService,
  ) {}

  private traducirDetalle(
    detalle: any,
  ) {
    return {
      id: detalle.id,
      creditoId: detalle.creditId,
      productoId: detalle.productId,
      ...(detalle.product !== undefined && {
        producto: detalle.product,
      }),
      cantidad: detalle.quantity,
      precioUnitario: detalle.unitPrice,
      subtotal: detalle.subtotal,
      ...(detalle.createdAt !== undefined && {
        creadoEn: detalle.createdAt,
      }),
      ...(detalle.updatedAt !== undefined && {
        actualizadoEn: detalle.updatedAt,
      }),
      ...(detalle.deletedAt !== undefined && {
        eliminadoEn: detalle.deletedAt,
      }),
    };
  }

  async findAll() {
    const result =
      await this.drizzle.db
        .select({
          id: detallesCredito.id,
          creditId: detallesCredito.creditId,
          productId: detallesCredito.productId,
          product: productos.name,
          quantity: detallesCredito.quantity,
          unitPrice: detallesCredito.unitPrice,
          subtotal: detallesCredito.subtotal,
          createdAt: detallesCredito.createdAt,
          updatedAt: detallesCredito.updatedAt,
        })
        .from(detallesCredito)
        .innerJoin(
          productos,
          eq(
            detallesCredito.productId,
            productos.id,
          ),
        )
        .where(
          isNull(
            detallesCredito.deletedAt,
          ),
        );

    return {
      mensaje:
        'Detalles obtenidos correctamente',
      total: result.length,
      datos: result.map(
        (detalle) =>
          this.traducirDetalle(
            detalle,
          ),
      ),
    };
  }

  async findByCredit(
    creditId: number,
  ) {
    const credit =
      await this.drizzle.db
        .select({
          id: creditos.id,
        })
        .from(creditos)
        .where(
          and(
            eq(
              creditos.id,
              creditId,
            ),
            isNull(
              creditos.deletedAt,
            ),
          ),
        )
        .limit(1);

    if (credit.length === 0) {
      throw new NotFoundException(
        'El crédito no existe',
      );
    }

    const result =
      await this.drizzle.db
        .select({
          id: detallesCredito.id,
          creditId: detallesCredito.creditId,
          productId: detallesCredito.productId,
          product: productos.name,
          quantity: detallesCredito.quantity,
          unitPrice: detallesCredito.unitPrice,
          subtotal: detallesCredito.subtotal,
          createdAt: detallesCredito.createdAt,
          updatedAt: detallesCredito.updatedAt,
        })
        .from(detallesCredito)
        .innerJoin(
          productos,
          eq(
            detallesCredito.productId,
            productos.id,
          ),
        )
        .where(
          and(
            eq(
              detallesCredito.creditId,
              creditId,
            ),
            isNull(
              detallesCredito.deletedAt,
            ),
          ),
        );

    return {
      mensaje:
        'Detalles del crédito obtenidos correctamente',
      total: result.length,
      datos: result.map(
        (detalle) =>
          this.traducirDetalle(
            detalle,
          ),
      ),
    };
  }

  async remove(id: number) {
    const detalle =
      await this.drizzle.db
        .select({
          id: detallesCredito.id,
          creditId: detallesCredito.creditId,
          productId: detallesCredito.productId,
          quantity: detallesCredito.quantity,
          deletedAt:
            detallesCredito.deletedAt,
        })
        .from(detallesCredito)
        .where(
          and(
            eq(
              detallesCredito.id,
              id,
            ),
            isNull(
              detallesCredito.deletedAt,
            ),
          ),
        )
        .limit(1);

    if (detalle.length === 0) {
      throw new NotFoundException(
        'El detalle del crédito no existe o ya fue eliminado',
      );
    }

    const credit =
      await this.drizzle.db
        .select({
          id: creditos.id,
          status: creditos.status,
          deletedAt:
            creditos.deletedAt,
        })
        .from(creditos)
        .where(
          and(
            eq(
              creditos.id,
              detalle[0].creditId,
            ),
            isNull(
              creditos.deletedAt,
            ),
          ),
        )
        .limit(1);

    if (credit.length === 0) {
      throw new ConflictException(
        'No se puede eliminar el detalle porque el crédito asociado no existe o ya fue eliminado',
      );
    }

    await this.drizzle.db
      .update(detallesCredito)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            detallesCredito.id,
            id,
          ),
          isNull(
            detallesCredito.deletedAt,
          ),
        ),
      );

    return {
      mensaje:
        'Detalle del crédito eliminado lógicamente correctamente',
      datos: {
        id: detalle[0].id,
        creditoId:
          detalle[0].creditId,
        productoId:
          detalle[0].productId,
        cantidad:
          detalle[0].quantity,
      },
    };
  }
}