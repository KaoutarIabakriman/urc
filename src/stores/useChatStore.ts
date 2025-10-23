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
    type: 'private' | 'room'
}

export interface Conversation {
    id: string
    name: string
    type: 'private'
    target_user_id?: string
    last_message?: string
    unread_count?: number
}

export interface Room {
    id: string
    name: string
    created_on: string
    created_by: string
    member_count: number
    type: 'room'
}

export interface RoomMessage {
    id: string
    content: string
    sender_id: string
    sender_username: string
    timestamp: Date | string
    room_id: string
    type: 'room'
}

interface ChatState {
    users: User[]
    messages: Message[]
    currentConversation: Conversation | null
    isLoading: boolean
    isSending: boolean
    error: string | null
    rooms: Room[]
    roomMessages: RoomMessage[]
    currentRoom: Room | null

    fetchUsers: () => Promise<void>
    loadMessages: (targetUserId: string) => Promise<void>
    sendMessage: (content: string, targetUserId: string) => Promise<void>
    setCurrentConversation: (conversation: Conversation | null) => void
    createPrivateConversation: (user: User) => Conversation
    clearError: () => void
    fetchRooms: () => Promise<void>
    loadRoomMessages: (roomId: string) => Promise<void>
    sendRoomMessage: (content: string, roomId: string) => Promise<void>
    setCurrentRoom: (room: Room | null) => void
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')

    if (!token) {
        throw new Error('Token manquant - Veuillez vous reconnecter')
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
}

// 🔥 FONCTION HELPER POUR GÉRER LES ERREURS
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return 'Une erreur inconnue est survenue'
}

export const useChatStore = create<ChatState>((set, get) => ({
    users: [],
    messages: [],
    currentConversation: null,
    isLoading: false,
    isSending: false,
    error: null,
    rooms: [],
    roomMessages: [],
    currentRoom: null,

    // ========== CONVERSATIONS PRIVÉES ==========

    fetchUsers: async () => {
        set({ isLoading: true, error: null })

        try {
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: getAuthHeaders(),
            })

            if (response.status === 401) {
                throw new Error('Session expirée - Veuillez vous reconnecter')
            }

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}`)
            }

            const data = await response.json()
            set({ users: data, isLoading: false })
        } catch (error) {
            console.error('❌ Erreur récupération utilisateurs:', error)
            set({
                error: getErrorMessage(error), // 🔥 CORRECTION ICI
                isLoading: false,
            })
            throw error
        }
    },

    loadMessages: async (targetUserId: string) => {
        set({ isLoading: true, error: null })

        try {
            const response = await fetch(`/api/messages?targetUserId=${targetUserId}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            })

            if (response.status === 401) {
                throw new Error('Session expirée - Veuillez vous reconnecter')
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`Erreur ${response.status}: ${errorData.message || 'Impossible de charger les messages'}`)
            }

            const data = await response.json()
            set({ messages: data, isLoading: false })
        } catch (error) {
            console.error('❌ Erreur chargement messages:', error)
            set({
                error: getErrorMessage(error), // 🔥 CORRECTION ICI
                isLoading: false,
            })
        }
    },

    sendMessage: async (content: string, targetUserId: string) => {
        set({ isSending: true, error: null })

        try {
            const response = await fetch('/api/message', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    content,
                    targetUserId: targetUserId,
                    type: 'private'
                }),
            })

            if (response.status === 401) {
                throw new Error('Session expirée - Veuillez vous reconnecter')
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`Erreur ${response.status}: ${errorData.message || "Impossible d'envoyer le message"}`)
            }

            const responseData = await response.json()
            const newMessage = responseData.message || responseData

            set(state => ({
                messages: [...state.messages, newMessage],
                isSending: false,
            }))

        } catch (error) {
            console.error('❌ Erreur envoi message:', error)
            set({
                error: getErrorMessage(error), // 🔥 CORRECTION ICI
                isSending: false,
            })
            throw error
        }
    },

    setCurrentConversation: (conversation: Conversation | null) => {
        console.log('💬 [STORE] setCurrentConversation appelé avec:', conversation?.name || 'null')
        set({
            currentConversation: conversation,
            messages: [],
            // 🔥 ENLEVER: currentRoom: null
        })
        console.log('💬 [STORE] setCurrentConversation terminé')
    },

    setCurrentRoom: (room: Room | null) => {
        console.log('🏠 [STORE] setCurrentRoom appelé avec:', room?.name || 'null')
        set({
            currentRoom: room,
            roomMessages: [],
            // 🔥 ENLEVER: currentConversation: null
        })
        console.log('🏠 [STORE] setCurrentRoom terminé')
    },
    createPrivateConversation: (user: User): Conversation => {
        return {
            id: `private_${user.id}`,
            name: user.username,
            type: 'private',
            target_user_id: user.id,
        }
    },

    clearError: () => set({ error: null }),

    // ========== SALONS ==========

    fetchRooms: async () => {
        set({ isLoading: true, error: null })
        try {
            const response = await fetch('/api/rooms', {
                method: 'GET',
                headers: getAuthHeaders(),
            })

            if (response.status === 401) {
                throw new Error('Session expirée - Veuillez vous reconnecter')
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`Erreur ${response.status}: ${errorData.message || 'Impossible de charger les salons'}`)
            }

            const rooms = await response.json()
            set({ rooms, isLoading: false })
        } catch (error) {
            console.error('❌ Erreur chargement salons:', error)
            set({
                error: getErrorMessage(error), // 🔥 CORRECTION ICI
                isLoading: false,
            })
        }
    },

    loadRoomMessages: async (roomId: string) => {
        set({ isLoading: true, error: null })
        try {
            const response = await fetch(`/api/room-messages?roomId=${roomId}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            })

            if (response.status === 401) {
                throw new Error('Session expirée - Veuillez vous reconnecter')
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`Erreur ${response.status}: ${errorData.message || 'Impossible de charger les messages du salon'}`)
            }

            const messages = await response.json()
            set({ roomMessages: messages, isLoading: false })
        } catch (error) {
            console.error('❌ Erreur chargement messages salon:', error)
            set({
                error: getErrorMessage(error), // 🔥 CORRECTION ICI
                isLoading: false,
            })
        }
    },

    sendRoomMessage: async (content: string, roomId: string) => {
        set({ isSending: true, error: null })
        try {
            const response = await fetch('/api/room-messages', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ roomId, content }),
            })

            if (response.status === 401) {
                throw new Error('Session expirée - Veuillez vous reconnecter')
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`Erreur ${response.status}: ${errorData.message || "Impossible d'envoyer le message"}`)
            }

            const data = await response.json()

            set(state => ({
                roomMessages: [...state.roomMessages, data.message],
                isSending: false,
            }))

        } catch (error) {
            console.error('❌ Erreur envoi message salon:', error)
            set({
                error: getErrorMessage(error), // 🔥 CORRECTION ICI
                isSending: false,
            })
            throw error
        }
    },



}))