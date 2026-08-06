import { z } from 'zod';
import { SystemSchema } from './common';

export const CreateConversationInputSchema = z.object({
  system: SystemSchema,
  title: z.string().trim().min(1).max(60).optional(),
});
export type CreateConversationInput = z.infer<typeof CreateConversationInputSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  system: SystemSchema,
  title: z.string(),
  favorited: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const SetFavoriteInputSchema = z.object({
  favorited: z.boolean(),
});
export type SetFavoriteInput = z.infer<typeof SetFavoriteInputSchema>;
