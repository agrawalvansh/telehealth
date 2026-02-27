import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    role: 'patient' | 'doctor' | 'admin';
    firstName: string;
    lastName: string;
    isApproved: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isHydrated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isHydrated: false,
            login: (user, token) => {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                set({ user, token, isAuthenticated: true });
            },
            logout: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ user: null, token: null, isAuthenticated: false });
            },
            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),
            setHydrated: () => set({ isHydrated: true }),
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);

// Initialize from session on client side
if (typeof window !== 'undefined') {
    const restoreSession = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // No token stored, nothing to restore
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include'
            });

            if (response.ok) {
                const user = await response.json();
                useAuthStore.setState({ user, token, isAuthenticated: true });
                console.log('Session restored successfully');
            } else {
                // Token is invalid/expired, clear it
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
            }
        } catch (error) {
            console.error('Error restoring session:', error);
        } finally {
            useAuthStore.getState().setHydrated();
        }
    };

    restoreSession();
}
