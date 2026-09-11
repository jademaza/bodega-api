import {
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { productos } from './productos';
import { usuarios } from './usuarios';

export const movementTypeEnum = pgEnum('movement_type', [
  'IN',
  'OUT',
  'ADJUSTMENT',
]);

export const movimientosInventario = pgTable('movimientos_inventario', {
  id: serial('id').primaryKey(),

  productId: integer('product_id')
    .notNull()
    .references(() => productos.id),

  userId: integer('user_id')
    .notNull()
    .references(() => usuarios.id),

  type: movementTypeEnum('type')
    .notNull(),

  quantity: integer('quantity')
    .notNull(),

  reason: varchar('reason', {
    length: 200,
  }).notNull(),

  referenceId: integer('reference_id'),

  createdAt: timestamp('created_at', {
    withTimezone: false,
  })
    .notNull()
    .defaultNow(),

  deletedAt: timestamp('deleted_at', {
    withTimezone: false,
  }),
});