import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, desc, eq, isNull } from 'drizzle-orm';

import { DrizzleService } from '../drizzle/drizzle.service';
import { creditos } from '../drizzle/Schema/creditos';
import { pagos } from '../drizzle/Schema/pagos';
import { clientes } from '../drizzle/Schema/clientes';
import { usuarios } from '../drizzle/Schema/usuarios';

import { CreatePagoDto } from './dto/create-pago.dto';

@Injectable()
export class PagosService {
  constructor(
    private readonly drizzle: DrizzleService,
  ) {}

  private traducirMetodo(metodo: string) {
    const metodos: Record<string, string> = {
      CASH: 'EFECTIVO',
      YAPE: 'YAPE',
      PLIN: 'PLIN',
      CARD: 'TARJETA',
    };

    return metodos[metodo] ?? metodo;
  }

  private traducirEstadoPago(estado: string) {
    const estados: Record<string, string> = {
      COMPLETED: 'COMPLETADO',
      CANCELLED: 'CANCELADO',
    };

    return estados[estado] ?? estado;
  }

  private traducirEstadoCredito(estado: string) {
    const estados: Record<string, string> = {
      PENDING: 'PENDIENTE',
      PARTIAL: 'PARCIAL',
      PAID: 'PAGADO',
      OVERDUE: 'VENCIDO',
      CANCELLED: 'CANCELADO',
    };

    return estados[estado] ?? estado;
  }

  private traducirPago(pago: any) {
    return {
      id: pago.id,
      creditoId: pago.creditId,
      ...(pago.customerId !== undefined && {
        clienteId: pago.customerId,
      }),
      ...(pago.customer !== undefined && {
        cliente: pago.customer,
      }),
      ...(pago.lastname !== undefined && {
        apellido: pago.lastname,
      }),
      usuarioId: pago.userId,
      ...(pago.user !== undefined && {
        usuario: pago.user,
      }),
      montoRecibido: pago.amountReceived,
      montoAplicado: pago.amountApplied,
      vuelto: pago.changeAmount,
      metodoPago: this.traducirMetodo(
        pago.paymentMethod,
      ),
      ...(pago.paymentDate !== undefined && {
        fechaPago: pago.paymentDate,
      }),
      estado: this.traducirEstadoPago(
        pago.status,
      ),
      ...(pago.notes !== undefined && {
        notas: pago.notes,
      }),
      ...(pago.createdAt !== undefined && {
        creadoEn: pago.createdAt,
      }),
    };
  }

  async create(
    creditId: number,
    dto: CreatePagoDto,
    userId: number,
  ) {
    return this.drizzle.db.transaction(
      async (tx) => {
        const creditResult = await tx
          .select({
            id: creditos.id,
            total: creditos.total,
            status: creditos.status,
            customerId: creditos.customerId,
            customer: clientes.name,
            lastname: clientes.lastname,
          })
          .from(creditos)
          .innerJoin(
            clientes,
            eq(
              creditos.customerId,
              clientes.id,
            ),
          )
          .where(
            and(
              eq(creditos.id, creditId),
              isNull(creditos.deletedAt),
            ),
          )
          .limit(1);

        const credit = creditResult[0];

        if (!credit) {
          throw new NotFoundException(
            'El crédito no existe',
          );
        }

        if (
          credit.status === 'PAID' ||
          credit.status === 'CANCELLED'
        ) {
          throw new ConflictException(
            'El crédito ya está pagado o cancelado',
          );
        }

        const previousPayments = await tx
          .select({
            amountApplied:
              pagos.amountApplied,
          })
          .from(pagos)
          .where(
            and(
              eq(pagos.creditId, creditId),
              eq(pagos.status, 'COMPLETED'),
              isNull(pagos.deletedAt),
            ),
          );

        const totalPaid =
          previousPayments.reduce(
            (sum, payment) =>
              sum +
              Number(payment.amountApplied),
            0,
          );

        const totalCredit =
          Number(credit.total);

        const balance = Math.max(
          totalCredit - totalPaid,
          0,
        );

        if (balance <= 0) {
          throw new ConflictException(
            'El crédito ya no tiene saldo pendiente',
          );
        }

        const received =
          Number(dto.amountReceived);

        const applied = Math.min(
          received,
          balance,
        );

        const change = Math.max(
          received - balance,
          0,
        );

        const newBalance =
          balance - applied;

        const newStatus =
          newBalance <= 0
            ? 'PAID'
            : 'PARTIAL';

        const paymentResult = await tx
          .insert(pagos)
          .values({
            creditId,
            userId,
            amountReceived:
              received.toFixed(2),
            amountApplied:
              applied.toFixed(2),
            changeAmount:
              change.toFixed(2),
            paymentMethod:
              dto.paymentMethod,
            status: 'COMPLETED',
            notes: dto.notes?.trim(),
          })
          .returning();

        await tx
          .update(creditos)
          .set({
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(
            eq(creditos.id, creditId),
          );

        return {
          mensaje:
            'Pago registrado correctamente',

          datos: this.traducirPago(
            paymentResult[0],
          ),

          credito: {
            total:
              totalCredit.toFixed(2),
            pagado:
              (totalPaid + applied).toFixed(2),
            saldo:
              newBalance.toFixed(2),
            estado:
              this.traducirEstadoCredito(
                newStatus,
              ),
          },
        };
      },
    );
  }

  async findAll() {
    const result = await this.drizzle.db
      .select({
        id: pagos.id,
        creditId: pagos.creditId,
        customerId: creditos.customerId,
        customer: clientes.name,
        lastname: clientes.lastname,
        userId: pagos.userId,
        user: usuarios.name,
        amountReceived:
          pagos.amountReceived,
        amountApplied:
          pagos.amountApplied,
        changeAmount:
          pagos.changeAmount,
        paymentMethod:
          pagos.paymentMethod,
        paymentDate:
          pagos.paymentDate,
        status: pagos.status,
        notes: pagos.notes,
        createdAt:
          pagos.createdAt,
      })
      .from(pagos)
      .innerJoin(
        creditos,
        eq(
          pagos.creditId,
          creditos.id,
        ),
      )
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
          pagos.userId,
          usuarios.id,
        ),
      )
      .where(isNull(pagos.deletedAt))
      .orderBy(desc(pagos.createdAt));

    return {
      mensaje: 'Pagos obtenidos correctamente',
      total: result.length,
      datos: result.map((pago) =>
        this.traducirPago(pago),
      ),
    };
  }

  async findByCredit(
    creditId: number,
  ) {
    const credit = await this.drizzle.db
      .select({ id: creditos.id })
      .from(creditos)
      .where(
        and(
          eq(creditos.id, creditId),
          isNull(creditos.deletedAt),
        ),
      )
      .limit(1);

    if (credit.length === 0) {
      throw new NotFoundException(
        'El crédito no existe',
      );
    }

    const result = await this.drizzle.db
      .select({
        id: pagos.id,
        creditId: pagos.creditId,
        userId: pagos.userId,
        user: usuarios.name,
        amountReceived:
          pagos.amountReceived,
        amountApplied:
          pagos.amountApplied,
        changeAmount:
          pagos.changeAmount,
        paymentMethod:
          pagos.paymentMethod,
        paymentDate:
          pagos.paymentDate,
        status: pagos.status,
        notes: pagos.notes,
      })
      .from(pagos)
      .innerJoin(
        usuarios,
        eq(
          pagos.userId,
          usuarios.id,
        ),
      )
      .where(
        and(
          eq(pagos.creditId, creditId),
          isNull(pagos.deletedAt),
        ),
      )
      .orderBy(desc(pagos.createdAt));

    return {
      mensaje:
        'Pagos del crédito obtenidos correctamente',
      total: result.length,
      datos: result.map((pago) =>
        this.traducirPago(pago),
      ),
    };
  }
}