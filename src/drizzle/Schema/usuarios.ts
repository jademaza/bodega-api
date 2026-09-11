import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { roles } from './roles';

export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),

  name: varchar('name', {
    length: 100,
  }).notNull(),

  email: varchar('email', {
    length: 150,
  })
    .notNull()
    .unique(),

  password: varchar('password', {
    length: 255,
  }).notNull(),

  roleId: integer('role_id')
    .notNull()
    .references(() => roles.id),

  createdAt: timestamp('created_at', {
    withTimezone: false,
  })
    .notNull()
    .defaultNow(),
});