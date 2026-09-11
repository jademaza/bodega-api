import {
  decimal,
  integer,
  pgTable,
  serial,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import { creditos } from './creditos';
import { productos } from './productos';

export const detallesCredito = pgTable(
  'detalles_credito',
  {
    id: serial('id').primaryKey(),

    creditId: integer('credit_id')
      .notNull()
      .references(() => creditos.id),

    productId: integer('product_id')
      .notNull()
      .references(() => productos.id),

    quantity: integer('quantity')
      .notNull(),

    unitPrice: decimal('unit_price', {
      precision: 10,
      scale: 2,
    }).notNull(),

    subtotal: decimal('subtotal', {
      precision: 10,
      scale: 2,
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: false,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', {
      withTimezone: false,
    })
      .notNull()
      .defaultNow(),

    deletedAt: timestamp('deleted_at', {
      withTimezone: false,
    }),
  },
  (table) => ({
    creditProductUnique: unique().on(
      table.creditId,
      table.productId,
    ),
  }),
);