import type { BaziChart, Gender, Role, System } from '@tianji/shared';
import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** 登录账号。禁止存储明文密码，仅存 bcrypt 哈希。 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** 出生信息。v1 每个 User 一条（命主=本人）。 */
export const birthProfiles = sqliteTable('birth_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  birthDate: text('birth_date').notNull(), // YYYY-MM-DD（出生地墙钟）
  birthTime: text('birth_time'), // HH:mm，可空
  timeUnknown: integer('time_unknown', { mode: 'boolean' }).notNull(),
  birthplace: text('birthplace').notNull(),
  longitude: real('longitude').notNull(), // 东经为正，真太阳时校正用
  gender: text('gender').$type<Gender>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** 八字盘。对命主稳定，供命盘页展示；生辰变更则重算覆盖。data 为 BaziChart JSON。 */
export const baziCharts = sqliteTable('bazi_charts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  data: text('data', { mode: 'json' }).$type<BaziChart>().notNull(),
  computedAt: integer('computed_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** 登录会话。支撑登出吊销与 6h 滑动过期。见 ADR 0003。 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // sid，写入 JWT payload
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lastActivityAt: integer('last_activity_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** 对话。按命理系统分型，创建后不可改（见 ADR 0004）。favoritedAt 非空即收藏。 */
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  system: text('system').$type<System>().notNull(),
  title: text('title').notNull(),
  favoritedAt: integer('favorited_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** 消息。两系统聊天内容共用；奇门局作为 AI 生成内容嵌在 content。 */
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').$type<Role>().notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type UserRow = typeof users.$inferSelect;
export type BirthProfileRow = typeof birthProfiles.$inferSelect;
export type BaziChartRow = typeof baziCharts.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type ConversationRow = typeof conversations.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
