import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const notebooks=sqliteTable('notebooks',{
 id:text('id').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),ownerHash:text('owner_hash').notNull(),recipientHash:text('recipient_hash'),recipientName:text('recipient_name'),recipientExpires:integer('recipient_expires'),expires:integer('expires').notNull(),
});
export const quotas=sqliteTable('quotas',{key:text('key').primaryKey(),count:integer('count').notNull().default(0),expires:integer('expires').notNull()});
