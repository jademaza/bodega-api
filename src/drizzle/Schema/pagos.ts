import {
  decimal,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { creditos } from './creditos';
import { usuarios } from './usuarios';

export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH',
  'YAPE',
  'PLIN',
  'CARD',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'COMPLETED',
  'CANCELLED',
]);

export const pagos = pgTable('pagos', {
  id: serial('id').primaryKey(),

  creditId: integer('credit_id')
    .notNull()
    .references(() => creditos.id),

  userId: integer('user_id')
    .notNull()
    .references(() => usuarios.id),

  amountReceived: decimal('amount_received', {
    precision: 10,
    scale: 2,
  }).notNull(),

  amountApplied: decimal('amount_applied', {
    precision: 10,
    scale: 2,
  }).notNull(),

  changeAmount: decimal('change_amount', {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default('0'),

  paymentMethod: paymentMethodEnum('payment_method')
    .notNull(),

  paymentDate: timestamp('payment_date', {
    withTimezone: false,
  })
    .notNull()
    .defaultNow(),

  status: paymentStatusEnum('status')
    .notNull()
    .default('COMPLETED'),

  notes: varchar('notes', {
    length: 255,
  }),

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
});