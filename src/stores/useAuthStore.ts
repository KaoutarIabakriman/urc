import { create } from 'zustand'

export interface User {
    id: string
    username: string
    email: string
    externalId?: string
}

interface AuthState {
    user: User | null
    token: string | null
    isLoading: boolean
    isInitialized: boolean
    error: string | null
    login: (username: string, password: string) => Promise<void>
    register: (username: string, email: string, password: string) => Promise<void> // ✅ ADD THIS
    logout: () => void
    checkAuth: () => Promise<void>
    clearError: () => void
    initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isLoading: false,
    isInitialized: false,
    error: null,

    initialize: async () => {
        console.log('Initialisation du store auth...')
        await get().checkAuth()
    },

    register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
            console.log('Tentative inscription:', username, email)

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            })

            console.log('Réponse register - Status:', response.status)

            const textResponse = await response.text()
            console.log('Texte brut:', textResponse)

            let data
            try {
                data = JSON.parse(textResponse)
                console.log('JSON parsé:', data)
            } catch (parseError) {
                console.error('Erreur parsing JSON:', parseError)
                throw new Error('Réponse serveur invalide')
            }

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Erreur lors de l\'inscription')
            }

            if (!data.token || !data.user) {
                throw new Error('Données d\'inscription manquantes')
            }

            localStorage.setItem('auth_token', data.token)

            set({
                user: {
                    id: data.user.id.toString(),
                    username: data.user.username,
                    email: data.user.email,
                    externalId: data.user.externalId,
                },
                token: data.token,
                isLoading: false,
                isInitialized: true,
                error: null,
            })

            console.log('Inscription réussie!')
        } catch (error) {
            console.error('Erreur inscription:', error)
            set({
                user: null,
                token: null,
                isLoading: false,
                isInitialized: true,
                error: error instanceof Error ? error.message : 'Erreur lors de l\'inscription',
            })
            throw error
        }
    },

    login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
            console.log('Tentative de connexion:', username)

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            })

            console.log('Réponse login store - Status:', response.status)

            const textResponse = await response.text()
            let data
            try {
                data = JSON.parse(textResponse)
            } catch (parseError) {
                console.error('Erreur parsing JSON:', parseError)
                throw new Error('Réponse serveur invalide')
            }

            if (!response.ok) {
                throw new Error(data.error || 'Erreur de connexion')
            }

            if (!data.token || !data.user) {
                throw new Error('Données de connexion manquantes')
            }

            localStorage.setItem('auth_token', data.token)

            set({
                user: {
                    id: data.user.id.toString(),
                    username: data.user.username,
                    email: data.user.email,
                    externalId: data.user.externalId,
                },
                token: data.token,
                isLoading: false,
                isInitialized: true,
                error: null,
            })

            console.log('Store auth mis à jour')
        } catch (error) {
            console.error('Erreur login store:', error)
            set({
                user: null,
                token: null,
                isLoading: false,
                isInitialized: true,
                error: error instanceof Error ? error.message : 'Erreur de connexion',
            })
            throw error
        }
    },

    logout: () => {
        console.log('Déconnexion')
        localStorage.removeItem('auth_token')
        set({
            user: null,
            token: null,
            isInitialized: true,
            error: null,
        })
    },

    checkAuth: async () => {
        const token = localStorage.getItem('auth_token')

        if (!token) {
            console.log('Pas de token trouvé')
            set({ isInitialized: true, user: null, token: null })
            return
        }

        set({ isLoading: true })

        try {
            console.log('🔍 Vérification session avec token:', token.substring(0, 20) + '...')

            const response = await fetch('/lib/session', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            console.log('Réponse session - Status:', response.status)

            if (!response.ok) {
                console.log('Session invalide, nettoyage du token')
                localStorage.removeItem('auth_token')
                set({
                    user: null,
                    token: null,
                    isLoading: false,
                    isInitialized: true,
                })
                return
            }

            const data = await response.json()
            console.log('Session valide:', data)

            set({
                user: {
                    id: data.id?.toString() || data.user_id?.toString(),
                    username: data.username,
                    email: data.email,
                    externalId: data.externalId || data.external_id,
                },
                token,
                isLoading: false,
                isInitialized: true,
                error: null,
            })
        } catch (error) {
            console.error('Erreur vérification session:', error)
            localStorage.removeItem('auth_token')
            set({
                user: null,
                token: null,
                isLoading: false,
                isInitialized: true,
                error: error instanceof Error ? error.message : 'Erreur de session',
            })
        }
    },

    clearError: () => set({ error: null }),
}))