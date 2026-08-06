import type {
  AuthResponse,
  BaziChart,
  BirthProfileInput,
  Conversation,
  CreateConversationInput,
  LoginInput,
  Message,
  PublicUser,
  RegisterInput,
} from '@tianji/shared';
import { apiFetch } from './client';

export const AuthApi = {
  register: (input: RegisterInput) =>
    apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
      auth: false,
    }),
  login: (input: LoginInput) =>
    apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
      auth: false,
    }),
  me: () => apiFetch<PublicUser>('/api/account/me'),
  logout: () => apiFetch<{ ok: boolean }>('/api/account/logout', { method: 'POST' }),
};

export const BirthApi = {
  get: () => apiFetch<BirthProfileInput>('/api/birth-profile'),
  save: (input: BirthProfileInput) =>
    apiFetch<{ ok: boolean; chart: BaziChart }>('/api/birth-profile', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
};

export const ChartApi = {
  get: () => apiFetch<BaziChart>('/api/bazi-chart'),
};

export const ConversationApi = {
  list: (favorited?: boolean) =>
    apiFetch<Conversation[]>(`/api/conversations${favorited ? '?favorited=true' : ''}`),
  create: (input: CreateConversationInput) =>
    apiFetch<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  favorite: (id: string, favorited: boolean) =>
    apiFetch<Conversation>(`/api/conversations/${id}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ favorited }),
    }),
  messages: (id: string) => apiFetch<Message[]>(`/api/conversations/${id}/messages`),
};
