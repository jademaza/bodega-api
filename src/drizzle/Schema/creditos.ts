import {
  decimal,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { clientes } from './clientes';
import { usuarios } from './usuarios';

export const creditStatusEnum = pgEnum('credit_status', [
  'PENDING',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'CANCELLED',
]);

export const creditos = pgTable('creditos', {
  id: serial('id').primaryKey(),

  customerId: integer('customer_id')
    .notNull()
    .references(() => clientes.id),

  userId: integer('user_id')
    .notNull()
    .references(() => usuarios.id),

  creditDate: timestamp('credit_date', {
    withTimezone: false,
  })
    .notNull()
    .defaultNow(),

  dueDate: timestamp('due_date', {
    withTimezone: false,
  }).notNull(),

  total: decimal('total', {
    precision: 10,
    scale: 2,
  }).notNull(),

  status: creditStatusEnum('status')
    .notNull()
    .default('PENDING'),

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