import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  and,
  desc,
  eq,
  isNull,
} from 'drizzle-orm';

import { DrizzleService } from '../drizzle/drizzle.service';

import { clientes } from '../drizzle/Schema/clientes';
import { creditos } from '../drizzle/Schema/creditos';
import { detallesCredito } from '../drizzle/Schema/detalles-credito';
import { productos } from '../drizzle/Schema/productos';
import { usuarios } from '../drizzle/Schema/usuarios';
import { movimientosInventario } from '../drizzle/Schema/movimientos-inventario';

import { UpdateCreditoDto } from './dto/update-credito.dto';
import { CreateCreditoDto } from './dto/create-credito.dto';

@Injectable()
export class CreditosService {
  constructor(
    private readonly drizzle: DrizzleService,
  ) {}

  private traducirEstado(estado: string) {
    const estados: Record<string, string> = {
      PENDING: 'PENDIENTE',
      PARTIAL: 'PARCIAL',
      PAID: 'PAGADO',
      OVERDUE: 'VENCIDO',
      CANCELLED: 'CANCELADO',
    };

    return estados[estado] ?? estado;
  }

  private traducirDetalle(detalle: any) {
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
    };
  }

  private traducirCredito(credito: any) {
    return {
      id: credito.id,
      clienteId: credito.customerId,
      ...(credito.customer !== undefined && {
        cliente: credito.customer,
      }),
      ...(credito.lastname !== undefined && {
        apellidoCliente: credito.lastname,
      }),
      usuarioId: credito.userId,
      ...(credito.seller !== undefined && {
        vendedor: credito.seller,
      }),
      fechaCredito: credito.creditDate,
      fechaVencimiento: credito.dueDate,
      total: credito.total,
      estado: this.traducirEstado(
        credito.status,
      ),
      notas: credito.notes,
      ...(credito.createdAt !== undefined && {
        creadoEn: credito.createdAt,
      }),
      ...(credito.updatedAt !== undefined && {
        actualizadoEn: credito.updatedAt,
      }),
      ...(credito.deletedAt !== undefined && {
        eliminadoEn: credito.deletedAt,
      }),
      ...(credito.details !== undefined && {
        detalles: credito.details.map(
          (detalle: any) =>
            this.traducirDetalle(detalle),
        ),
      }),
    };
  }

  async create(
    createCreditoDto: CreateCreditoDto,
    userId: number,
  ) {
    if (
      createCreditoDto.details.length === 0
    ) {
      throw new ConflictException(
        'El crédito debe contener al menos un producto',
      );
    }

    const customerResult =
      await this.drizzle.db
        .select({
          id: clientes.id,
          name: clientes.name,
          lastname: clientes.lastname,
          creditLimit:
            clientes.creditLimit,
          status: clientes.status,
        })
        .from(clientes)
        .where(
          and(
            eq(
              clientes.id,
              createCreditoDto.customerId,
            ),
            isNull(clientes.deletedAt),
          ),
        )
        .limit(1);

    const customer =
      customerResult[0];

    if (!customer) {
      throw new NotFoundException(
        'El cliente no existe',
      );
    }

    if (customer.status !== 'ACTIVE') {
      throw new ConflictException(
        'No se puede generar un crédito para un cliente inactivo',
      );
    }

    const existingCredits =
      await this.drizzle.db
        .select({
          total: creditos.total,
          status: creditos.status,
        })
        .from(creditos)
        .where(
          and(
            eq(
              creditos.customerId,
              customer.id,
            ),
            isNull(creditos.deletedAt),
          ),
        );

    const currentOutstanding =
      existingCredits.reduce(
        (sum, credit) => {
          if (
            credit.status === 'PENDING' ||
            credit.status === 'PARTIAL' ||
            credit.status === 'OVERDUE'
          ) {
            return (
              sum + Number(credit.total)
            );
          }

          return sum;
        },
        0,
      );

    const detailsData: {
      productId: number;
      quantity: number;
      unitPrice: string;
      subtotal: string;
    }[] = [];

    let total = 0;

    for (
      const detail of
        createCreditoDto.details
    ) {
      const productResult =
        await this.drizzle.db
          .select({
            id: productos.id,
            name: productos.name,
            price: productos.price,
            stock: productos.stock,
            status: productos.status,
            deletedAt:
              productos.deletedAt,
          })
          .from(productos)
          .where(
            and(
              eq(
                productos.id,
                detail.productId,
              ),
              isNull(
                productos.deletedAt,
              ),
            ),
          )
          .limit(1);

      const product =
        productResult[0];

      if (!product) {
        throw new NotFoundException(
          `El producto ${detail.productId} no existe`,
        );
      }

      if (product.status !== 'ACTIVE') {
        throw new ConflictException(
          `El producto ${product.name} está inactivo`,
        );
      }

      if (
        product.stock <
        detail.quantity
      ) {
        throw new ConflictException(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
        );
      }

      const unitPrice =
        Number(product.price);

      const subtotal =
        unitPrice *
        detail.quantity;

      total += subtotal;

      detailsData.push({
        productId:
          product.id,
        quantity:
          detail.quantity,
        unitPrice:
          unitPrice.toFixed(2),
        subtotal:
          subtotal.toFixed(2),
      });
    }

    const creditLimit =
      Number(
        customer.creditLimit,
      );

    if (
      currentOutstanding +
        total >
      creditLimit
    ) {
      throw new ConflictException(
        `El crédito supera el límite disponible. Límite: ${creditLimit.toFixed(
          2,
        )}, deuda actual: ${currentOutstanding.toFixed(
          2,
        )}, nuevo crédito: ${total.toFixed(
          2,
        )}`,
      );
    }

    const result =
      await this.drizzle.db.transaction(
        async (tx) => {
          const creditResult =
            await tx
              .insert(creditos)
              .values({
                customerId:
                  customer.id,
                userId,
                dueDate:
                  new Date(
                    createCreditoDto.dueDate,
                  ),
                total:
                  total.toFixed(2),
                status: 'PENDING',
                notes:
                  createCreditoDto.notes?.trim(),
              })
              .returning();

          const credit =
            creditResult[0];

          for (
            const detail of
              detailsData
          ) {
            await tx
              .insert(
                detallesCredito,
              )
              .values({
                creditId:
                  credit.id,
                productId:
                  detail.productId,
                quantity:
                  detail.quantity,
                unitPrice:
                  detail.unitPrice,
                subtotal:
                  detail.subtotal,
              });

            const product =
              await tx
                .select({
                  stock:
                    productos.stock,
                  name:
                    productos.name,
                })
                .from(productos)
                .where(
                  eq(
                    productos.id,
                    detail.productId,
                  ),
                )
                .limit(1);

            if (
              !product[0] ||
              product[0].stock <
                detail.quantity
            ) {
              throw new ConflictException(
                `Stock insuficiente para ${detail.productId}`,
              );
            }

            await tx
              .update(productos)
              .set({
                stock:
                  product[0].stock -
                  detail.quantity,
                updatedAt:
                  new Date(),
              })
              .where(
                eq(
                  productos.id,
                  detail.productId,
                ),
              );

            await tx
              .insert(
                movimientosInventario,
              )
              .values({
                productId:
                  detail.productId,
                userId,
                type: 'OUT',
                quantity:
                  detail.quantity,
                reason:
                  `Salida por crédito #${credit.id}`,
                referenceId:
                  credit.id,
              });
          }

          return credit;
        },
      );

    return {
      mensaje:
        'Crédito creado correctamente',
      datos: this.traducirCredito(
        result,
      ),
    };
  }

  async findAll() {
    const result =
      await this.drizzle.db
        .select({
          id: creditos.id,
          customerId:
            creditos.customerId,
          customer:
            clientes.name,
          lastname:
            clientes.lastname,
          userId:
            creditos.userId,
          seller:
            usuarios.name,
          creditDate:
            creditos.creditDate,
          dueDate:
            creditos.dueDate,
          total:
            creditos.total,
          status:
            creditos.status,
          notes:
            creditos.notes,
          createdAt:
            creditos.createdAt,
        })
        .from(creditos)
        .innerJoin(
          clientes,
          eq(
            creditos.customerId,
            clientes.id,
          ),
        )
        .innerJoin(
          usuarios,
          eq(
            creditos.userId,
            usuarios.id,
          ),
        )
        .where(
          isNull(
            creditos.deletedAt,
          ),
        )
        .orderBy(
          desc(
            creditos.createdAt,
          ),
        );

    return {
      mensaje:
        'Créditos obtenidos correctamente',
      total: result.length,
      datos: result.map(
        (credito) =>
          this.traducirCredito(
            credito,
          ),
      ),
    };
  }

  async findOne(id: number) {
    const creditResult =
      await this.drizzle.db
        .select({
          id: creditos.id,
          customerId:
            creditos.customerId,
          customer:
            clientes.name,
          lastname:
            clientes.lastname,
          userId:
            creditos.userId,
          seller:
            usuarios.name,
          creditDate:
            creditos.creditDate,
          dueDate:
            creditos.dueDate,
          total:
            creditos.total,
          status:
            creditos.status,
          notes:
            creditos.notes,
          createdAt:
            creditos.createdAt,
        })
        .from(creditos)
        .innerJoin(
          clientes,
          eq(
            creditos.customerId,
            clientes.id,
          ),
        )
        .innerJoin(
          usuarios,
          eq(
            creditos.userId,
            usuarios.id,
          ),
        )
        .where(
          and(
            eq(
              creditos.id,
              id,
            ),
            isNull(
              creditos.deletedAt,
            ),
          ),
        )
        .limit(1);

    if (
      creditResult.length === 0
    ) {
      throw new NotFoundException(
        'El crédito no existe',
      );
    }

    const details =
      await this.drizzle.db
        .select({
          id:
            detallesCredito.id,
          productId:
            detallesCredito.productId,
          product:
            productos.name,
          quantity:
            detallesCredito.quantity,
          unitPrice:
            detallesCredito.unitPrice,
          subtotal:
            detallesCredito.subtotal,
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
              id,
            ),
            isNull(
              detallesCredito.deletedAt,
            ),
          ),
        );

    return {
      mensaje:
        'Crédito obtenido correctamente',
      datos: this.traducirCredito({
        ...creditResult[0],
        details,
      }),
    };
  }

  async update(
    id: number,
    updateCreditoDto: UpdateCreditoDto,
  ) {
    const existing =
      await this.drizzle.db
        .select()
        .from(creditos)
        .where(
          and(
            eq(
              creditos.id,
              id,
            ),
            isNull(
              creditos.deletedAt,
            ),
          ),
        )
        .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException(
        'El crédito no existe',
      );
    }

    if (
      updateCreditoDto.customerId
    ) {
      throw new ConflictException(
        'El cliente de un crédito no puede modificarse',
      );
    }

    if (
      updateCreditoDto.details
    ) {
      throw new ConflictException(
        'Los detalles de un crédito no pueden modificarse directamente',
      );
    }

    const updateData: {
      dueDate?: Date;
      notes?: string;
      updatedAt: Date;
    } = {
      updatedAt:
        new Date(),
    };

    if (
      updateCreditoDto.dueDate
    ) {
      updateData.dueDate =
        new Date(
          updateCreditoDto.dueDate,
        );
    }

    if (
      updateCreditoDto.notes !==
      undefined
    ) {
      updateData.notes =
        updateCreditoDto.notes.trim();
    }

    const result =
      await this.drizzle.db
        .update(creditos)
        .set(updateData)
        .where(
          eq(
            creditos.id,
            id,
          ),
        )
        .returning();

    return {
      mensaje:
        'Crédito actualizado correctamente',
      datos: this.traducirCredito(
        result[0],
      ),
    };
  }

  async remove(id: number) {
    const credit =
      await this.drizzle.db
        .select({
          id: creditos.id,
          status:
            creditos.status,
        })
        .from(creditos)
        .where(
          and(
            eq(
              creditos.id,
              id,
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

    const activeDetails =
      await this.drizzle.db
        .select({
          id:
            detallesCredito.id,
        })
        .from(detallesCredito)
        .where(
          and(
            eq(
              detallesCredito.creditId,
              id,
            ),
            isNull(
              detallesCredito.deletedAt,
            ),
          ),
        )
        .limit(1);

    if (
      activeDetails.length > 0
    ) {
      throw new ConflictException(
        'No se puede eliminar el crédito porque tiene detalles activos',
      );
    }

    await this.drizzle.db
      .update(creditos)
      .set({
        deletedAt:
          new Date(),
        status:
          'CANCELLED',
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          creditos.id,
          id,
        ),
      );

    return {
      mensaje:
        'Crédito eliminado lógicamente correctamente',
    };
  }
}