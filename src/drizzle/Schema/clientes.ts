import {
  decimal,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { usuarios } from './usuarios';

export const customerStatusEnum = pgEnum('customer_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),

  name: varchar('name', {
    length: 80,
  }).notNull(),

  lastname: varchar('lastname', {
    length: 100,
  }).notNull(),

  dni: varchar('dni', {
    length: 8,
  })
    .notNull()
    .unique(),

  phone: varchar('phone', {
    length: 15,
  }).notNull(),

  address: varchar('address', {
    length: 200,
  }).notNull(),

  email: varchar('email', {
    length: 150,
  }),

  creditLimit: decimal('credit_limit', {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default('0'),

  status: customerStatusEnum('status')
    .notNull()
    .default('ACTIVE'),

  userId: integer('user_id')
    .notNull()
    .references(() => usuarios.id),

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