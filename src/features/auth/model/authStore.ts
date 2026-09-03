import { create } from 'zustand';
import type { AuthSession, AuthStatus, User } from './auth.types';
import { authApi } from '../api/authApi';
import type { LoginInput } from './auth.schema';

interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  error: string | null;
  bootstrap: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Auth is read by nearly everything and changes ~twice a day. Kept deliberately
 * separate from the workout session store, which changes on every rep tap.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  session: null,
  error: null,

  bootstrap: async () => {
    set({ status: 'loading' });
    try {
      const session = await authApi.getSession();
      set({ session, status: session ? 'authenticated' : 'unauthenticated' });
    } catch {
      set({ session: null, status: 'unauthenticated' });
    }
  },

  signIn: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const session = await authApi.signIn(input);
      set({ session, status: 'authenticated' });
    } catch (e) {
      set({
        status: 'unauthenticated',
        error: e instanceof Error ? e.message : 'auth.error.sign_in_failed',
      });
    }
  },

  signOut: async () => {
    await authApi.signOut();
    set({ session: null, status: 'unauthenticated' });
  },
}));

export const selectUser = (s: AuthState): User | null => s.session?.user ?? null;
export const selectIsAuthed = (s: AuthState) => s.status === 'authenticated';
