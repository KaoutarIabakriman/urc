// pages/Chat.tsx
import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Box } from '@mui/material'
import ChatContainer from '../components/ChatContainer'
import { useChatStore } from '../stores/useChatStore'

const Chat: React.FC = () => {
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
            }
        } else {
            // 🔥 Si pas de userId, réinitialiser la conversation courante
            setCurrentConversation(null)
        }
    }, [userId, users, setCurrentConversation, createPrivateConversation])

    return (
        <Box sx={{ height: '100vh' }}>
            <ChatContainer />
        </Box>
    )
}

export default Chat