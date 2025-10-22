// types/index.ts
export interface User {
    id: string
    username: string
    email: string
    external_id: string
    last_connection: string
}

export interface Message {
    id: string
    content: string
    sender_id: string
    sender_username?: string
    timestamp: Date
    conversation_id: string
    type: 'private' | 'room'
}

export interface Room {
    id: string
    name: string
    description?: string
    created_at: string
}

export interface AuthState {
    token: string | null
    user: User | null
    isLoggedIn: boolean
    isLoading: boolean
}