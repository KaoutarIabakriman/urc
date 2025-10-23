import { create } from 'zustand'

export interface User {
    id: string
    username: string
    email: string
    external_id?: string
    last_connection?: string
}

export interface Message {
    id: string
    content: string
    sender_id: string
    sender_username: string
    timestamp: Date | string
    conversation_id: string
    type: 'private' | 'group'
}

export interface Conversation {
    id: string
    name: string
    type: 'private' | 'group'
    target_user_id?: string
    last_message?: string
    unread_count?: number
}

interface ChatState {
    users: User[]
    messages: Message[]
    currentConversation: Conversation | null
    isLoading: boolean
    isSending: boolean
    error: string | null
    fetchUsers: () => Promise<void>
    loadMessages: (targetUserId: string) => Promise<void>
    sendMessage: (content: string, targetUserId: string) => Promise<void>
    setCurrentConversation: (conversation: Conversation | null) => void
    createPrivateConversation: (user: User) => Conversation
    clearError: () => void
}

// 🔥 FONCTION POUR OBTENIR LES HEADERS AVEC TOKEN
const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')

    console.log('🔍 getAuthHeaders - Token présent:', !!token)
    if (token) {
        console.log('🔍 getAuthHeaders - Token preview:', token.substring(0, 30) + '...')
    }

    if (!token) {
        console.error('❌ Token manquant dans localStorage')
        throw new Error('Token manquant - Veuillez vous reconnecter')
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
}

export const useChatStore = create<ChatState>((set, get) => ({
    users: [],
    messages: [],
    currentConversation: null,
    isLoading: false,
    isSending: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null })

        try {
            const token = localStorage.getItem('auth_token')
            console.log('📡 Récupération utilisateurs...')
            console.log('🔑 Token disponible:', token ? `${token.substring(0, 30)}...` : 'AUCUN TOKEN')

            const headers = getAuthHeaders()
            console.log('📋 Headers envoyés:', headers)

            const response = await fetch('/api/users', {
                method: 'GET',
                headers: headers,
            })

            console.log('📥 Réponse users - Status:', response.status)

            if (response.status === 401) {
                throw new Error('Session expirée - Veuillez vous reconnecter')
            }

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}`)
            }

            const data = await response.json()
            console.log('✅ Utilisateurs récupérés:', data.length)

            set({ users: data, isLoading: false })
        } catch (error) {
            console.error('❌ Erreur récupération utilisateurs:', error)
            set({
                error: error instanceof Error ? error.message : 'Erreur de chargement',
                isLoading: false,
            })
            throw error
        }
    },

    loadMessages: async (targetUserId: string) => {
        set({ isLoading: true, error: null })

        try {
            console.log('📨 Chargement messages pour:', targetUserId)

            // 🔥 CORRECTION: Utiliser targetUserId au lieu de userId
            const response = await fetch(`/api/messages?targetUserId=${targetUserId}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            })

            console.log('📥 Réponse messages - Status:', response.status)

            if (response.status === 401) {
                throw new Error('Session expirée - Veuillez vous reconnecter')
            }

            if (!response.ok) {
                const errorData = await response.json()
                console.error('❌ Erreur API messages:', errorData)
                throw new Error(`Erreur ${response.status}: ${errorData.message || 'Impossible de charger les messages'}`)
            }

            const data = await response.json()
            console.log('✅ Messages chargés:', data.length)

            set({ messages: data, isLoading: false })
        } catch (error) {
            console.error('❌ Erreur chargement messages:', error)
            set({
                error: error instanceof Error ? error.message : 'Erreur de chargement',
                isLoading: false,
            })
        }
    },

    sendMessage: async (content: string, targetUserId: string) => {
        set({ isSending: true, error: null })

        try {
            console.log('📤 Envoi message à:', targetUserId)

            // 🔥 CORRECTIONS:
            // 1. Utiliser /api/message (singulier)
            // 2. Utiliser targetUserId au lieu de target_user_id
            const response = await fetch('/api/message', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    content,
                    targetUserId: targetUserId,
                    type: 'private'
                }),
            })

            console.log('📥 Réponse envoi - Status:', response.status)

            if (response.status === 401) {
                throw new Error('Session expirée - Veuillez vous reconnecter')
            }

            if (!response.ok) {
                const errorData = await response.json()
                console.error('❌ Erreur API envoi:', errorData)
                throw new Error(`Erreur ${response.status}: ${errorData.message || "Impossible d'envoyer le message"}`)
            }

            const responseData = await response.json()
            console.log('✅ Réponse complète:', responseData)

            // 🔥 CORRECTION: Extraire le message de la réponse
            const newMessage = responseData.message || responseData
            console.log('✅ Message envoyé:', newMessage)

            // Ajouter le message à la liste
            set(state => ({
                messages: [...state.messages, newMessage],
                isSending: false,
            }))

        } catch (error) {
            console.error('❌ Erreur envoi message:', error)
            set({
                error: error instanceof Error ? error.message : "Erreur d'envoi",
                isSending: false,
            })
            throw error
        }
    },

    setCurrentConversation: (conversation: Conversation | null) => {
        console.log('💬 Conversation sélectionnée:', conversation?.name)
        set({ currentConversation: conversation, messages: [] })
    },

    createPrivateConversation: (user: User): Conversation => {
        console.log('🆕 Création conversation avec:', user.username)

        return {
            id: `private_${user.id}`,
            name: user.username,
            type: 'private',
            target_user_id: user.id,
        }
    },

    clearError: () => set({ error: null }),
}))