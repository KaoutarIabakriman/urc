// components/ChatContainer.tsx
import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Box } from '@mui/material'
import ChatSidebar from './ChatSidebar'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { useChatStore } from '../stores/useChatStore'

const ChatContainer: React.FC = () => {
    const { userId } = useParams<{ userId?: string }>()
    const {
        setCurrentConversation,
        users,
        createPrivateConversation,
        currentConversation
    } = useChatStore()

    // 🔥 Charger la conversation quand l'URL change
    useEffect(() => {
        if (userId) {
            console.log('🔄 Chargement conversation depuis URL:', userId)
            const targetUser = users.find(u => u.id === userId)
            if (targetUser) {
                const conversation = createPrivateConversation(targetUser)
                setCurrentConversation(conversation)
                console.log('✅ Conversation chargée depuis URL:', targetUser.username)
            } else {
                console.warn('⚠️ Utilisateur non trouvé pour userId:', userId)
            }
        }
    }, [userId, users, setCurrentConversation, createPrivateConversation])

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <ChatSidebar />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <MessageList />
                <MessageInput />
            </Box>
        </Box>
    )
}

export default ChatContainer