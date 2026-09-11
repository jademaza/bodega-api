import {
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const roleNameEnum = pgEnum('role_name', [
  'ADMIN',
  'VENDEDOR',
  'CONSULTOR',
]);

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),

  name: varchar('name', {
    length: 30,
  })
    .notNull()
    .unique(),

  createdAt: timestamp('created_at', {
    withTimezone: false,
  })
    .notNull()
    .defaultNow(),
});