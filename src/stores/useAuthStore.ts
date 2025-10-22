// stores/useAuthStore.ts
import { create } from 'zustand'

interface User {
    id: string
    username: string
    email: string
}

interface AuthState {
    token: string | null
    user: User | null
    isLoggedIn: boolean
    isLoading: boolean
    login: (token: string, user: User) => void
    logout: () => void
    setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('token'),
    user: null,
    isLoggedIn: !!localStorage.getItem('token'),
    isLoading: false,
    login: (token: string, user: User) => {
        localStorage.setItem('token', token)
        set({ token, user, isLoggedIn: true, isLoading: false })
    },
    logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null, isLoggedIn: false, isLoading: false })
    },
    setLoading: (loading: boolean) => set({ isLoading: loading })
}))