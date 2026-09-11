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

export const productStatusEnum = pgEnum('product_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const productos = pgTable('productos', {
  id: serial('id').primaryKey(),

  name: varchar('name', {
    length: 120,
  }).notNull(),

  description: varchar('description', {
    length: 255,
  }),

  category: varchar('category', {
    length: 80,
  }).notNull(),

  price: decimal('price', {
    precision: 10,
    scale: 2,
  }).notNull(),

  stock: integer('stock')
    .notNull()
    .default(0),

  unit: varchar('unit', {
    length: 30,
  }).notNull(),

  barcode: varchar('barcode', {
    length: 50,
  }).unique(),

  status: productStatusEnum('status')
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